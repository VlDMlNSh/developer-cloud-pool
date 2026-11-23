-- Pass 57: seal the retired per-approval claim/outbox tables.
-- Migrations 0003 and 0011 moved the canonical path to logical tasks and
-- pool_task_delivery_outbox. These legacy tables remain for historical schema
-- compatibility only; no new reads, claims, delivery state or deletes are valid.
CREATE TRIGGER pool_task_claims_legacy_insert_block
BEFORE INSERT ON pool_task_claims
BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END;

CREATE TRIGGER pool_task_claims_legacy_update_block
BEFORE UPDATE ON pool_task_claims
BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END;

CREATE TRIGGER pool_task_claims_legacy_delete_block
BEFORE DELETE ON pool_task_claims
BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END;

CREATE TRIGGER pool_task_outbox_legacy_insert_block
BEFORE INSERT ON pool_task_outbox
BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END;

CREATE TRIGGER pool_task_outbox_legacy_update_block
BEFORE UPDATE ON pool_task_outbox
BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END;

CREATE TRIGGER pool_task_outbox_legacy_delete_block
BEFORE DELETE ON pool_task_outbox
BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END;
