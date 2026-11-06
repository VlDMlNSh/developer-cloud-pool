const HARD_MAX_ACTIVE_SLOTS = 20;

/**
 * Pure admission planner. It does not acquire a durable lease or read credentials.
 * The production controller must wrap this with an atomic shared lease store.
 */
export function planSlotActivation({
  slots,
  activeSlotIds = [],
  requestedModel,
  allowedBillingClasses = [],
  maxActiveSlots = HARD_MAX_ACTIVE_SLOTS,
  maxNewSlots = HARD_MAX_ACTIVE_SLOTS
}) {
  if (!Array.isArray(slots) || !Array.isArray(activeSlotIds) || !Array.isArray(allowedBillingClasses)) {
    throw new TypeError("slots, activeSlotIds and allowedBillingClasses must be arrays");
  }
  if (!Number.isInteger(maxActiveSlots) || maxActiveSlots < 1 || maxActiveSlots > HARD_MAX_ACTIVE_SLOTS) {
    throw new RangeError("maxActiveSlots must be between 1 and the hard limit of 20");
  }
  if (!Number.isInteger(maxNewSlots) || maxNewSlots < 0) {
    throw new RangeError("maxNewSlots must be a non-negative integer");
  }
  if (typeof requestedModel !== "string" || requestedModel.length === 0) {
    throw new TypeError("requestedModel is required");
  }

  const active = [...new Set(activeSlotIds)];
  if (active.length > maxActiveSlots) {
    return { admitted: false, reason: "active_limit_already_exceeded", usableSlotIds: [], activateSlotIds: [] };
  }
  const byId = new Map(slots.map((slot) => [slot.slotId, slot]));
  const activeMatching = active.filter((id) => {
    const slot = byId.get(id);
    return slot && slot.models?.includes(requestedModel);
  });
  const eligible = slots
    .filter((slot) => !active.includes(slot.slotId))
    .filter((slot) => slot.qualificationStatus === "accepted")
    .filter((slot) => slot.credentialStatus === "available")
    .filter((slot) => slot.routeState === "ready")
    .filter((slot) => Array.isArray(slot.models) && slot.models.includes(requestedModel))
    .filter((slot) => allowedBillingClasses.includes(slot.billingClass))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.slotId.localeCompare(b.slotId));

  const capacity = Math.max(0, maxActiveSlots - active.length);
  const count = Math.min(capacity, maxNewSlots);
  const activateSlotIds = eligible.slice(0, count).map((slot) => slot.slotId);
  const usableSlotIds = [...activeMatching, ...activateSlotIds];
  return {
    admitted: usableSlotIds.length > 0,
    reason: usableSlotIds.length > 0 ? "qualified_routes_available" : "no_qualified_route_available",
    usableSlotIds,
    activateSlotIds,
    activeCountBefore: active.length,
    activeCountAfterAdmission: active.length + activateSlotIds.length,
    hardLimit: maxActiveSlots
  };
}
