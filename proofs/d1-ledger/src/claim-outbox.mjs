const SHA40=/^[a-f0-9]{40}$/; const SHA256=/^[a-f0-9]{64}$/; const NUM=/^[0-9]+$/;
function deny(reason){return {decision:"DENY",state:"needs-review",dispatch:false,reason};}
async function logicalTaskKey(b){const s=JSON.stringify(["pool-task-v1",b.repositoryId,b.issueNumber,b.targetSha,b.profile,1]);const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,"0")).join("");}
export async function claimLogicalTask(db,b,now){
 if(!b||typeof b.approvalId!=="string"||b.approvalId.length<1||b.approvalId.length>128||!NUM.test(b.ownerNumericId)||!NUM.test(b.repositoryId)||!Number.isSafeInteger(b.issueNumber)||b.issueNumber<1||!SHA40.test(b.targetSha)||b.profile!=="dsh-headless-probe"||!SHA256.test(b.envelopeDigest)||!Number.isSafeInteger(now)||now<=0)return deny("INVALID_CLAIM_BINDING");
 if(!db||typeof db.prepare!=="function")return deny("STORAGE_UNAVAILABLE");
 try{
  const key=await logicalTaskKey(b);
  const prior=await db.prepare("SELECT repository_id,issue_number,target_sha,profile FROM pool_tasks WHERE task_key=?").bind(key).first();
  if(prior&&(prior.repository_id!==b.repositoryId||prior.issue_number!==b.issueNumber||prior.target_sha!==b.targetSha||prior.profile!==b.profile))return deny("TASK_KEY_BINDING_CONFLICT");
  const changed=await db.prepare(`UPDATE pool_approval_ledger SET state='consumed',consumed_at=?,task_key=? WHERE approval_id=? AND owner_numeric_id=? AND repository_id=? AND issue_number=? AND target_sha=? AND profile=? AND envelope_digest=? AND state='ready' AND consumed_at IS NULL AND expires_at>?`).bind(now,key,b.approvalId,b.ownerNumericId,b.repositoryId,b.issueNumber,b.targetSha,b.profile,b.envelopeDigest,now).run();
  const row=await db.prepare(`SELECT t.task_key,t.state,t.lease_generation,o.outbox_id,o.status AS outbox_status,a.envelope_digest FROM pool_tasks t JOIN pool_task_approvals a ON a.task_key=t.task_key JOIN pool_task_delivery_outbox o ON o.task_key=t.task_key WHERE t.task_key=? AND a.approval_id=?`).bind(key,b.approvalId).first();
  if(!row||row.envelope_digest!==b.envelopeDigest)return deny(changed?.success&&changed?.meta?.changes>0?"TASK_ATTACH_OR_OUTBOX_INCOMPLETE":"APPROVAL_NOT_CONSUMED_OR_ALREADY_ATTACHED");
  const first=changed?.success===true&&changed?.meta?.changes>0;
  return {decision:first?"TASK_CREATED_OR_ATTACHED":"TASK_ALREADY_ATTACHED",taskKey:row.task_key,taskState:row.state,generation:row.lease_generation,outboxId:row.outbox_id,outboxState:row.outbox_status,dispatch:false,reason:first?"APPROVAL_CONSUMED_AND_TASK_ATTACHED":"IDEMPOTENT_TASK_ATTACHMENT"};
 }catch{return deny("TASK_CLAIM_OUTCOME_AMBIGUOUS");}
}
