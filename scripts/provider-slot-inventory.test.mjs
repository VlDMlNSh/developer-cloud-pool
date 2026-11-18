import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// Registry-derived inventory checks; this test never reads credentials or provider endpoints.
const inventory = JSON.parse(readFileSync(resolve(here, "../config/provider-slot-inventory.json"), "utf8"));

test("inventory has exactly 24 cloud slots and excludes the local Ollama route", () => {
  assert.equal(inventory.schema, "developer-cloud-pool.provider-slot-inventory.v1");
  assert.equal(inventory.slots.length, 24);
  assert.equal(inventory.summary.cloud_slot_count, 24);
  assert.equal(inventory.summary.local_provider_excluded, "ollama-local-1");
});

test("every slot has a unique opaque credential reference and explicit unknown account state", () => {
  const ids = inventory.slots.map((slot) => slot.slot_id);
  const refs = inventory.slots.map((slot) => slot.credential_reference);
  assert.equal(new Set(ids).size, 24);
  assert.equal(new Set(refs).size, 24);
  for (const slot of inventory.slots) {
    assert.match(slot.credential_reference, /^secret:\/\/mediahub\/provider-slots\/[a-z0-9-]+$/);
    assert.equal(slot.account_ref, null);
    assert.equal(slot.quota_domain_id, null);
    assert.equal(slot.evidence_status, "unknown");
    assert.equal(slot.credential_presence, "not_checked");
    assert.equal(slot.billing_eligibility, "not_verified");
    assert.ok(Array.isArray(slot.models) && slot.models.length > 0);
  }
});

test("inventory explicitly disclaims secret access and inferred free eligibility", () => {
  assert.equal(inventory.policy.secret_values_included, false);
  assert.equal(inventory.policy.secret_presence_checked, false);
  assert.equal(inventory.policy.provider_calls_made, false);
  assert.equal(inventory.policy.provider_account_independence_assumed, false);
  assert.equal(inventory.policy.cost_class_is_inventory_metadata_only, true);
});
