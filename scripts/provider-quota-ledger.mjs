/**
 * Provider quota ledger primitives.
 *
 * Pure, secret-free state transitions. This module is not a credential broker,
 * provider client, billing oracle, or task/issuer authority.
 */

const TERMINAL_ROUTE_STATES = new Set(["auth_failed", "billing_blocked", "needs_reconciliation"]);
const ALLOWED_STATES = new Set(["ready", "cooldown", ...TERMINAL_ROUTE_STATES]);

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

function clone(value) {
  return structuredClone(value);
}

export function createQuotaLedger(routeDefinitions) {
  assert(Array.isArray(routeDefinitions), "routeDefinitions must be an array");
  const routeIds = new Set();
  const routes = {};

  for (const definition of routeDefinitions) {
    assert(definition && typeof definition === "object", "route definition must be an object");
    const { routeId, providerId, quotaDomainId = null, allowedModels = [], billingClass = "unknown" } = definition;
    assert(typeof routeId === "string" && routeId.trim(), "routeId is required");
    assert(!routeIds.has(routeId), "routeId must be unique");
    assert(typeof providerId === "string" && providerId.trim(), "providerId is required");
    assert(quotaDomainId === null || (typeof quotaDomainId === "string" && quotaDomainId.trim()), "quotaDomainId must be null or non-empty");
    assert(Array.isArray(allowedModels) && allowedModels.every((item) => typeof item === "string" && item.trim()), "allowedModels must be non-empty strings");
    routeIds.add(routeId);
    routes[routeId] = {
      routeId,
      providerId,
      quotaDomainId,
      allowedModels: [...allowedModels],
      billingClass,
      state: "ready",
      cooldownUntil: null,
      quotaEvidence: "unknown",
      lastOutcome: null,
      updatedAt: null
    };
  }

  return { schemaVersion: 1, routes, events: [] };
}

function affectedRouteIds(ledger, route, scope) {
  if (scope !== "quota_domain" || !route.quotaDomainId) return [route.routeId];
  return Object.values(ledger.routes)
    .filter((candidate) => candidate.quotaDomainId === route.quotaDomainId)
    .map((candidate) => candidate.routeId);
}

export function recordProviderOutcome(ledgerInput, routeId, outcome, observedAt) {
  const ledger = clone(ledgerInput);
  const route = ledger.routes?.[routeId];
  assert(route, "unknown routeId");
  assert(Number.isFinite(observedAt) && observedAt >= 0, "observedAt must be a non-negative timestamp");
  assert(outcome && typeof outcome === "object", "outcome is required");

  const status = outcome.status;
  const hasProviderScopeEvidence = outcome.scopeEvidence?.authority === "provider"
    && typeof outcome.scopeEvidence.evidenceRef === "string"
    && outcome.scopeEvidence.evidenceRef.trim().length > 0;
  const scope = outcome.scope === "quota_domain" && hasProviderScopeEvidence ? "quota_domain" : "route";
  const affected = affectedRouteIds(ledger, route, scope);
  let nextState;
  let cooldownUntil = null;

  if (status === 401 || status === 403) {
    nextState = "auth_failed";
  } else if (status === 402) {
    nextState = "billing_blocked";
  } else if (status === 429) {
    if (Number.isFinite(outcome.retryAfterMs) && outcome.retryAfterMs > 0) {
      nextState = "cooldown";
      cooldownUntil = observedAt + outcome.retryAfterMs;
    } else {
      nextState = "needs_reconciliation";
    }
  } else if (Number.isInteger(status) && status >= 500 && status <= 599) {
    nextState = "cooldown";
    const retryMs = Number.isFinite(outcome.retryAfterMs) && outcome.retryAfterMs > 0
      ? outcome.retryAfterMs
      : 30_000;
    cooldownUntil = observedAt + Math.min(retryMs, 300_000);
  } else {
    throw new TypeError("unsupported provider outcome");
  }

  for (const id of affected) {
    ledger.routes[id] = {
      ...ledger.routes[id],
      state: nextState,
      cooldownUntil,
      lastOutcome: status,
      updatedAt: observedAt
    };
  }

  ledger.events.push({
    type: "provider_outcome",
    routeId,
    affectedRouteIds: affected,
    status,
    scope: affected.length > 1 ? "quota_domain" : "route",
    scopeEvidenceRef: scope === "quota_domain" ? outcome.scopeEvidence.evidenceRef : null,
    observedAt,
    cooldownUntil
  });
  return ledger;
}

export function applyAuthoritativeQuotaReset(ledgerInput, routeId, evidence, observedAt) {
  const ledger = clone(ledgerInput);
  const route = ledger.routes?.[routeId];
  assert(route, "unknown routeId");
  assert(evidence && evidence.authority === "provider", "provider authority evidence is required");
  assert(typeof evidence.evidenceRef === "string" && evidence.evidenceRef.trim(), "evidenceRef is required");
  assert(Number.isFinite(observedAt) && observedAt >= 0, "observedAt must be a non-negative timestamp");

  const affected = route.quotaDomainId
    ? Object.values(ledger.routes).filter((candidate) => candidate.quotaDomainId === route.quotaDomainId).map((candidate) => candidate.routeId)
    : [route.routeId];

  for (const id of affected) {
    const current = ledger.routes[id];
    if (current.state === "auth_failed" || current.state === "billing_blocked") continue;
    ledger.routes[id] = {
      ...current,
      state: "ready",
      cooldownUntil: null,
      quotaEvidence: "provider_verified",
      updatedAt: observedAt
    };
  }
  ledger.events.push({
    type: "authoritative_quota_reset",
    routeId,
    affectedRouteIds: affected,
    evidenceRef: evidence.evidenceRef,
    observedAt
  });
  return ledger;
}

export function listEligibleRoutes(ledger, request, now) {
  assert(request && typeof request.model === "string", "request.model is required");
  assert(Number.isFinite(now) && now >= 0, "now must be a non-negative timestamp");
  return Object.values(ledger.routes)
    .filter((route) => {
      if (!route.allowedModels.includes(request.model)) return false;
      if (request.allowedBillingClasses && !request.allowedBillingClasses.includes(route.billingClass)) return false;
      if (TERMINAL_ROUTE_STATES.has(route.state)) return false;
      if (route.state === "cooldown" && route.cooldownUntil > now) return false;
      return true;
    })
    .map((route) => ({
      routeId: route.routeId,
      providerId: route.providerId,
      quotaDomainId: route.quotaDomainId,
      quotaEvidence: route.quotaEvidence,
      state: route.state
    }));
}

export const ROUTE_STATES = Object.freeze([...ALLOWED_STATES]);
