const EXECUTOR_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const deny = (reason) => ({
  decision: "DENY",
  dispatch: false,
  executionAuthorized: false,
  reason
});

function valid(input) {
  return Boolean(
    input &&
    SAFE_ID.test(input.taskKey || "") &&
    SAFE_ID.test(input.attemptId || "") &&
    EXECUTOR_ID.test(input.executorId || "") &&
    Number.isSafeInteger(input.now) && input.now > 0 &&
    Number.isSafeInteger(input.ttlSeconds) &&
    input.ttlSeconds >= 1 && input.ttlSeconds <= 900
  );
}

function sameLease(row, input, principal, expectedGeneration) {
  return Boolean(
    row &&
    row.task_key === input.taskKey &&
    row.executor_id === input.executorId &&
    row.current_attempt_id === input.attemptId &&
    row.attempt_id === input.attemptId &&
    row.task_state === "leased" &&
    row.lease_owner === principal.subject &&
    row.lease_attempt_id === input.attemptId &&
    row.lease_generation === expectedGeneration &&
    row.lease_expires_at === input.now + input.ttlSeconds &&
    row.attempt_status === "running" &&
    row.attempt_lease_generation === expectedGeneration &&
    row.started_at === input.now &&
    row.event_id === `lease-acquired:${input.attemptId}:${expectedGeneration}` &&
    row.event_actor_id === principal.subject &&
    row.event_generation === expectedGeneration
  );
}

async function readLease(db, input) {
  return db.prepare(`
    SELECT t.task_key, t.executor_id, t.current_attempt_id, t.state AS task_state,
           t.lease_owner, t.lease_attempt_id, t.lease_generation, t.lease_expires_at,
           a.attempt_id, a.status AS attempt_status,
           a.lease_generation AS attempt_lease_generation, a.started_at,
           e.event_id, e.actor_id AS event_actor_id,
           e.lease_generation AS event_generation
      FROM pool_tasks t
      JOIN pool_attempts a ON a.attempt_id = t.current_attempt_id AND a.task_key = t.task_key
      LEFT JOIN pool_attempt_events e ON e.attempt_id = a.attempt_id
        AND e.event_type = 'lease.acquired'
        AND e.lease_generation = t.lease_generation
     WHERE t.task_key = ?
  `).bind(input.taskKey).first();
}

/**
 * Local D1 lease adapter. The caller must inject an authenticator backed by
 * the trusted controller/runtime; this module never treats caller-supplied
 * executor or owner strings as authentication. No dispatch is performed.
 */
export async function acquireAttemptLease(db, input, authenticateExecutor) {
  if (!valid(input)) return deny("INVALID_LEASE_REQUEST");
  if (!db || typeof db.prepare !== "function" || typeof db.withSession !== "function" ||
      typeof authenticateExecutor !== "function") return deny("LEASE_AUTHORITY_UNAVAILABLE");

  let principal;
  try {
    principal = await authenticateExecutor(input.authContext, {
      executorId: input.executorId,
      capabilityProfile: "jarvis-code-sandbox-v1",
      taskKey: input.taskKey,
      attemptId: input.attemptId
    });
  } catch {
    return deny("EXECUTOR_AUTHENTICATION_FAILED");
  }

  if (!principal || principal.authenticated !== true ||
      !EXECUTOR_ID.test(principal.executorId || "") ||
      !SAFE_ID.test(principal.subject || "") ||
      principal.executorId !== input.executorId ||
      principal.capabilityProfile !== "jarvis-code-sandbox-v1") {
    return deny("EXECUTOR_PRINCIPAL_BINDING_INVALID");
  }

  let updateAttempted = false;
  try {
    const primary = db.withSession("first-primary");
    const current = await primary.prepare(`
      SELECT t.task_key, t.executor_id, t.state, t.current_attempt_id,
             t.lease_generation, t.lease_owner, t.lease_expires_at,
             a.status AS attempt_status, a.lease_generation AS attempt_generation
        FROM pool_tasks t
        JOIN pool_attempts a ON a.attempt_id = t.current_attempt_id AND a.task_key = t.task_key
       WHERE t.task_key = ?
    `).bind(input.taskKey).first();

    if (!current || current.executor_id !== principal.executorId ||
        current.current_attempt_id !== input.attemptId) return deny("TASK_EXECUTOR_OR_ATTEMPT_MISMATCH");
    if (current.state !== "pending" || current.attempt_status !== "prepared" ||
        current.lease_owner !== null || current.lease_expires_at !== null) {
      return deny("TASK_NOT_LEASE_ACQUIRABLE");
    }

    const expectedGeneration = current.lease_generation + 1;
    if (!Number.isSafeInteger(expectedGeneration) || expectedGeneration < 1 ||
        current.attempt_generation !== 0) return deny("LEASE_GENERATION_INVALID");

    updateAttempted = true;
    await db.prepare(`
      UPDATE pool_tasks
         SET state = 'leased', lease_owner = ?, lease_generation = ?,
             lease_expires_at = ?, lease_attempt_id = current_attempt_id,
             updated_at = ?
       WHERE task_key = ? AND executor_id = ? AND state = 'pending'
         AND current_attempt_id = ? AND lease_generation = ?
         AND EXISTS (
           SELECT 1 FROM pool_attempts a
            WHERE a.attempt_id = pool_tasks.current_attempt_id
              AND a.task_key = pool_tasks.task_key
              AND a.status = 'prepared' AND a.lease_generation = 0
         )
    `).bind(
      principal.subject, expectedGeneration, input.now + input.ttlSeconds,
      input.now, input.taskKey, principal.executorId, input.attemptId,
      current.lease_generation
    ).run();

    const readDb = db.withSession("first-primary");
    const committed = await readLease(readDb, input);
    if (!sameLease(committed, input, principal, expectedGeneration)) {
      return deny("LEASE_COMMIT_READBACK_MISMATCH");
    }
    return {
      decision: "LEASE_ACQUIRED",
      taskKey: input.taskKey,
      attemptId: input.attemptId,
      executorId: principal.executorId,
      leaseOwner: principal.subject,
      leaseGeneration: expectedGeneration,
      leaseExpiresAt: input.now + input.ttlSeconds,
      dispatch: false,
      executionAuthorized: false
    };
  } catch {
    if (!updateAttempted) return deny("LEASE_PRECONDITION_READ_FAILED");
    try {
      const recovery = db.withSession("first-primary");
      const observed = await readLease(recovery, input);
      if (!observed) return deny("LEASE_OUTCOME_UNCONFIRMED");
      const expectedGeneration = observed.lease_generation;
      if (!sameLease(observed, input, principal, expectedGeneration)) {
        return deny("LEASE_OUTCOME_UNCONFIRMED");
      }
      return {
        decision: "LEASE_ALREADY_COMMITTED",
        taskKey: input.taskKey,
        attemptId: input.attemptId,
        executorId: principal.executorId,
        leaseOwner: principal.subject,
        leaseGeneration: expectedGeneration,
        leaseExpiresAt: input.now + input.ttlSeconds,
        dispatch: false,
        executionAuthorized: false,
        reason: "AMBIGUOUS_WRITE_RESOLVED_BY_PRIMARY_READBACK"
      };
    } catch {
      return deny("LEASE_OUTCOME_UNCONFIRMED");
    }
  }
}
