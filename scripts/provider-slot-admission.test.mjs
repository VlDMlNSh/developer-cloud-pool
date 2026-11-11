import test from "node:test";
import assert from "node:assert/strict";
import { planSlotActivation } from "./provider-slot-admission.mjs";

const makeSlot = (slotId, overrides = {}) => ({
  slotId,
  models: ["model-a"],
  qualificationStatus: "accepted",
  credentialStatus: "available",
  routeState: "ready",
  billingClass: "approved-free-test",
  priority: 100,
  ...overrides
});

const plan = (slots, activeSlotIds = [], allowedBillingClasses = ["approved-free-test"]) =>
  planSlotActivation({ slots, activeSlotIds, requestedModel: "model-a", allowedBillingClasses });

test("unbounded inventory can remain mostly dormant while no more than 20 slots activate", () => {
  const slots = Array.from({ length: 60 }, (_, i) => makeSlot("slot-" + String(i).padStart(2, "0")));
  const result = plan(slots);
  assert.equal(result.activateSlotIds.length, 20);
  assert.equal(result.activeCountAfterAdmission, 20);
  assert.equal(slots.length, 60);
});

test("already active slots consume the pool-wide cap", () => {
  const slots = Array.from({ length: 30 }, (_, i) => makeSlot("slot-" + i));
  const activeSlotIds = slots.slice(0, 17).map((slot) => slot.slotId);
  const result = plan(slots, activeSlotIds);
  assert.equal(result.activateSlotIds.length, 3);
  assert.equal(result.activeCountAfterAdmission, 20);
});

test("unqualified, unavailable, non-ready and disallowed billing routes are never activated", () => {
  const slots = [
    makeSlot("unqualified", { qualificationStatus: "pending" }),
    makeSlot("missing-credential", { credentialStatus: "not_checked" }),
    makeSlot("cooldown", { routeState: "cooldown" }),
    makeSlot("paid", { billingClass: "paid" })
  ];
  const result = plan(slots);
  assert.deepEqual(result.activateSlotIds, []);
  assert.equal(result.admitted, false);
});

test("active slots are revalidated against qualification, credential, route and billing policy", () => {
  const invalidSlots = [
    makeSlot("unqualified", { qualificationStatus: "rejected" }),
    makeSlot("revoked", { credentialStatus: "revoked" }),
    makeSlot("auth-failed", { routeState: "auth_failed" }),
    makeSlot("paid", { billingClass: "paid" })
  ];
  for (const slot of invalidSlots) {
    const result = plan([slot], [slot.slotId]);
    assert.equal(result.admitted, false, slot.slotId);
    assert.deepEqual(result.usableSlotIds, [], slot.slotId);
    assert.deepEqual(result.activateSlotIds, [], slot.slotId);
    // Invalid active leases still consume capacity until durable release.
    assert.equal(result.activeCountBefore, 1, slot.slotId);
    assert.equal(result.activeCountAfterAdmission, 1, slot.slotId);
  }
});

test("invalid active slot does not block a separate eligible route but still consumes capacity", () => {
  const invalid = makeSlot("revoked", { credentialStatus: "revoked" });
  const valid = makeSlot("valid");
  const result = plan([invalid, valid], [invalid.slotId], ["approved-free-test"]);
  assert.equal(result.admitted, true);
  assert.deepEqual(result.usableSlotIds, ["valid"]);
  assert.deepEqual(result.activateSlotIds, ["valid"]);
  assert.equal(result.activeCountBefore, 1);
  assert.equal(result.activeCountAfterAdmission, 2);
});

test("empty billing allowlist fails closed for active and new slots", () => {
  const slot = makeSlot("slot-a");
  assert.equal(plan([slot], [], []).admitted, false);
  assert.equal(plan([slot], [slot.slotId], []).admitted, false);
});

test("unknown active IDs consume capacity but are never usable", () => {
  const valid = makeSlot("valid");
  const result = plan([valid], ["unknown"]);
  assert.equal(result.admitted, true);
  assert.deepEqual(result.usableSlotIds, ["valid"]);
  assert.equal(result.activeCountBefore, 1);
  assert.equal(result.activeCountAfterAdmission, 2);
});

test("active count above policy limit fails closed", () => {
  const slots = Array.from({ length: 25 }, (_, i) => makeSlot("slot-" + i));
  const activeSlotIds = slots.slice(0, 21).map((slot) => slot.slotId);
  const result = plan(slots, activeSlotIds);
  assert.equal(result.admitted, false);
  assert.equal(result.reason, "active_limit_already_exceeded");
  assert.deepEqual(result.activateSlotIds, []);
});

test("caller cannot raise the hard ceiling above 20", () => {
  assert.throws(() => planSlotActivation({
    slots: [], requestedModel: "model-a", allowedBillingClasses: [],
    maxActiveSlots: 21
  }), /hard limit of 20/);
});

test("unknown model or unknown billing class does not produce an eligible route", () => {
  const result = planSlotActivation({
    slots: [makeSlot("unknown-billing", { billingClass: "unknown" })],
    requestedModel: "model-b",
    allowedBillingClasses: ["approved-free-test"]
  });
  assert.equal(result.admitted, false);
});
