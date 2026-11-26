-- Database-level retry budget invariant: delivery attempts are monotonic.
-- Local-only D1 proof migration; no production database is targeted.
CREATE TRIGGER pool_attempt_projection_attempts_monotonic
BEFORE UPDATE OF delivery_attempts ON pool_attempt_projection_outbox
WHEN NEW.delivery_attempts < OLD.delivery_attempts
BEGIN SELECT RAISE(ABORT, 'PROJECTION_DELIVERY_ATTEMPTS_MONOTONIC'); END;
