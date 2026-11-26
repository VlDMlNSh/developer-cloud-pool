import { describe, expect, it } from "vitest";
import { verifyGitHubActionsExecutorIdentity } from "../src/github-actions-oidc-verifier.mjs";

const NOW = 1_800_000_000;
const EXPECTED = {
  audience: "https://github.com/VlDMlNSh/developer-cloud-pool",
  subject: "repo:VlDMlNSh/developer-cloud-pool:environment:pool-executor-claude-code-1",
  repository: "VlDMlNSh/developer-cloud-pool",
  repositoryId: "1445644538",
  repositoryOwnerId: "157891068",
  workflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/pool-executor.yml@refs/heads/Основной",
  jobWorkflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/pool-executor.yml@refs/heads/Основной"
};

const b64url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replaceAll("+", "-").replaceAll("/", "_");
};
const encode = (value) => b64url(new TextEncoder().encode(JSON.stringify(value)));

async function fixture({ claimOverrides = {}, headerOverrides = {}, tamperSignature = false } = {}) {
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
  }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";
  const header = { alg: "RS256", typ: "JWT", kid: "test-key", ...headerOverrides };
  const claims = {
    iss: "https://token.actions.githubusercontent.com",
    aud: EXPECTED.audience,
    sub: EXPECTED.subject,
    repository: EXPECTED.repository,
    repository_id: EXPECTED.repositoryId,
    repository_owner_id: EXPECTED.repositoryOwnerId,
    workflow_ref: EXPECTED.workflowRef,
    job_workflow_ref: EXPECTED.jobWorkflowRef,
    iat: NOW - 10,
    nbf: NOW - 10,
    exp: NOW + 300,
    ...claimOverrides
  };
  const unsigned = encode(header) + "." + encode(claims);
  const signature = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(unsigned)
  ));
  if (tamperSignature) signature[0] ^= 1;
  return {
    token: unsigned + "." + b64url(signature),
    fetchImpl: async (url) => ({
      status: 200,
      json: async () => ({ keys: [jwk] })
    })
  };
}

describe("GitHub Actions OIDC executor workflow authentication", () => {
  it("verifies signature and exact workflow/repository binding", async () => {
    const f = await fixture();
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({
      decision: "GITHUB_ACTIONS_WORKFLOW_AUTHENTICATED",
      repositoryId: "1445644538",
      executorProcessAttested: false,
      executionAuthorized: false,
      dispatch: false
    });
  });

  it("rejects a token with a modified signature", async () => {
    const f = await fixture({ tamperSignature: true });
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_SIGNATURE_INVALID" });
  });

  it("rejects a different environment subject / executor binding", async () => {
    const f = await fixture({ claimOverrides: {
      sub: "repo:VlDMlNSh/developer-cloud-pool:environment:pool-executor-codex-1"
    } });
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_WORKFLOW_BINDING_MISMATCH" });
  });

  it("rejects a different workflow even when repository matches", async () => {
    const f = await fixture({ claimOverrides: { workflow_ref: "attacker/workflow.yml@refs/heads/main" } });
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_WORKFLOW_BINDING_MISMATCH" });
  });

  it("rejects an incorrect audience", async () => {
    const f = await fixture({ claimOverrides: { aud: "https://attacker.invalid" } });
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_AUDIENCE_MISMATCH" });
  });

  it("rejects expired or overlong tokens", async () => {
    const f = await fixture({ claimOverrides: { exp: NOW - 120 } });
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_TOKEN_TIME_INVALID" });
  });

  it("rejects tokens from another repository identity", async () => {
    const f = await fixture({ claimOverrides: { repository_id: "999999" } });
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: f.fetchImpl, nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_WORKFLOW_BINDING_MISMATCH" });
  });

  it("fails closed when signing keys cannot be fetched", async () => {
    const f = await fixture();
    const result = await verifyGitHubActionsExecutorIdentity({
      token: f.token, expected: EXPECTED, fetchImpl: async () => ({ status: 503 }),
      nowSeconds: NOW
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "OIDC_SIGNATURE_VERIFICATION_FAILED" });
  });
});
