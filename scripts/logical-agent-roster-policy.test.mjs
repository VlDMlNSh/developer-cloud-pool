import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const policy = JSON.parse(readFileSync(resolve(here, "../config/logical-agent-roster-policy.json"), "utf8"));
test("defines six stable logical roles distinct from credential slots", () => {
 assert.equal(policy.schema, "developer-cloud-pool.logical-agent-roster.v1");
 assert.equal(policy.target_roster_size, 6);
 assert.equal(policy.roles.length, 6);
 assert.equal(new Set(policy.roles.map(x => x.role_id)).size, 6);
 assert.equal(policy.credential_failover.credential_slots_are_not_agents, true);
});
test("every next evaluates roles without forcing duplicate/no-op dispatch", () => {
 const p=policy.dispatch_policy;
 assert.equal(p.every_next_evaluates_all_roles,true);
 assert.equal(p.dispatch_only_when_independent_useful_work_exists,true);
 assert.equal(p.do_not_force_noop_or_duplicate_tasks,true);
 assert.equal(p.maximum_concurrent_logical_agents,6);
 assert.equal(p.security_review_is_exclusive,true);
});
test("quota exhaustion never rotates keys to evade provider limits", () => {
 const f=policy.credential_failover;
 assert.equal(f.never_rotate_keys_to_evade_provider_limits,true);
 assert.match(f.quota_exhaustion.same_quota_domain,/authoritative reset/);
 assert.match(f.quota_exhaustion.unknown_quota_domain,/do not rotate/);
 assert.match(f.quota_exhaustion.different_provider_or_confirmed_independent_domain,/independently qualified/);
 assert.equal(f.paid_fallback_allowed,false);
});
test("auth and billing failures are not quota rotation signals", () => {
 const s=policy.credential_failover.http_status_policy;
 assert.match(s["401"],/no key rotation/);
 assert.match(s["403"],/no key rotation/);
 assert.match(s["402"],/never use paid fallback/);
 assert.match(s["429_without_scope_or_reset_evidence"],/fail closed/);
});
test("admission requires qualification, current free eligibility, model and data policy", () => {
 for (const x of ["provider account identity and quota domain independently evidenced or remain unknown","model explicitly allowlisted for selected route","current free eligibility and billing policy verified for selected model","route qualification accepted and not expired","task data policy permits provider"]) assert.ok(policy.admission_requirements.some(y=>y.includes(x.slice(0,25))),x);
 assert.ok(policy.non_goals.includes("no raw API key exposure to agent prompts or workspaces"));
});
