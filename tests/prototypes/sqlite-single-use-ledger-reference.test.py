#!/usr/bin/env python3
"""Local SQLite reference model for single-use approval consumption.

NOT a Cloudflare D1 integration test. Uses only Python stdlib sqlite3 and a
temporary local database to test the intended atomic state transition.
"""
import sqlite3
import tempfile
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor

SCHEMA = """
CREATE TABLE approvals (
  approval_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  repository_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  target_sha TEXT NOT NULL,
  profile TEXT NOT NULL,
  envelope_digest TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
)
"""

class Ledger:
    def __init__(self, path):
        self.path = path
        with self.connect() as db:
            db.execute(SCHEMA)

    def connect(self):
        return sqlite3.connect(self.path, timeout=10, isolation_level=None)

    def issue(self, approval):
        with self.connect() as db:
            db.execute(
                "INSERT INTO approvals VALUES (?,?,?,?,?,?,?,?,NULL)", approval
            )

    def consume(self, approval, now=None):
        now = int(time.time()) if now is None else now
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            cur = db.execute(
                """UPDATE approvals SET consumed_at=?
                   WHERE approval_id=? AND owner_id=? AND repository_id=?
                     AND issue_number=? AND target_sha=? AND profile=?
                     AND envelope_digest=? AND expires_at>? AND consumed_at IS NULL""",
                (now,) + tuple(approval[:7]) + (now,),
            )
            changed = cur.rowcount
            db.execute("COMMIT")
            return changed == 1

class SingleUseLedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".sqlite")
        self.ledger = Ledger(self.tmp.name)
        self.approval = (
            "approval-1", "owner-157", "repo-144", 32,
            "a" * 40, "worker", "sha256:envelope-1", int(time.time()) + 3600
        )
        self.ledger.issue(self.approval)

    def test_exactly_one_of_twelve_concurrent_consumers_wins(self):
        barrier = threading.Barrier(12)
        def contender(_):
            barrier.wait()
            return self.ledger.consume(self.approval)
        with ThreadPoolExecutor(max_workers=12) as pool:
            outcomes = list(pool.map(contender, range(12)))
        self.assertEqual(outcomes.count(True), 1)
        self.assertEqual(outcomes.count(False), 11)

    def test_replay_is_rejected(self):
        self.assertTrue(self.ledger.consume(self.approval))
        self.assertFalse(self.ledger.consume(self.approval))

    def test_wrong_owner_repository_issue_sha_profile_or_digest_rejected(self):
        self.assertTrue(self.ledger.consume(self.approval))
        for index, wrong in [
            (1, "other-owner"), (2, "other-repo"), (3, 999),
            (4, "b" * 40), (5, "admin"), (6, "sha256:tampered")
        ]:
            altered = list(self.approval)
            altered[index] = wrong
            self.assertFalse(self.ledger.consume(tuple(altered)))

    def test_expired_approval_rejected(self):
        self.assertFalse(self.ledger.consume(self.approval, now=self.approval[7] + 1))

    def test_duplicate_approval_id_cannot_be_issued(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.ledger.issue(self.approval)

    def test_unknown_approval_fails_closed(self):
        unknown = ("missing",) + self.approval[1:]
        self.assertFalse(self.ledger.consume(unknown))

    def test_database_unavailable_fails_closed(self):
        with self.assertRaises(sqlite3.OperationalError):
            Ledger("/path/that/does/not/exist/ledger.sqlite")

if __name__ == "__main__":
    unittest.main(verbosity=2)
