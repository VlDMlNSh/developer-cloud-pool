-- Pass 59: append-only source event receipt for the canonical CODE admission.
-- The source comment is the idempotency key; no legacy outbox is used.
CREATE TABLE pool_source_comment_receipts (
  source_comment_id TEXT PRIMARY KEY NOT NULL CHECK (length(source_comment_id) BETWEEN 1 AND 32 AND source_comment_id NOT GLOB '*[^0-9]*'),
  repository_id TEXT NOT NULL CHECK (repository_id = '1445644538'),
  owner_numeric_id TEXT NOT NULL CHECK (owner_numeric_id = '157891068'),
  issue_number INTEGER NOT NULL CHECK (issue_number = 96),
  event_name TEXT NOT NULL CHECK (event_name = 'issue_comment'),
  event_action TEXT NOT NULL CHECK (event_action = 'created'),
  actor_numeric_id TEXT NOT NULL CHECK (actor_numeric_id = '157891068'),
  actor_login TEXT NOT NULL CHECK (actor_login = 'VlDMlNSh'),
  author_association TEXT NOT NULL CHECK (author_association = 'OWNER'),
  body_digest TEXT NOT NULL CHECK (body_digest = '65e2c8aed83c729f4663f27dceb83ec1b5abe5c0717eb156934fcce9658df2e3'),
  ref TEXT NOT NULL CHECK (ref = 'refs/heads/Основной'),
  target_sha TEXT NOT NULL CHECK (length(target_sha) = 40 AND target_sha NOT GLOB '*[^0-9a-f]*'),
  workflow_ref TEXT NOT NULL CHECK (workflow_ref = 'VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной'),
  workflow_sha TEXT NOT NULL CHECK (length(workflow_sha) = 40 AND workflow_sha NOT GLOB '*[^0-9a-f]*'),
  run_id INTEGER NOT NULL CHECK (run_id > 0),
  run_attempt INTEGER NOT NULL CHECK (run_attempt > 0),
  profile TEXT NOT NULL CHECK (profile = 'jarvis-code-sandbox-v1'),
  event_digest TEXT NOT NULL CHECK (length(event_digest) = 64 AND event_digest NOT GLOB '*[^0-9a-f]*'),
  admission_id TEXT NOT NULL UNIQUE REFERENCES pool_admissions(admission_id),
  recorded_at INTEGER NOT NULL CHECK (recorded_at > 0),
  dispatch_enabled INTEGER NOT NULL DEFAULT 0 CHECK (dispatch_enabled = 0),
  UNIQUE (repository_id, source_comment_id)
);

CREATE TRIGGER pool_source_comment_receipt_full_binding_guard
BEFORE INSERT ON pool_source_comment_receipts
WHEN NOT EXISTS (
  SELECT 1
    FROM pool_admissions a
    JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
    JOIN pool_tasks t ON t.task_key = a.task_key
    JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
    JOIN pool_route_qualifications q ON q.qualification_id = a.qualification_id
    JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key
    JOIN pool_admission_commit_receipts c ON c.admission_id = a.admission_id
   WHERE a.admission_id = NEW.admission_id
     AND a.dispatch_enabled = 0
     AND a.executor_id = l.executor_id AND a.executor_id = t.executor_id
     AND a.approval_id = l.approval_id AND a.task_key = t.task_key
     AND l.owner_numeric_id = NEW.owner_numeric_id
     AND l.repository_id = NEW.repository_id AND l.issue_number = NEW.issue_number
     AND l.target_sha = NEW.target_sha AND l.profile = NEW.profile
     AND l.envelope_digest = NEW.event_digest AND l.state = 'consumed'
     AND l.consumed_at = a.admitted_at
     AND a.attempt_id = p.attempt_id AND p.status = 'prepared'
     AND t.current_attempt_id = a.attempt_id AND t.attempt_number = a.attempt_number
     AND a.qualification_id = q.qualification_id
     AND q.qualification_status = 'qualified' AND q.revoked_at IS NULL
     AND q.capability_profile = NEW.profile
     AND q.evidence_digest = a.evidence_digest
     AND o.status = 'pending' AND o.event_type = 'pool.task.ready'
     AND o.admission_id = a.admission_id AND o.attempt_id = a.attempt_id
     AND o.evidence_digest = a.evidence_digest
     AND c.assertion = 1 AND c.dispatch_enabled = 0
     AND c.executor_id = a.executor_id AND c.approval_id = a.approval_id
     AND c.task_key = a.task_key AND c.attempt_id = a.attempt_id
     AND c.qualification_id = a.qualification_id
     AND c.evidence_digest = a.evidence_digest
     AND c.committed_at = a.admitted_at
)
BEGIN SELECT RAISE(ABORT, 'SOURCE_COMMENT_ADMISSION_BINDING_INVALID'); END;

CREATE TRIGGER pool_source_comment_receipts_no_update
BEFORE UPDATE ON pool_source_comment_receipts
BEGIN SELECT RAISE(ABORT, 'SOURCE_COMMENT_RECEIPTS_APPEND_ONLY'); END;

CREATE TRIGGER pool_source_comment_receipts_no_delete
BEFORE DELETE ON pool_source_comment_receipts
BEGIN SELECT RAISE(ABORT, 'SOURCE_COMMENT_RECEIPTS_APPEND_ONLY'); END;
