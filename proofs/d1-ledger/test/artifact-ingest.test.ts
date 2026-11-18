import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { ingestArtifact } from "../src/artifact-ingest.mjs";

let sequence = 0;
function uploadId() {
  sequence += 1;
  return `artifact_upload_${String(sequence).padStart(16, "0")}`;
}
function stream(parts, fail = false) {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < parts.length) controller.enqueue(new TextEncoder().encode(parts[index++]));
      else if (fail) controller.error(new Error("simulated source read failure"));
      else controller.close();
    }
  });
}
async function sha256(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

describe("trusted R2 artifact ingest proof", () => {
  it("hashes the received bytes and ignores a caller-supplied digest", async () => {
    const id = uploadId();
    const result = await ingestArtifact(env.ARTIFACTS, {
      uploadId: id, body: stream(["trusted ", "artifact"]), declaredSize: 16,
      sha256: "0".repeat(64)
    });
    expect(result.decision).toBe("ARTIFACT_STORED");
    expect(result.artifact).toMatchObject({
      objectKey: `ingest/${id}`, uploadId: id, byteLength: 16,
      sha256: await sha256("trusted artifact")
    });
    expect(result.artifact.objectVersion).toBeTruthy();
    expect((await env.ARTIFACTS.head(`ingest/${id}`))?.version).toBe(result.artifact.objectVersion);
  });

  it("rejects declared-length mismatch without publishing an object", async () => {
    const id = uploadId();
    const result = await ingestArtifact(env.ARTIFACTS, {
      uploadId: id, body: stream(["short"]), declaredSize: 99
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "ARTIFACT_DECLARED_SIZE_MISMATCH", dispatch: false });
    expect(await env.ARTIFACTS.head(`ingest/${id}`)).toBeNull();
  });

  it("rejects a stream that exceeds the configured byte cap", async () => {
    const id = uploadId();
    const result = await ingestArtifact(env.ARTIFACTS, {
      uploadId: id, body: stream(["1234", "5678"]), maxBytes: 5
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "ARTIFACT_SIZE_LIMIT_EXCEEDED", dispatch: false });
    expect(await env.ARTIFACTS.head(`ingest/${id}`)).toBeNull();
  });

  it("fails closed when the source stream errors", async () => {
    const id = uploadId();
    const result = await ingestArtifact(env.ARTIFACTS, {
      uploadId: id, body: stream(["partial"], true)
    });
    expect(result).toMatchObject({ decision: "DENY", reason: "ARTIFACT_STREAM_OR_STORAGE_FAILED", dispatch: false });
    expect(await env.ARTIFACTS.head(`ingest/${id}`)).toBeNull();
  });

  it("is idempotent for an exact byte-for-byte retry", async () => {
    const id = uploadId();
    const first = await ingestArtifact(env.ARTIFACTS, {
      uploadId: id, body: stream(["same ", "bytes"]), declaredSize: 10
    });
    const retry = await ingestArtifact(env.ARTIFACTS, {
      uploadId: id, body: stream(["same bytes"]), declaredSize: 10
    });
    expect(first.decision).toBe("ARTIFACT_STORED");
    expect(retry.decision).toBe("ARTIFACT_ALREADY_STORED");
    expect(retry.artifact).toMatchObject({
      objectKey: first.artifact.objectKey,
      objectVersion: first.artifact.objectVersion,
      sha256: first.artifact.sha256,
      byteLength: first.artifact.byteLength
    });
  });

  it("rejects a retry that substitutes bytes under the same upload identity", async () => {
    const id = uploadId();
    await ingestArtifact(env.ARTIFACTS, { uploadId: id, body: stream(["original"]) });
    const conflict = await ingestArtifact(env.ARTIFACTS, { uploadId: id, body: stream(["substituted"]) });
    expect(conflict).toMatchObject({ decision: "DENY", reason: "ARTIFACT_CONTENT_CONFLICT", dispatch: false });
  });

  it("detects overwrite/substitution before an idempotent retry is accepted", async () => {
    const id = uploadId();
    const first = await ingestArtifact(env.ARTIFACTS, { uploadId: id, body: stream(["original"]) });
    await env.ARTIFACTS.put(first.artifact.objectKey, "tampered", {
      customMetadata: { uploadId: id }
    });
    const retry = await ingestArtifact(env.ARTIFACTS, { uploadId: id, body: stream(["original"]) });
    expect(retry).toMatchObject({ decision: "DENY", reason: "ARTIFACT_CONTENT_CONFLICT", dispatch: false });
  });

  it("rejects invalid trusted upload identities and unsafe size limits", async () => {
    expect(await ingestArtifact(env.ARTIFACTS, { uploadId: "short", body: stream(["x"]) }))
      .toMatchObject({ decision: "DENY", reason: "INVALID_ARTIFACT_INGEST", dispatch: false });
    expect(await ingestArtifact(env.ARTIFACTS, { uploadId: uploadId(), body: stream(["x"]), maxBytes: 0 }))
      .toMatchObject({ decision: "DENY", reason: "INVALID_ARTIFACT_SIZE", dispatch: false });
  });
});
