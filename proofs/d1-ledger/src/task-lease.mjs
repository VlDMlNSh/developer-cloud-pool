const SAFE_ID=/^[A-Za-z0-9._:-]{1,128}$/; const MAX_ATTEMPTS=5; const MAX_SAFE_GENERATION=Number.MAX_SAFE_INTEGER;
function deny(reason){return {decision:"DENY",dispatch:false,reason};}
function expiry(now,seconds){const v=now+seconds;return Number.isSafeInteger(v)&&v>now?v:null;}
/** Lease acquisition uses the Worker runtime clock; callers cannot backdate or extend a lease. */
export async function acquireTaskLease(db,key,worker,seconds){
 const now=Math.floor(Date.now()/1000);
 if(!db||typeof db.prepare!=="function")return deny("STORAGE_UNAVAILABLE");
 const exp=expiry(now,seconds);
 if(!/^[a-f0-9]{64}$/.test(key)||!SAFE_ID.test(worker)||!Number.isSafeInteger(now)||now<=0||!Number.isSafeInteger(seconds)||seconds<1||seconds>900||exp===null)return deny("INVALID_LEASE_REQUEST");
 try{
  const attempt=crypto.randomUUID();
  await db.prepare(`UPDATE pool_tasks SET state='dead',lease_owner=NULL,lease_attempt_id=NULL,lease_expires_at=NULL,updated_at=? WHERE task_key=? AND attempt_count>=? AND (state='pending' OR (state='leased' AND lease_expires_at<=?))`).bind(now,key,MAX_ATTEMPTS,now).run();
  const snap=await db.prepare("SELECT state,attempt_count,lease_expires_at FROM pool_tasks WHERE task_key=?").bind(key).first();
  if(snap?.state==="dead")return deny("ATTEMPT_LIMIT_REACHED");
  if(snap&&snap.attempt_count>=MAX_ATTEMPTS&&(snap.state==="pending"||(snap.state==="leased"&&snap.lease_expires_at<=now)))return deny("ATTEMPT_LIMIT_TRANSITION_NOT_APPLIED");
  const changed=await db.prepare(`UPDATE pool_tasks SET state='leased',lease_owner=?,lease_attempt_id=?,lease_generation=lease_generation+1,lease_expires_at=?,attempt_count=attempt_count+1,updated_at=? WHERE task_key=? AND attempt_count<? AND lease_generation<? AND (state='pending' OR (state='leased' AND lease_expires_at<=?))`).bind(worker,attempt,exp,now,key,MAX_ATTEMPTS,MAX_SAFE_GENERATION,now).run();
  if(changed?.success!==true)return deny("TASK_NOT_LEASEABLE");
  const row=await db.prepare("SELECT lease_generation,lease_expires_at FROM pool_tasks WHERE task_key=? AND lease_attempt_id=?").bind(key,attempt).first();
  if(!row)return deny("LEASE_ACQUISITION_SUPERSEDED");
  return {decision:"LEASE_ACQUIRED",taskKey:key,workerId:worker,leaseAttemptId:attempt,generation:row.lease_generation,expiresAt:row.lease_expires_at,dispatch:false};
 }catch{return deny("LEASE_ACQUIRE_AMBIGUOUS");}
}
