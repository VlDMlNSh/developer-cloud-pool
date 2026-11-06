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

test("does not infer account independence from provider identity", () => {
  const ledger = createQuotaLedger(definitions);
  const eligible = listEligibleRoutes(ledger, { model: "model-x" }, 100);
  assert.equal(eligible.length, 4);
  assert.equal(eligible.find((r) => r.routeId === "unknown-account-key").quotaDomainId, null);
  assert.equal(eligible.find((r) => r.routeId === "unknown-account-key").quotaEvidence, "unknown");
});

test("429 with Retry-After cools only the explicitly affected quota domain", () => {
  const ledger = createQuotaLedger(definitions);
  const next = recordProviderOutcome(ledger, "acct-a-key-1", { status: 429, retryAfterMs: 60_000, scope: "quota_domain" }, 1_000);
  assert.equal(next.routes["acct-a-key-1"].state, "cooldown");
  assert.equal(next.routes["acct-a-key-2"].state, "cooldown");
  assert.equal(next.routes["acct-b-key-1"].state, "ready");
  assert.equal(listEligibleRoutes(next, { model: "model-x" }, 30_000).length, 2);
  assert.equal(listEligibleRoutes(next, { model: "model-x" }, 61_000).length, 4);
  assert.equal(next.routes["acct-a-key-1"].quotaEvidence, "unknown");
});

test("429 without reset evidence requires reconciliation and never self-renews", () => {
  const ledger = createQuotaLedger(definitions);
  const next = recordProviderOutcome(ledger, "acct-b-key-1", { status: 429 }, 5_000);
  assert.equal(next.routes["acct-b-key-1"].state, "needs_reconciliation");
  assert.equal(listEligibleRoutes(next, { model: "model-x" }, 999_999).some((r) => r.routeId === "acct-b-key-1"), false);
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
