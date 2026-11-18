const SAFE_UPLOAD_ID = /^[A-Za-z0-9_-]{16,128}$/;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

function deny(reason) {
  return { decision: "DENY", dispatch: false, reason };
}
function streamFailureReason(error) {
  const message = String(error?.message ?? "");
  if (message.includes("ARTIFACT_SIZE_LIMIT_EXCEEDED")) return "ARTIFACT_SIZE_LIMIT_EXCEEDED";
  if (message.includes("ARTIFACT_DECLARED_SIZE_MISMATCH")) return "ARTIFACT_DECLARED_SIZE_MISMATCH";
  return "ARTIFACT_STREAM_OR_STORAGE_FAILED";
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function digestingBody(body, { maxBytes, declaredSize }) {
  const digest = new crypto.DigestStream("SHA-256");
  const writer = digest.getWriter();
  let byteLength = 0;
  let completed = false;
  const stream = body.pipeThrough(new TransformStream({
    async transform(chunk, controller) {
      if (!(chunk instanceof Uint8Array)) throw new TypeError("ARTIFACT_CHUNK_NOT_UINT8ARRAY");
      byteLength += chunk.byteLength;
      if (!Number.isSafeInteger(byteLength) || byteLength > maxBytes) {
        throw new RangeError("ARTIFACT_SIZE_LIMIT_EXCEEDED");
      }
      await writer.write(chunk);
      controller.enqueue(chunk);
    },
    async flush() {
      if (declaredSize !== undefined && byteLength !== declaredSize) {
        throw new RangeError("ARTIFACT_DECLARED_SIZE_MISMATCH");
      }
      await writer.close();
      completed = true;
    }
  }));
  return {
    stream,
    get byteLength() { return byteLength; },
    get completed() { return completed; },
    digest: async () => hex(await digest.digest)
  };
}

async function digestStoredObject(object, maxBytes) {
  if (!object || !object.body || object.size > maxBytes) return null;
  const digest = new crypto.DigestStream("SHA-256");
  let byteLength = 0;
  const counted = object.body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      byteLength += chunk.byteLength;
      if (!Number.isSafeInteger(byteLength) || byteLength > maxBytes) {
        throw new RangeError("STORED_ARTIFACT_SIZE_LIMIT_EXCEEDED");
      }
      controller.enqueue(chunk);
    }
  }));
  await counted.pipeTo(digest);
  return { sha256: hex(await digest.digest), byteLength };
}

async function reconcileExisting(bucket, key, uploadId, expectedDigest, expectedSize, maxBytes) {
  const existing = await bucket.get(key);
  if (!existing) return deny("STORAGE_WRITE_INDETERMINATE");
  if (existing.customMetadata?.uploadId !== uploadId ||
      existing.size !== expectedSize ||
      !existing.version) return deny("ARTIFACT_IDENTITY_CONFLICT");
  const actual = await digestStoredObject(existing, maxBytes);
  if (!actual) return deny("ARTIFACT_READBACK_FAILED");
  if (actual.byteLength !== expectedSize || actual.sha256 !== expectedDigest) {
    return deny("ARTIFACT_CONTENT_CONFLICT");
  }
  return {
    decision: "ARTIFACT_ALREADY_STORED",
    artifact: {
      objectKey: key,
      objectVersion: existing.version,
      etag: existing.etag,
      sha256: actual.sha256,
      byteLength: actual.byteLength,
      uploadId
    },
    dispatch: false
  };
}

/**
 * Local-only trusted-ingest proof.
 * uploadId must be created/authorized by the trusted ingress, never copied from an
 * untrusted worker payload. The adapter never accepts a worker-supplied digest.
 */
export async function ingestArtifact(bucket, input) {
  if (!bucket || typeof bucket.put !== "function" || typeof bucket.get !== "function" ||
      typeof bucket.head !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.uploadId !== "string" || !SAFE_UPLOAD_ID.test(input.uploadId) ||
      !input.body || typeof input.body.pipeThrough !== "function" ||
      !Number.isSafeInteger(input.declaredSize)) {
    return deny("INVALID_ARTIFACT_INGEST");
  }
  const maxBytes = input.maxBytes === undefined ? DEFAULT_MAX_BYTES : input.maxBytes;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > DEFAULT_MAX_BYTES ||
      input.declaredSize < 0 || input.declaredSize > maxBytes) {
    return deny("INVALID_ARTIFACT_SIZE");
  }

  const key = `ingest/${input.uploadId}`;
  const measured = digestingBody(input.body, { maxBytes, declaredSize: input.declaredSize });
  try {
    // R2 rejects arbitrary TransformStream readable sides: its stream length must be
    // known. FixedLengthStream preserves streaming while enforcing declaredSize.
    const fixed = new FixedLengthStream(input.declaredSize);
    const pumping = measured.stream.pipeTo(fixed.writable);
    const storing = bucket.put(key, fixed.readable, {
      onlyIf: { etagDoesNotMatch: [{ type: "wildcard" }] },
      customMetadata: { uploadId: input.uploadId }
    });
    const [stored] = await Promise.all([storing, pumping]);
    if (!measured.completed) return deny("ARTIFACT_STREAM_INCOMPLETE");
    const sha256 = await measured.digest();
    if (stored === null) {
      return await reconcileExisting(bucket, key, input.uploadId, sha256, measured.byteLength, maxBytes);
    }
    if (!stored || typeof stored.version !== "string" || !stored.version ||
        stored.size !== measured.byteLength) return deny("STORAGE_WRITE_UNVERIFIED");

    const readback = await bucket.head(key);
    if (!readback || readback.version !== stored.version ||
        readback.size !== measured.byteLength ||
        readback.customMetadata?.uploadId !== input.uploadId) {
      return deny("ARTIFACT_OBJECT_IDENTITY_UNSTABLE");
    }
    return {
      decision: "ARTIFACT_STORED",
      artifact: {
        objectKey: key,
        objectVersion: stored.version,
        etag: stored.etag,
        sha256,
        byteLength: measured.byteLength,
        uploadId: input.uploadId
      },
      dispatch: false
    };
  } catch (error) {
    if (!measured.completed) return deny(streamFailureReason(error));
    try {
      const sha256 = await measured.digest();
      return await reconcileExisting(bucket, key, input.uploadId, sha256, measured.byteLength, maxBytes);
    } catch {
      return deny("STORAGE_WRITE_INDETERMINATE");
    }
  }
}
