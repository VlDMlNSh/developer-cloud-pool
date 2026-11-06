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

test("unbounded inventory can remain mostly dormant while no more than 20 slots activate", () => {
  const slots = Array.from({ length: 60 }, (_, i) => makeSlot("slot-" + String(i).padStart(2, "0")));
  const plan = planSlotActivation({
    slots, requestedModel: "model-a", allowedBillingClasses: ["approved-free-test"]
  });
  assert.equal(plan.activateSlotIds.length, 20);
  assert.equal(plan.activeCountAfterAdmission, 20);
  assert.equal(slots.length, 60);
});

test("already active slots consume the pool-wide cap", () => {
  const slots = Array.from({ length: 30 }, (_, i) => makeSlot("slot-" + i));
  const activeSlotIds = slots.slice(0, 17).map((slot) => slot.slotId);
  const plan = planSlotActivation({
    slots, activeSlotIds, requestedModel: "model-a",
    allowedBillingClasses: ["approved-free-test"]
  });
  assert.equal(plan.activateSlotIds.length, 3);
  assert.equal(plan.activeCountAfterAdmission, 20);
});

test("unqualified, unavailable, non-ready and disallowed billing routes are never activated", () => {
  const slots = [
    makeSlot("unqualified", { qualificationStatus: "pending" }),
    makeSlot("missing-credential", { credentialStatus: "not_checked" }),
    makeSlot("cooldown", { routeState: "cooldown" }),
    makeSlot("paid", { billingClass: "paid" })
  ];
  const plan = planSlotActivation({
    slots, requestedModel: "model-a", allowedBillingClasses: ["approved-free-test"]
  });
  assert.deepEqual(plan.activateSlotIds, []);
  assert.equal(plan.admitted, false);
});

test("active count above policy limit fails closed", () => {
  const slots = Array.from({ length: 25 }, (_, i) => makeSlot("slot-" + i));
  const activeSlotIds = slots.slice(0, 21).map((slot) => slot.slotId);
  const plan = planSlotActivation({
    slots, activeSlotIds, requestedModel: "model-a",
    allowedBillingClasses: ["approved-free-test"]
  });
  assert.equal(plan.admitted, false);
  assert.equal(plan.reason, "active_limit_already_exceeded");
  assert.deepEqual(plan.activateSlotIds, []);
});

test("caller cannot raise the hard ceiling above 20", () => {
  assert.throws(() => planSlotActivation({
    slots: [], requestedModel: "model-a", allowedBillingClasses: [],
    maxActiveSlots: 21
  }), /hard limit of 20/);
});

test("unknown model or unknown billing class does not produce an eligible route", () => {
  const plan = planSlotActivation({
    slots: [makeSlot("unknown-billing", { billingClass: "unknown" })],
    requestedModel: "model-b",
    allowedBillingClasses: ["approved-free-test"]
  });
  assert.equal(plan.admitted, false);
});
