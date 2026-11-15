import test from "node:test";
import assert from "node:assert/strict";
import {
  createQuotaLedger,
  recordProviderOutcome,
  applyAuthoritativeQuotaReset,
  listEligibleRoutes
} from "./provider-quota-ledger.mjs";

const definitions = [
  { routeId: "acct-a-key-1", providerId: "provider-a", quotaDomainId: "acct-a", allowedModels: ["model-x"], billingClass: "free-evidence-pending" },
  { routeId: "acct-a-key-2", providerId: "provider-a", quotaDomainId: "acct-a", allowedModels: ["model-x"], billingClass: "free-evidence-pending" },
  { routeId: "acct-b-key-1", providerId: "provider-a", quotaDomainId: "acct-b", allowedModels: ["model-x"], billingClass: "free-evidence-pending" },
  { routeId: "unknown-account-key", providerId: "provider-b", allowedModels: ["model-x"], billingClass: "unknown" }
];

test("keeps credential slots distinct while allowing explicit shared quota domains", () => {
  const ledger = createQuotaLedger(definitions);
  assert.equal(Object.keys(ledger.routes).length, 4);
  assert.equal(ledger.routes["acct-a-key-1"].quotaDomainId, "acct-a");
  assert.equal(ledger.routes["acct-a-key-2"].quotaDomainId, "acct-a");
  assert.equal(ledger.routes["acct-b-key-1"].quotaDomainId, "acct-b");
  assert.equal(ledger.routes["unknown-account-key"].quotaDomainId, null);
});

test("unknown quota evidence is never eligible, even when caller allows the billing class", () => {
  const ledger = createQuotaLedger(definitions);
  const eligible = listEligibleRoutes(ledger, {
    model: "model-x",
    allowedBillingClasses: ["free-evidence-pending", "unknown"]
  }, 100);
  assert.deepEqual(eligible, []);
});

test("provider-verified quota evidence admits only routes with a known quota domain", () => {
  let ledger = createQuotaLedger(definitions);
  ledger = applyAuthoritativeQuotaReset(ledger, "acct-a-key-1", {
    authority: "provider",
    evidenceRef: "provider:acct-a-quota-reset"
  }, 20);
  const eligible = listEligibleRoutes(ledger, { model: "model-x" }, 100);
  assert.deepEqual(eligible.map((route) => route.routeId).sort(), ["acct-a-key-1", "acct-a-key-2"]);
  assert.equal(eligible.every((route) => route.quotaEvidence === "provider_verified"), true);
  assert.equal(eligible.some((route) => route.routeId === "unknown-account-key"), false);
});

test("provider verification cannot make a route with unknown quota-domain identity eligible", () => {
  let ledger = createQuotaLedger(definitions);
  ledger = applyAuthoritativeQuotaReset(ledger, "unknown-account-key", {
    authority: "provider",
    evidenceRef: "provider:route-only-reset"
  }, 20);
  assert.equal(
    listEligibleRoutes(ledger, { model: "model-x" }, 100).some((route) => route.routeId === "unknown-account-key"),
    false
  );
});

test("429 with Retry-After cools only the explicitly affected quota domain", () => {
  let ledger = createQuotaLedger(definitions);
  ledger = applyAuthoritativeQuotaReset(ledger, "acct-a-key-1", {
    authority: "provider",
    evidenceRef: "provider:acct-a-quota-reset"
  }, 10);
  const next = recordProviderOutcome(ledger, "acct-a-key-1", {
    status: 429,
    retryAfterMs: 60_000,
    scope: "quota_domain",
    scopeEvidence: { authority: "provider", evidenceRef: "provider-doc:429-account-scope" }
  }, 1_000);
  assert.equal(next.routes["acct-a-key-1"].state, "cooldown");
  assert.equal(next.routes["acct-a-key-2"].state, "cooldown");
  assert.equal(next.routes["acct-b-key-1"].state, "ready");
  assert.equal(listEligibleRoutes(next, { model: "model-x" }, 30_000).length, 0);
  assert.equal(next.routes["acct-a-key-1"].quotaEvidence, "provider_verified");
});

test("429 without reset evidence requires reconciliation and never self-renews", () => {
  let ledger = createQuotaLedger(definitions);
  ledger = applyAuthoritativeQuotaReset(ledger, "acct-b-key-1", {
    authority: "provider",
    evidenceRef: "provider:acct-b-quota-reset"
  }, 10);
  const next = recordProviderOutcome(ledger, "acct-b-key-1", { status: 429 }, 5_000);
  assert.equal(next.routes["acct-b-key-1"].state, "needs_reconciliation");
  assert.equal(listEligibleRoutes(next, { model: "model-x" }, 999_999).some((route) => route.routeId === "acct-b-key-1"), false);
});

test("auth and billing failures are not cleared by a quota reset", () => {
  let ledger = createQuotaLedger(definitions);
  ledger = recordProviderOutcome(ledger, "acct-a-key-1", { status: 401 }, 10);
  ledger = recordProviderOutcome(ledger, "acct-b-key-1", { status: 402, scope: "quota_domain" }, 11);
  const reset = applyAuthoritativeQuotaReset(ledger, "acct-a-key-1", { authority: "provider", evidenceRef: "ticket:reset-1" }, 20);
  assert.equal(reset.routes["acct-a-key-1"].state, "auth_failed");
  assert.equal(reset.routes["acct-b-key-1"].state, "billing_blocked");
  assert.equal(reset.routes["acct-a-key-2"].state, "ready");
});

test("only provider evidence can reconcile a quota reset", () => {
  const ledger = createQuotaLedger(definitions);
  assert.throws(() => applyAuthoritativeQuotaReset(ledger, "acct-a-key-1", { authority: "local_timer", evidenceRef: "timer" }, 20), /provider authority/);
});

test("rejects duplicate route identifiers and invalid models", () => {
  assert.throws(() => createQuotaLedger([definitions[0], definitions[0]]), /unique/);
  assert.throws(() => createQuotaLedger([{ ...definitions[0], allowedModels: [3] }]), /allowedModels/);
});

test("does not mutate the source ledger", () => {
  const ledger = createQuotaLedger(definitions);
  const next = recordProviderOutcome(ledger, "acct-a-key-1", { status: 403 }, 1);
  assert.equal(ledger.routes["acct-a-key-1"].state, "ready");
  assert.equal(next.routes["acct-a-key-1"].state, "auth_failed");
});

test("unverified quota-domain scope cannot cool down sibling credential slots", () => {
  const ledger = createQuotaLedger(definitions);
  const next = recordProviderOutcome(ledger, "acct-a-key-1", { status: 429, retryAfterMs: 60_000, scope: "quota_domain" }, 1_000);
  assert.equal(next.routes["acct-a-key-1"].state, "cooldown");
  assert.equal(next.routes["acct-a-key-2"].state, "ready");
  assert.equal(next.events.at(-1).scope, "route");
  assert.equal(next.events.at(-1).scopeEvidenceRef, null);
});

test("provider quota-domain scope evidence is recorded in the audit event", () => {
  const ledger = createQuotaLedger(definitions);
  const next = recordProviderOutcome(ledger, "acct-a-key-1", {
    status: 429,
    retryAfterMs: 60_000,
    scope: "quota_domain",
    scopeEvidence: { authority: "provider", evidenceRef: "provider-doc:429-account-scope" }
  }, 1_000);
  assert.equal(next.events.at(-1).scope, "quota_domain");
  assert.equal(next.events.at(-1).scopeEvidenceRef, "provider-doc:429-account-scope");
});
