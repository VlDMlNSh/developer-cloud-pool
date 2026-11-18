import { acquireProjectionDelivery, markProjectionRetryable, reserveProjectionCommentPost, markProjectionCommentVerified } from "./projection-outbox.mjs";
import { projectionEnvelopeFromOutbox } from "./projection-envelope.mjs";
import { reconcileTerminalProjection } from "./projection-reconciler.mjs";

const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function deny(reason, extra = {}) {
  return { decision: "DENY", dispatch: false, projection_verified: false, reason, ...extra };
}

function validNow(clock) {
  try {
    const value = clock.now();
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

async function readProjectionRow(db, outboxId, workerId, generation, now) {
  return db.prepare(`
    SELECT outbox_id, task_key, attempt_id, repository_id, issue_number,
           target_sha, profile, lease_generation, terminal_status, event_digest,
           status, lease_owner, lease_generation_delivery, lease_expires_at,
           comment_post_state, comment_post_attempted_at, comment_post_attempt_generation
      FROM pool_attempt_projection_outbox
     WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
       AND lease_generation_delivery = ? AND lease_expires_at > ?
  `).bind(outboxId, workerId, generation, now).first();
}

async function readDeliveredRow(db, outboxId) {
  return db.prepare(`
    SELECT outbox_id, event_digest, status, lease_owner, lease_expires_at,
           lease_generation_delivery, delivered_at
      FROM pool_attempt_projection_outbox WHERE outbox_id = ?
  `).bind(outboxId).first();
}

/** Private ACK: no exported receipt-free or caller-invokable acknowledgement primitive. */
async function acknowledgeVerifiedProjection(db, identity, workerId, generation, now) {
  const result = await db.prepare(`
    UPDATE pool_attempt_projection_outbox
       SET status = 'delivered', lease_owner = NULL,
           lease_expires_at = NULL, delivered_at = ?, updated_at = ?
     WHERE outbox_id = ? AND event_digest = ? AND status = 'leased'
       AND lease_owner = ? AND lease_generation_delivery = ?
       AND lease_expires_at > ? AND comment_post_state = 'verified'
  `).bind(
    now, now, identity.outboxId, identity.eventDigest,
    workerId, generation, now
  ).run();
  if (result?.success !== true) return deny("PROJECTION_ACK_AMBIGUOUS");
  return { decision: "ACK_ATTEMPTED", changes: result?.meta?.changes ?? 0, dispatch: false };
}

/**
 * Runtime-owned orchestration boundary for the local D1 projection proof.
 * The worker identity, clock and API adapter are wired once by the runtime.
 * Per-delivery callers supply only an outbox ID; they cannot provide a receipt,
 * timestamp, lease owner or delivery generation.
 */
export function createProjectionDeliveryOrchestrator({
  db, api, workerId, clock, leaseSeconds = 60
}) {
  if (!db || typeof db.prepare !== "function" ||
      !SAFE_ID.test(workerId || "") ||
      !clock || typeof clock.now !== "function" ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 900) {
    throw new TypeError("INVALID_PROJECTION_ORCHESTRATOR_CONFIGURATION");
  }

  return Object.freeze({
    async deliver(outboxId) {
      if (!SAFE_ID.test(outboxId || "")) return deny("INVALID_PROJECTION_OUTBOX_ID");
      const leaseNow = validNow(clock);
      if (leaseNow === null) return deny("UNTRUSTED_PROJECTION_CLOCK");

      const lease = await acquireProjectionDelivery(
        db, outboxId, workerId, leaseNow, leaseSeconds
      );
      if (lease.decision !== "PROJECTION_LEASE_ACQUIRED") return lease;

      const generation = lease.lease_generation_delivery;
      const rowNow = validNow(clock);
      if (rowNow === null) return deny("UNTRUSTED_PROJECTION_CLOCK");
      let row;
      try {
        row = await readProjectionRow(db, outboxId, workerId, generation, rowNow);
      } catch {
        return deny("PROJECTION_LEASE_READBACK_AMBIGUOUS");
      }
      if (!row || row.outbox_id !== lease.outbox_id ||
          row.event_digest !== lease.event_digest ||
          row.lease_owner !== workerId ||
          row.lease_generation_delivery !== generation) {
        return deny("PROJECTION_LEASE_IDENTITY_MISMATCH");
      }

      const mapped = projectionEnvelopeFromOutbox(row);
      if (mapped.decision !== "PROJECTION_ENVELOPE_READY") {
        return deny("INVALID_PROJECTION_OUTBOX_ENVELOPE");
      }

      // Always attempt read-only reconciliation first. This discovers an
      // already-visible marker without consuming the one permitted POST.
      let projection;
      try {
        projection = await reconcileTerminalProjection(api, mapped.envelope, { allowPost: false });
      } catch {
        projection = { decision: "RETRYABLE", reason: "PROJECTION_RECONCILIATION_AMBIGUOUS" };
      }

      if (projection?.decision === "RETRYABLE" &&
          projection.reason === "EVENT_MARKER_NOT_VISIBLE" &&
          row.comment_post_state === "not_attempted") {
        const reserveNow = validNow(clock);
        if (reserveNow === null) return deny("UNTRUSTED_PROJECTION_CLOCK");
        const reservation = await reserveProjectionCommentPost(
          db, outboxId, workerId, generation, reserveNow
        );
        if (reservation.decision === "PROJECTION_COMMENT_POST_RESERVED") {
          try {
            projection = await reconcileTerminalProjection(api, mapped.envelope, { allowPost: true });
          } catch {
            projection = { decision: "RETRYABLE", reason: "PROJECTION_RECONCILIATION_AMBIGUOUS" };
          }
        } else {
          projection = { decision: "RETRYABLE", reason: "PROJECTION_COMMENT_POST_RESERVATION_AMBIGUOUS" };
        }
      } else if (projection?.decision === "RETRYABLE" &&
                 projection.reason === "EVENT_MARKER_NOT_VISIBLE" &&
                 row.comment_post_state === "indeterminate") {
        // The first POST may have succeeded. Never POST again on a later lease.
        projection = { decision: "RETRYABLE", reason: "COMMENT_POST_INDETERMINATE" };
      }

      const verified = projection?.decision === "PROJECTION_VERIFIED" &&
        projection.projection_verified === true &&
        projection.eventId === row.outbox_id &&
        projection.payloadDigest === row.event_digest;
      if (!verified) {
        if (projection?.decision === "RETRYABLE") {
          const retryNow = validNow(clock);
          if (retryNow === null) return deny("UNTRUSTED_PROJECTION_CLOCK");
          const reason = /^[A-Z0-9_]{1,64}$/.test(projection.reason || "")
            ? projection.reason : "PROJECTION_RECONCILIATION_RETRYABLE";
          return markProjectionRetryable(
            db, outboxId, workerId, generation, retryNow, reason
          );
        }
        return deny("PROJECTION_RECEIPT_MISMATCH", {
          projectionDecision: projection?.decision || "MISSING",
          dispatch: false
        });
      }

      const verifiedNow = validNow(clock);
      if (verifiedNow === null) return deny("UNTRUSTED_PROJECTION_CLOCK");
      const commentVerified = await markProjectionCommentVerified(
        db, outboxId, workerId, generation, verifiedNow
      );
      if (!["PROJECTION_COMMENT_VERIFIED", "PROJECTION_COMMENT_ALREADY_VERIFIED"].includes(commentVerified.decision)) {
        return deny(commentVerified.reason || "PROJECTION_COMMENT_VERIFICATION_FAILED");
      }

      const ackNow = validNow(clock);
      if (ackNow === null) return deny("UNTRUSTED_PROJECTION_CLOCK");
      let ack;
      try {
        ack = await acknowledgeVerifiedProjection(
          db,
          { outboxId: row.outbox_id, eventDigest: row.event_digest },
          workerId,
          generation,
          ackNow
        );
      } catch {
        ack = deny("PROJECTION_ACK_AMBIGUOUS");
      }

      // Read-back, not the UPDATE response, is the final success condition.
      let delivered;
      try {
        delivered = await readDeliveredRow(db, outboxId);
      } catch {
        return deny("PROJECTION_ACK_READBACK_AMBIGUOUS");
      }
      const confirmed = delivered?.outbox_id === row.outbox_id &&
        delivered.event_digest === row.event_digest &&
        delivered.status === "delivered" &&
        delivered.lease_owner === null &&
        delivered.lease_expires_at === null &&
        delivered.lease_generation_delivery === generation &&
        Number.isSafeInteger(delivered.delivered_at) &&
        delivered.delivered_at > 0;
      if (!confirmed) {
        return deny(ack.reason || "PROJECTION_ACK_READBACK_MISMATCH");
      }
      return {
        decision: "PROJECTION_DELIVERED",
        dispatch: false,
        projection_verified: true,
        outboxId: row.outbox_id,
        eventDigest: row.event_digest,
        deliveryGeneration: generation
      };
    }
  });
}
