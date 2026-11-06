// Test-only reference policy. This module is deliberately not imported by the Worker.
// It exercises security invariants without OAuth credentials, network access or secrets.

export function consumeOAuthState(stateStore, presentedState, nowMs) {
  if (!(stateStore instanceof Map) || typeof presentedState !== "string" || !presentedState || !Number.isFinite(nowMs)) {
    return false;
  }
  const expiresAt = stateStore.get(presentedState);
  if (!Number.isFinite(expiresAt)) return false;
  stateStore.delete(presentedState);
  return expiresAt > nowMs;
}

export function isAllowedGitHubOwnerId(userId, allowedIds) {
  if (typeof userId !== "string" || !/^[1-9][0-9]{0,19}$/.test(userId)) return false;
  if (!Array.isArray(allowedIds)) return false;
  return allowedIds.some((id) => typeof id === "string" && id === userId);
}

export function isSessionActive(session, nowMs) {
  return Boolean(
    session &&
    typeof session.id === "string" &&
    session.id.length >= 32 &&
    Number.isFinite(session.issuedAt) &&
    Number.isFinite(session.expiresAt) &&
    session.issuedAt <= nowMs &&
    session.expiresAt > nowMs &&
    session.revokedAt == null
  );
}

export function createSessionCookie(token, maxAgeSeconds) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43,}$/.test(token)) {
    throw new TypeError("session token must be an opaque base64url value");
  }
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new TypeError("maxAgeSeconds must be a positive safe integer");
  }
  return `__Host-jarvis_session=${token}; Path=/; Max-Age=${maxAgeSeconds}; Secure; HttpOnly; SameSite=Lax`;
}

export function isTrustedOrigin(requestOrigin, configuredOrigin) {
  if (typeof requestOrigin !== "string" || typeof configuredOrigin !== "string") return false;
  try {
    const request = new URL(requestOrigin);
    const configured = new URL(configuredOrigin);
    return request.protocol === "https:" &&
      configured.protocol === "https:" &&
      request.origin === requestOrigin &&
      configured.origin === configuredOrigin &&
      request.origin === configured.origin;
  } catch {
    return false;
  }
}

export function isAllowedUpstream(candidate, allowedOrigins) {
  if (typeof candidate !== "string" || !Array.isArray(allowedOrigins)) return false;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    if (url.origin !== candidate.slice(0, candidate.indexOf("/", candidate.indexOf("://") + 3) < 0 ? candidate.length : candidate.indexOf("/", candidate.indexOf("://") + 3))) return false;
    return allowedOrigins.some((origin) => typeof origin === "string" && url.origin === origin);
  } catch {
    return false;
  }
}
