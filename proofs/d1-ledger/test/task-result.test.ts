import { describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import { claimLogicalTask } from "../src/claim-outbox.mjs";
import { acquireTaskLease } from "../src/task-lease.mjs";
import { commitTaskResult } from "../src/task-result.mjs";
let seq=0;
async function createTask(){
 const now=Math.floor(Date.now()/1000); const n=++seq;
 const a={approvalId:`result-${n}`,ownerNumericId:"10001",repositoryId:"20002",issueNumber:1000+n,targetSha:"a".repeat(40),profile:"dsh-headless-probe",envelopeDigest:"b".repeat(64)};
 await env.POOL_DB.prepare(`INSERT INTO pool_approval_ledger(approval_id,owner_numeric_id,repository_id,issue_number,target_sha,profile,envelope_digest,expires_at,state,consumed_at) VALUES(?,?,?,?,?,?,?,?,'ready',NULL)`).bind(a.approvalId,a.ownerNumericId,a.repositoryId,a.issueNumber,a.targetSha,a.profile,a.envelopeDigest,now+3600).run();
 const c=await claimLogicalTask(env.POOL_DB,a,now); expect(c.decision).toBe("TASK_CREATED_OR_ATTACHED"); return c.taskKey;
}
describe("fenced result/outbox transaction",()=>{
 it("accepts only the current lease attempt and persists the full atomic write set",async()=>{
  const key=await createTask(); const old=await acquireTaskLease(env.POOL_DB,key,"same-worker",10);
  expect(old.decision).toBe("LEASE_ACQUIRED");
  await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?").bind(Math.floor(Date.now()/1000)-1,key).run();
  const live=await acquireTaskLease(env.POOL_DB,key,"same-worker",60);
  expect(live.decision).toBe("LEASE_ACQUIRED"); expect(live.generation).toBe(old.generation+1);
  const stale=await commitTaskResult(env.POOL_DB,{taskKey:key,workerId:old.workerId,generation:old.generation,leaseAttemptId:old.leaseAttemptId,resultDigest:"c".repeat(64),resultRef:"old",now:1});
  expect(stale).toMatchObject({decision:"DENY",reason:"STALE_OR_EXPIRED_RESULT_WRITER",dispatch:false});
  const accepted=await commitTaskResult(env.POOL_DB,{taskKey:key,workerId:live.workerId,generation:live.generation,leaseAttemptId:live.leaseAttemptId,resultDigest:"d".repeat(64),resultRef:"current",now:1});
  expect(accepted).toMatchObject({decision:"RESULT_COMMITTED",effectId:`pool-result:${key}`,generation:live.generation,dispatch:false});
  const persisted=await env.POOL_DB.prepare(`SELECT r.result_digest,r.result_ref,t.state AS task_state,o.effect_id,o.result_digest AS outbox_digest FROM pool_task_results r JOIN pool_tasks t ON t.task_key=r.task_key JOIN pool_task_result_outbox o ON o.task_key=r.task_key WHERE r.task_key=?`).bind(key).first();
  expect(persisted).toMatchObject({result_digest:"d".repeat(64),result_ref:"current",task_state:"completed",effect_id:`pool-result:${key}`,outbox_digest:"d".repeat(64)});
 });
 it("is idempotent for exact retry and rejects result substitution",async()=>{
  const key=await createTask(); const lease=await acquireTaskLease(env.POOL_DB,key,"retry-worker",60);
  expect(lease.decision).toBe("LEASE_ACQUIRED");
  const input={taskKey:key,workerId:lease.workerId,generation:lease.generation,leaseAttemptId:lease.leaseAttemptId,resultDigest:"e".repeat(64),resultRef:"stable",now:1};
  expect((await commitTaskResult(env.POOL_DB,input)).decision).toBe("RESULT_COMMITTED");
  expect((await commitTaskResult(env.POOL_DB,input)).decision).toBe("RESULT_ALREADY_COMMITTED");
  expect(await commitTaskResult(env.POOL_DB,{...input,workerId:"other-worker"})).toMatchObject({decision:"DENY",reason:"RESULT_IDENTITY_CONFLICT",dispatch:false});
  expect(await commitTaskResult(env.POOL_DB,{...input,leaseAttemptId:"00000000-0000-4000-8000-000000000099"})).toMatchObject({decision:"DENY",reason:"RESULT_IDENTITY_CONFLICT",dispatch:false});
  expect(await commitTaskResult(env.POOL_DB,{...input,resultDigest:"f".repeat(64),resultRef:"substituted"})).toMatchObject({decision:"DENY",reason:"RESULT_IDENTITY_CONFLICT",dispatch:false});
 });
 it("rolls back result insertion when the SQL fencing trigger rejects an expired attempt",async()=>{
  const key=await createTask(); const lease=await acquireTaskLease(env.POOL_DB,key,"rollback-worker",60);
  await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?").bind(Math.floor(Date.now()/1000)-1,key).run();
  await expect(env.POOL_DB.prepare(`INSERT INTO pool_task_results(task_key,worker_id,lease_generation,lease_attempt_id,result_digest,result_ref,committed_at) VALUES(?,?,?,?,?,?,?)`).bind(key,lease.workerId,lease.generation,lease.leaseAttemptId,"a".repeat(64),"expired",Math.floor(Date.now()/1000)).run()).rejects.toThrow(/RESULT_LEASE_FENCE_LOST/);
  const counts=await env.POOL_DB.prepare("SELECT (SELECT count(*) FROM pool_task_results WHERE task_key=?) AS results,(SELECT count(*) FROM pool_task_result_outbox WHERE task_key=?) AS effects").bind(key,key).first();
  expect(counts).toMatchObject({results:0,effects:0});
 });

 it("reclaims a lease when expiry equals the Worker clock boundary",async()=>{
  const key=await createTask(); const first=await acquireTaskLease(env.POOL_DB,key,"boundary-worker",60);
  expect(first.decision).toBe("LEASE_ACQUIRED");
  const boundary=Math.floor(Date.now()/1000);
  await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?").bind(boundary,key).run();
  const clock=vi.spyOn(Date,"now").mockReturnValue(boundary*1000);
  try {
   const reclaimed=await acquireTaskLease(env.POOL_DB,key,"boundary-worker",60);
   expect(reclaimed.decision).toBe("LEASE_ACQUIRED");
   expect(reclaimed.generation).toBe(first.generation+1);
   expect(reclaimed.leaseAttemptId).not.toBe(first.leaseAttemptId);
  } finally { clock.mockRestore(); }
 });
});
