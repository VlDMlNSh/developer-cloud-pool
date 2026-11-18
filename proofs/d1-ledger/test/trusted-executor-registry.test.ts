import { describe, expect, it } from "vitest";
import { resolveTrustedExecutorAssignment } from "../src/trusted-executor-registry.mjs";

const HEAD = "a".repeat(40);
const registry = {
  schemaVersion: 1,
  repositoryId: "1445644538",
  defaultBranch: "Основной",
  executors: [
    { executorId: "claude-code-1", status: "enabled", profiles: ["dsh-headless-probe"], oidcBinding: { audience: "https://github.com/VlDMlNSh/developer-cloud-pool", subject: "repo:VlDMlNSh/developer-cloud-pool:environment:pool-executor-claude-code-1", workflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/pool-executor.yml@refs/heads/Основной", jobWorkflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/pool-executor.yml@refs/heads/Основной" } },
    { executorId: "codex-1", status: "disabled", profiles: ["dsh-headless-probe"] }
  ]
};

function base64Json(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fakeFetch({ branchBody = { name: "Основной", commit: { sha: HEAD } },
  fileBody = { path: ".github/pool-executor-registry.json", encoding: "base64", sha: "b".repeat(40), content: base64Json(registry) },
  fileStatus = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/branches/")) return { status: 200, json: async () => branchBody };
    return { status: fileStatus, json: async () => fileBody };
  };
  return { fetchImpl, calls };
}

describe("trusted GitHub executor registry resolver", () => {
  it("pins the registry read to an independently fetched default-branch HEAD", async () => {
    const { fetchImpl, calls } = fakeFetch();
    const result = await resolveTrustedExecutorAssignment({
      executorId: "claude-code-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({
      decision: "TRUSTED_ASSIGNMENT",
      executorId: "claude-code-1",
      profile: "dsh-headless-probe",
      trustedDefaultHeadSha: HEAD,
      source: "GITHUB_DEFAULT_BRANCH_CONTENTS_AT_VERIFIED_HEAD",
      executionAuthorized: false,
      dispatch: false
    });
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toContain("?ref=" + HEAD);
  });

  it("rejects a caller-selected executor absent from the owner registry", async () => {
    const { fetchImpl } = fakeFetch();
    const result = await resolveTrustedExecutorAssignment({
      executorId: "gemini-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "EXECUTOR_NOT_REGISTERED", dispatch: false });
  });

  it("rejects a registered but disabled executor", async () => {
    const { fetchImpl } = fakeFetch();
    const result = await resolveTrustedExecutorAssignment({
      executorId: "codex-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "EXECUTOR_NOT_ENABLED" });
  });

  it("rejects an executor without the requested capability profile", async () => {
    const altered = { ...registry, executors: [
      { executorId: "claude-code-1", status: "enabled", profiles: [], oidcBinding: registry.executors[0].oidcBinding }
    ] };
    const { fetchImpl } = fakeFetch({
      fileBody: { path: ".github/pool-executor-registry.json", encoding: "base64", content: base64Json(altered) }
    });
    const result = await resolveTrustedExecutorAssignment({
      executorId: "claude-code-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "EXECUTOR_PROFILE_NOT_APPROVED" });
  });

  it("rejects malformed or non-default-branch provenance", async () => {
    const { fetchImpl } = fakeFetch({ branchBody: { name: "feature", commit: { sha: HEAD } } });
    const result = await resolveTrustedExecutorAssignment({
      executorId: "claude-code-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "UNTRUSTED_DEFAULT_BRANCH_RESPONSE" });
  });

  it("rejects registry content whose repository identity differs", async () => {
    const altered = { ...registry, repositoryId: "999999" };
    const { fetchImpl } = fakeFetch({
      fileBody: { path: ".github/pool-executor-registry.json", encoding: "base64", content: base64Json(altered) }
    });
    const result = await resolveTrustedExecutorAssignment({
      executorId: "claude-code-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "EXECUTOR_REGISTRY_IDENTITY_MISMATCH" });
  });

  it("fails closed when GitHub API lookup fails", async () => {
    const { fetchImpl } = fakeFetch({ fileStatus: 404 });
    const result = await resolveTrustedExecutorAssignment({
      executorId: "claude-code-1", profile: "dsh-headless-probe", fetchImpl
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "TRUSTED_EXECUTOR_LOOKUP_FAILED" });
  });

  it.each(["claude-code-0", "codex-x", "gemini-", "dsh-headless-probe"])(
    "rejects invalid executor ID %s before network access", async (executorId) => {
      const { fetchImpl, calls } = fakeFetch();
      const result = await resolveTrustedExecutorAssignment({
        executorId, profile: "dsh-headless-probe", fetchImpl
      });
      expect(result).toMatchObject({ decision: "DENY", reason: "INVALID_EXECUTOR_ID" });
      expect(calls).toHaveLength(0);
    }
  );
});
