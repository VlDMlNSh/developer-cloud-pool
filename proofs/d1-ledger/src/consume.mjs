const ALLOWED_PROFILES = new Set(["dsh-headless-probe"]);
const SHA40 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NUMERIC_ID = /^[0-9]+$/;
function validBinding(x, now) { return Boolean(x && typeof x.approvalId==="string" && x.approvalId.length>0 && x.approvalId.length<=128 && typeof x.ownerNumericId==="string" && NUMERIC_ID.test(x.ownerNumericId) && typeof x.repositoryId==="string" && NUMERIC_ID.test(x.repositoryId) && Number.isSafeInteger(x.issueNumber) && x.issueNumber>0 && typeof x.targetSha==="string" && SHA40.test(x.targetSha) && ALLOWED_PROFILES.has(x.profile) && typeof x.envelopeDigest==="string" && SHA256.test(x.envelopeDigest) && Number.isSafeInteger(now) && now>0); }
function deny(reason) { return {decision:"DENY",state:"needs-review",dispatch:false,reason}; }
export async function consumeApproval(db,binding,now) {
 if(!validBinding(binding,now)) return deny("INVALID_APPROVAL_BINDING");
 if(!db || typeof db.prepare!=="function") return deny("STORAGE_UNAVAILABLE");
 try {
  const result=await db.prepare(`UPDATE pool_approval_ledger SET state='consumed',consumed_at=? WHERE approval_id=? AND owner_numeric_id=? AND repository_id=? AND issue_number=? AND target_sha=? AND profile=? AND envelope_digest=? AND state='ready' AND consumed_at IS NULL AND expires_at>?`).bind(now,binding.approvalId,binding.ownerNumericId,binding.repositoryId,binding.issueNumber,binding.targetSha,binding.profile,binding.envelopeDigest,now).run();
  return result?.success===true && result?.meta?.changes>0 ? {decision:"ALLOW_ONCE",state:"consumed",dispatch:false,reason:"FIRST_CONSUME_CONFIRMED"} : deny("NO_MATCH_OR_ALREADY_CONSUMED");
 } catch { return deny("STORAGE_OUTCOME_AMBIGUOUS"); }
}
