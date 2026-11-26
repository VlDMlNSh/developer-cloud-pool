import { describe, expect, it } from "vitest";
import { canonicalTaskIdentity, canonicalTaskKey } from "../src/task-identity.mjs";

const base = Object.freeze({
  repositoryId: "20002",
  issueNumber: 42,
  targetSha: "b".repeat(40),
  profile: "jarvis-code-sandbox-v1",
  executorId: "executor-alpha"
});

describe("executor-bound canonical task identity v2", () => {
  it("is deterministic for the same complete identity", async () => {
    await expect(canonicalTaskKey(base)).resolves.toBe(await canonicalTaskKey({ ...base }));
  });

  it("separates different executor identities", async () => {
    const alpha = await canonicalTaskKey(base);
    const beta = await canonicalTaskKey({ ...base, executorId: "executor-beta" });
    expect(alpha).not.toBe(beta);
  });

  it("keeps capability profile independent from executor identity", () => {
    const identity = canonicalTaskIdentity(base);
    expect(identity[4]).toBe("jarvis-code-sandbox-v1");
    expect(identity[5]).toBe("executor-alpha");
    expect(identity[4]).not.toBe(identity[5]);
  });

  it("separates capability profiles as a distinct identity dimension", async () => {
    const code = await canonicalTaskKey(base);
    const otherProfile = await canonicalTaskKey({ ...base, profile: "jarvis-media-v1" });
    expect(code).not.toBe(otherProfile);
  });

  it("uses an explicit v2 domain separator and stable field order", () => {
    expect(canonicalTaskIdentity(base)).toEqual([
      "pool-task-v2", "20002", 42, "b".repeat(40),
      "jarvis-code-sandbox-v1", "executor-alpha", 2
    ]);
  });

  it.each([
    [{ ...base, executorId: "" }],
    [{ ...base, executorId: "executor alpha" }],
    [{ ...base, executorId: "x".repeat(129) }],
    [{ ...base, repositoryId: "repo-20002" }],
    [{ ...base, issueNumber: 0 }],
    [{ ...base, targetSha: "not-a-sha" }]
  ])("rejects malformed identity input", (input) => {
    expect(() => canonicalTaskIdentity(input)).toThrow("INVALID_TASK_IDENTITY");
  });
});
