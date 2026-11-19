const OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const OIDC_JWKS_URL = "https://token.actions.githubusercontent.com/.well-known/jwks";
const MAX_CLOCK_SKEW_SECONDS = 60;
const deny = (reason) => Object.freeze({
  decision: "DENY",
  executionAuthorized: false,
  dispatch: false,
  reason
});

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function equalString(actual, expected) {
  return typeof expected === "string" && expected.length > 0 && actual === expected;
}

async function getJson(fetchImpl, url) {
  const response = await fetchImpl(url, { method: "GET", redirect: "error", headers: {
    Accept: "application/json"
  } });
  if (!response || response.status !== 200) throw new Error("OIDC_JWKS_HTTP_ERROR");
  return response.json();
}

/**
 * Verify a GitHub Actions OIDC JWT and bind its claims to an owner-reviewed
 * executor registry entry. This authenticates the GitHub Actions workflow
 * principal, NOT the executable/process running inside that job.
 */
export async function verifyGitHubActionsExecutorIdentity({
  token,
  expected,
  fetchImpl = globalThis.fetch,
  cryptoImpl = globalThis.crypto,
  nowSeconds = Math.floor(Date.now() / 1000)
} = {}) {
  if (typeof token !== "string" || token.length === 0) return deny("OIDC_TOKEN_MISSING");
  if (typeof fetchImpl !== "function" || !cryptoImpl?.subtle) return deny("OIDC_VERIFIER_UNAVAILABLE");
  if (!expected || typeof expected !== "object") return deny("OIDC_EXPECTED_BINDING_MISSING");

  const parts = token.split(".");
  if (parts.length !== 3) return deny("OIDC_TOKEN_MALFORMED");

  let header, claims, signature, signingInput;
  try {
    header = decodeJsonPart(parts[0]);
    claims = decodeJsonPart(parts[1]);
    signature = decodeBase64Url(parts[2]);
    signingInput = new TextEncoder().encode(parts[0] + "." + parts[1]);
  } catch {
    return deny("OIDC_TOKEN_MALFORMED");
  }

  if (header?.alg !== "RS256" || typeof header?.kid !== "string" || header.kid.length === 0) {
    return deny("OIDC_TOKEN_ALGORITHM_REJECTED");
  }
  if (claims?.iss !== OIDC_ISSUER) return deny("OIDC_ISSUER_MISMATCH");
  const audienceMatches = claims.aud === expected.audience ||
    (Array.isArray(claims.aud) && claims.aud.includes(expected.audience));
  if (!audienceMatches || typeof expected.audience !== "string" || !expected.audience) {
    return deny("OIDC_AUDIENCE_MISMATCH");
  }
  if (!equalString(claims.sub, expected.subject) ||
      !equalString(claims.repository, expected.repository) ||
      !equalString(String(claims.repository_id ?? ""), String(expected.repositoryId ?? "")) ||
      !equalString(String(claims.repository_owner_id ?? ""), String(expected.repositoryOwnerId ?? "")) ||
      !equalString(claims.workflow_ref, expected.workflowRef) ||
      !equalString(claims.job_workflow_ref, expected.jobWorkflowRef)) {
    return deny("OIDC_WORKFLOW_BINDING_MISMATCH");
  }

  const exp = Number(claims.exp);
  const nbf = Number(claims.nbf ?? 0);
  const iat = Number(claims.iat);
  if (!Number.isFinite(exp) || !Number.isFinite(iat) ||
      exp <= nowSeconds - MAX_CLOCK_SKEW_SECONDS ||
      nbf > nowSeconds + MAX_CLOCK_SKEW_SECONDS ||
      iat > nowSeconds + MAX_CLOCK_SKEW_SECONDS ||
      exp <= iat || exp - iat > 3600) {
    return deny("OIDC_TOKEN_TIME_INVALID");
  }

  try {
    const jwks = await getJson(fetchImpl, OIDC_JWKS_URL);
    if (!Array.isArray(jwks?.keys)) return deny("OIDC_JWKS_INVALID");
    const matches = jwks.keys.filter((key) => key?.kid === header.kid && key?.kty === "RSA" &&
      (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig"));
    if (matches.length !== 1) return deny("OIDC_SIGNING_KEY_NOT_FOUND");

    const publicKey = await cryptoImpl.subtle.importKey(
      "jwk", matches[0], { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
    );
    const valid = await cryptoImpl.subtle.verify(
      "RSASSA-PKCS1-v1_5", publicKey, signature, signingInput
    );
    if (!valid) return deny("OIDC_SIGNATURE_INVALID");
  } catch {
    return deny("OIDC_SIGNATURE_VERIFICATION_FAILED");
  }

  return Object.freeze({
    decision: "GITHUB_ACTIONS_WORKFLOW_AUTHENTICATED",
    issuer: OIDC_ISSUER,
    subject: claims.sub,
    repository: claims.repository,
    repositoryId: String(claims.repository_id),
    workflowRef: claims.workflow_ref,
    jobWorkflowRef: claims.job_workflow_ref,
    tokenIssuedAt: iat,
    tokenExpiresAt: exp,
    executorProcessAttested: false,
    executionAuthorized: false,
    dispatch: false
  });
}
