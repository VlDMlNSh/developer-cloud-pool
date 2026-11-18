import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { claimLogicalTask } from "../src/claim-outbox.mjs";
import { acquireTaskLease } from "../src/task-lease.mjs";
import { commitTaskResult } from "../src/task-result.mjs";
const NOW=1_800_000_000; let seq=0;
async function createTask(){
 const n=++seq; const a={approvalId:`result-${n}`,ownerNumericId:"10001",repositoryId:"20002",issueNumber:1000+n,targetSha:"a".repeat(40),profile:"dsh-headless-probe",envelopeDigest:"b".repeat(64)};
 await env.POOL_DB.prepare(`INSERT INTO pool_approval_ledger(approval_id,owner_numeric_id,repository_id,issue_number,target_sha,profile,envelope_digest,expires_at,state,consumed_at) VALUES(?,?,?,?,?,?,?,?,'ready',NULL)`).bind(a.approvalId,a.ownerNumericId,a.repositoryId,a.issueNumber,a.targetSha,a.profile,a.envelopeDigest,NOW+3600).run();
 const c=await claimLogicalTask(env.POOL_DB,a,NOW); expect(c.decision).toBe("TASK_CREATED_OR_ATTACHED"); return c.taskKey;
}
describe("fenced result/outbox transaction",()=>{
 it("accepts only current attempt and persists result, completion and outbox despite trigger writes",async()=>{
  const key=await createTask(); const old=await acquireTaskLease(env.POOL_DB,key,"same-worker",NOW,10); const live=await acquireTaskLease(env.POOL_DB,key,"same-worker",NOW+11,60);
  const stale=await commitTaskResult(env.POOL_DB,{taskKey:key,workerId:old.workerId,generation:old.generation,leaseAttemptId:old.leaseAttemptId,resultDigest:"c".repeat(64),resultRef:"old",now:NOW+12});
  expect(stale).toMatchObject({decision:"DENY",reason:"STALE_OR_EXPIRED_RESULT_WRITER",dispatch:false});
  const accepted=await commitTaskResult(env.POOL_DB,{taskKey:key,workerId:live.workerId,generation:live.generation,leaseAttemptId:live.leaseAttemptId,resultDigest:"d".repeat(64),resultRef:"current",now:NOW+12});
  expect(accepted).toMatchObject({decision:"RESULT_COMMITTED",effectId:`pool-result:${key}`,generation:2,dispatch:false});
  const persisted=await env.POOL_DB.prepare(`SELECT r.result_digest,r.result_ref,t.state AS task_state,o.effect_id,o.result_digest AS outbox_digest FROM pool_task_results r JOIN pool_tasks t ON t.task_key=r.task_key JOIN pool_task_result_outbox o ON o.task_key=r.task_key WHERE r.task_key=?`).bind(key).first();
  expect(persisted).toMatchObject({result_digest:"d".repeat(64),result_ref:"current",task_state:"completed",effect_id:`pool-result:${key}`,outbox_digest:"d".repeat(64)});
 });
 it("is idempotent for exact retry and rejects result substitution",async()=>{
  const key=await createTask(); const lease=await acquireTaskLease(env.POOL_DB,key,"retry-worker",NOW,60);
  const input={taskKey:key,workerId:lease.workerId,generation:lease.generation,leaseAttemptId:lease.leaseAttemptId,resultDigest:"e".repeat(64),resultRef:"stable",now:NOW+1};
  expect((await commitTaskResult(env.POOL_DB,input)).decision).toBe("RESULT_COMMITTED");
  expect((await commitTaskResult(env.POOL_DB,input)).decision).toBe("RESULT_ALREADY_COMMITTED");
  expect(await commitTaskResult(env.POOL_DB,{...input,resultDigest:"f".repeat(64),resultRef:"substituted"})).toMatchObject({decision:"DENY",reason:"RESULT_IDENTITY_CONFLICT",dispatch:false});
 });
});
