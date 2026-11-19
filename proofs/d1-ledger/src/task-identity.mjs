const NUMERIC_ID = /^[0-9]+$/;
const SHA40 = /^[a-f0-9]{40}$/;
const EXECUTOR_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const CAPABILITY_PROFILE = /^[a-z0-9][a-z0-9._-]{0,63}$/;

/**
 * Canonical logical task identity v2.
 * Executor identity is an independent dimension from capability profile.
 * The returned tuple is versioned; changing its order/fields requires v3.
 */
export function canonicalTaskIdentity(input) {
  if (!input || !NUMERIC_ID.test(input.repositoryId ?? "") ||
      !Number.isSafeInteger(input.issueNumber) || input.issueNumber <= 0 ||
      !SHA40.test(input.targetSha ?? "") ||
      !CAPABILITY_PROFILE.test(input.profile ?? "") ||
      !EXECUTOR_ID.test(input.executorId ?? "")) {
    throw new TypeError("INVALID_TASK_IDENTITY");
  }

  return Object.freeze([
    "pool-task-v2",
    input.repositoryId,
    input.issueNumber,
    input.targetSha,
    input.profile,
    input.executorId,
    2
  ]);
}

export async function canonicalTaskKey(input) {
  const canonical = JSON.stringify(canonicalTaskIdentity(input));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical)
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
