-- Pass 111: persist the API-attested v1 provenance on the existing source-comment receipt.
-- Legacy rows remain readable with empty sentinels; new attested writes are checked below.
ALTER TABLE pool_source_comment_receipts ADD COLUMN attestation_schema TEXT NOT NULL DEFAULT '' CHECK (attestation_schema IN ('', 'cloud-pool.owner-next.api-attestation'));
ALTER TABLE pool_source_comment_receipts ADD COLUMN attestation_version INTEGER NOT NULL DEFAULT 0 CHECK (attestation_version IN (0, 1));
ALTER TABLE pool_source_comment_receipts ADD COLUMN issue_node_id TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN comment_node_id TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN observed_default_head_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN run_head_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN workflow_id TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN workflow_state TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN workflow_commit_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN workflow_file_blob_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE pool_source_comment_receipts ADD COLUMN workflow_file_ref_sha TEXT NOT NULL DEFAULT '';

CREATE TRIGGER pool_source_comment_receipt_attestation_guard
BEFORE INSERT ON pool_source_comment_receipts
WHEN NOT (
  (NEW.attestation_schema = '' AND NEW.attestation_version = 0
    AND NEW.issue_node_id = '' AND NEW.comment_node_id = ''
    AND NEW.observed_default_head_sha = '' AND NEW.run_head_sha = ''
    AND NEW.workflow_id = '' AND NEW.workflow_state = ''
    AND NEW.workflow_commit_sha = '' AND NEW.workflow_file_blob_sha = ''
    AND NEW.workflow_file_ref_sha = '')
  OR
  (NEW.attestation_schema = 'cloud-pool.owner-next.api-attestation'
    AND NEW.attestation_version = 1
    AND length(NEW.issue_node_id) BETWEEN 1 AND 256
    AND length(NEW.comment_node_id) BETWEEN 1 AND 256
    AND NEW.observed_default_head_sha = NEW.target_sha
    AND NEW.run_head_sha = NEW.target_sha
    AND NEW.workflow_file_ref_sha = NEW.run_head_sha
    AND NEW.workflow_commit_sha = NEW.workflow_sha
    AND length(NEW.workflow_id) BETWEEN 1 AND 32
    AND NEW.workflow_id NOT GLOB '*[^0-9]*'
    AND NEW.workflow_state = 'active'
    AND length(NEW.workflow_file_blob_sha) = 40
    AND NEW.workflow_file_blob_sha NOT GLOB '*[^0-9a-f]*')
)
BEGIN SELECT RAISE(ABORT, 'SOURCE_COMMENT_ATTESTATION_INVALID'); END;
