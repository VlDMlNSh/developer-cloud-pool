const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_AUTH = /^[A-Za-z0-9._:@/-]{1,256}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function deny(reason) {
  return { decision: "DENY", dispatch: false, executionAuthorized: false, reason };
}

function valid(input) {
  return Boolean(
    input && SAFE_ID.test(input.reconciliationId || "") &&
    input.reconciliationId === "reconcile:" + input.attemptId &&
    SHA256.test(input.taskKey || "") && SAFE_ID.test(input.attemptId || "") &&
    Number.isSafeInteger(input.leaseGeneration) && input.leaseGeneration > 0 &&
    input.evidence && typeof input.evidence === "object"
  );
}

function normalize(claims, input, trustedNow) {
  if (!claims || claims.verified !== true ||
      !SAFE_AUTH.test(claims.issuer || "") ||
      !SAFE_AUTH.test(claims.audience || "") ||
      claims.capability !== "pool.attempt.reconcile" ||
      !SAFE_AUTH.test(claims.subject || "") ||
      !SAFE_ID.test(claims.jti || "") ||
      claims.taskKey !== input.taskKey ||
      claims.attemptId !== input.attemptId ||
      claims.leaseGeneration !== input.leaseGeneration ||
      !SHA256.test(claims.evidenceDigest || "") ||
      !Number.isSafeInteger(claims.issuedAt) ||
      !Number.isSafeInteger(claims.expiresAt) ||
      !Number.isSafeInteger(claims.observedAt) ||
      claims.issuedAt > trustedNow || claims.expiresAt <= trustedNow ||
      claims.expiresAt <= claims.issuedAt ||
      claims.expiresAt - claims.issuedAt > 300 ||
      claims.observedAt <= 0 || claims.observedAt > trustedNow ||
      trustedNow - claims.observedAt > 3600 ||
      !["safe_to_retry", "result_confirmed", "effects_unknown"].includes(claims.decision) ||
      typeof claims.executorStopped !== "boolean" ||
      !["absent", "present", "unknown"].includes(claims.externalEffects)) return null;

  const resultDigest = claims.resultDigest ?? null;
  const provenanceDigest = claims.provenanceDigest ?? null;
  if (claims.decision === "safe_to_retry" &&
      !(claims.executorStopped === true && claims.externalEffects === "absent" &&
        resultDigest === null && provenanceDigest === null)) return null;
  if (claims.decision === "result_confirmed" &&
      !(SHA256.test(resultDigest || "") && SHA256.test(provenanceDigest || ""))) return null;
  if (claims.decision === "effects_unknown" && claims.externalEffects !== "unknown") return null;

  return {
    issuerId: claims.issuer,
    audience: claims.audience,
    capabilityId: claims.capability,
    principalSubject: claims.subject,
    evidenceJti: claims.jti,
    evidenceDigest: claims.evidenceDigest,
    decision: claims.decision,
    executorStopped: claims.executorStopped ? 1 : 0,
    externalEffects: claims.externalEffects,
    resultDigest,
    provenanceDigest,
    observedAt: claims.observedAt
  };
}

function same(row, input, evidence) {
  return Boolean(row &&
    row.reconciliation_id === input.reconciliationId &&
    row.task_key === input.taskKey &&
    row.attempt_id === input.attemptId &&
    row.lease_generation === input.leaseGeneration &&
    row.issuer_id === evidence.issuerId &&
    row.audience === evidence.audience &&
    row.capability_id === evidence.capabilityId &&
    row.principal_subject === evidence.principalSubject &&
    row.evidence_jti === evidence.evidenceJti &&
    row.evidence_digest === evidence.evidenceDigest &&
    row.decision === evidence.decision &&
    row.executor_stopped === evidence.executorStopped &&
    row.external_effects === evidence.externalEffects &&
    row.result_digest === evidence.resultDigest &&
    row.provenance_digest === evidence.provenanceDigest &&
    row.observed_at === evidence.observedAt
  );
}

async function readDecision(db, reconciliationId) {
  return db.prepare(`
    SELECT reconciliation_id, task_key, attempt_id, lease_generation,
           issuer_id, audience, capability_id, principal_subject, evidence_jti, evidence_digest,
           decision, executor_stopped, external_effects, result_digest,
           provenance_digest, observed_at, verified_at
      FROM pool_attempt_reconciliation_decisions
     WHERE reconciliation_id = ?
  `).bind(reconciliationId).first();
}

/**
 * Records a cryptographically verified reconciliation observation.
 * The verifier is an injected trust-boundary dependency with issuer and audience
 * pinned in trusted runtime configuration; it must validate signature, issuer,
 * audience, expiry and claim integrity. The caller cannot select that trust policy.
 * This adapter does
 * not alter the attempt, task, lease, queue, or authorize a retry/dispatch.
 */
export async function recordAttemptReconciliation(db, input, verifyEvidence, trustedClock) {
  if (!valid(input)) return deny("INVALID_RECONCILIATION_REQUEST");
  if (!db || typeof db.prepare !== "function" ||
      typeof db.withSession !== "function" ||
      typeof verifyEvidence !== "function" || typeof trustedClock !== "function") return deny("RECONCILIATION_AUTHORITY_UNAVAILABLE");

  let trustedNow;
  try {
    trustedNow = trustedClock();
  } catch {
    return deny("TRUSTED_CLOCK_UNAVAILABLE");
  }
  if (!Number.isSafeInteger(trustedNow) || trustedNow <= 0) return deny("TRUSTED_CLOCK_UNAVAILABLE");

  let claims;
  try {
    claims = await verifyEvidence(input.evidence, {
      taskKey: input.taskKey,
      attemptId: input.attemptId,
      leaseGeneration: input.leaseGeneration,
      now: trustedNow
    });
  } catch {
    return deny("RECONCILIATION_EVIDENCE_VERIFICATION_FAILED");
  }
  let verifiedNow;
  try {
    verifiedNow = trustedClock();
  } catch {
    return deny("TRUSTED_CLOCK_UNAVAILABLE");
  }
  if (!Number.isSafeInteger(verifiedNow) || verifiedNow <= 0 || verifiedNow < trustedNow) {
    return deny("TRUSTED_CLOCK_UNAVAILABLE");
  }

  // Revalidate time-sensitive claims after asynchronous signature/JWKS verification.
  let evidence = normalize(claims, input, verifiedNow);
  if (!evidence) return deny("RECONCILIATION_EVIDENCE_CLAIMS_INVALID");

  try {
    const primary = db.withSession("first-primary");
    const current = await primary.prepare(`
      SELECT r.reconciliation_id, r.status, r.task_key, r.attempt_id,
             r.input_digest, r.lease_generation, r.expired_lease_owner,
             a.status AS attempt_status, a.lease_generation AS attempt_generation,
             a.indeterminate_at, a.input_digest AS attempt_input_digest,
             t.current_attempt_id, t.lease_attempt_id, t.state AS task_state,
             t.lease_generation AS task_generation, t.lease_owner, t.lease_expires_at
        FROM pool_attempt_reconciliations r
        JOIN pool_attempts a ON a.attempt_id = r.attempt_id AND a.task_key = r.task_key
        JOIN pool_tasks t ON t.task_key = r.task_key
       WHERE r.reconciliation_id = ? AND r.task_key = ? AND r.attempt_id = ?
    `).bind("reconcile:" + input.attemptId, input.taskKey, input.attemptId).first();

    if (!current || current.status !== "pending" ||
        current.input_digest !== current.attempt_input_digest ||
        current.lease_generation !== input.leaseGeneration ||
        current.attempt_generation !== input.leaseGeneration ||
        current.attempt_status !== "indeterminate" ||
        current.current_attempt_id !== input.attemptId ||
        current.lease_attempt_id !== input.attemptId ||
        current.task_state !== "leased" ||
        current.task_generation !== input.leaseGeneration ||
        current.lease_owner !== current.expired_lease_owner ||
        current.lease_expires_at > current.indeterminate_at ||
        evidence.observedAt < current.indeterminate_at) {
      return deny("RECONCILIATION_TARGET_NOT_CURRENT_OR_QUARANTINED");
    }

    // The primary read is asynchronous too: re-check token lifetime immediately
    // before the first durable mutation, not only after signature verification.
    let writeNow;
    try {
      writeNow = trustedClock();
    } catch {
      return deny("TRUSTED_CLOCK_UNAVAILABLE");
    }
    if (!Number.isSafeInteger(writeNow) || writeNow <= 0 || writeNow < verifiedNow) {
      return deny("TRUSTED_CLOCK_UNAVAILABLE");
    }
    evidence = normalize(claims, input, writeNow);
    if (!evidence) return deny("RECONCILIATION_EVIDENCE_CLAIMS_INVALID");
    verifiedNow = writeNow;

    await db.prepare(`
      INSERT INTO pool_attempt_reconciliation_decisions (
        reconciliation_id, task_key, attempt_id, lease_generation,
        issuer_id, audience, capability_id, principal_subject, evidence_jti, evidence_digest,
        decision, executor_stopped, external_effects, result_digest,
        provenance_digest, observed_at, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.reconciliationId, input.taskKey, input.attemptId, input.leaseGeneration,
      evidence.issuerId, evidence.audience, evidence.capabilityId, evidence.principalSubject,
      evidence.evidenceJti, evidence.evidenceDigest, evidence.decision,
      evidence.executorStopped, evidence.externalEffects, evidence.resultDigest,
      evidence.provenanceDigest, evidence.observedAt, verifiedNow
    ).run();

    const committed = await readDecision(db.withSession("first-primary"), input.reconciliationId);
    if (!same(committed, input, evidence) || committed.verified_at !== verifiedNow) {
      return deny("RECONCILIATION_COMMIT_READBACK_MISMATCH");
    }
    return {
      decision: "RECONCILIATION_RECORDED",
      reconciliationId: input.reconciliationId,
      taskKey: input.taskKey,
      attemptId: input.attemptId,
      leaseGeneration: input.leaseGeneration,
      outcome: evidence.decision,
      dispatch: false,
      executionAuthorized: false,
      stateChanged: false,
      retryAuthorized: false
    };
  } catch {
    try {
      const committed = await readDecision(db.withSession("first-primary"), input.reconciliationId);
      if (same(committed, input, evidence)) {
        return {
          decision: "RECONCILIATION_ALREADY_RECORDED",
          reconciliationId: input.reconciliationId,
          taskKey: input.taskKey,
          attemptId: input.attemptId,
          leaseGeneration: input.leaseGeneration,
          outcome: evidence.decision,
          dispatch: false,
          executionAuthorized: false,
          stateChanged: false,
          retryAuthorized: false
        };
      }
    } catch {
      // Do not infer commit state from an unavailable primary read.
    }
    return deny("RECONCILIATION_OUTCOME_UNCONFIRMED");
  }
}
