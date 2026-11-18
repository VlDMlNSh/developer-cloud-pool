#!/usr/bin/env python3
"""Tests for signed-manifest checksum verification of Claude Code binaries."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from verify_claude_release import ReleaseVerificationError, verify_binary


class ClaudeReleaseVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.binary = self.root / "claude"
        self.binary.write_bytes(b"synthetic-claude-binary")
        self.digest = hashlib.sha256(self.binary.read_bytes()).hexdigest()
        self.manifest = self.root / "manifest.json"
        self.write_manifest({"version": "2.1.325", "platforms": {"linux-x64": {"checksum": self.digest}}})

    def write_manifest(self, value):
        self.manifest.write_text(json.dumps(value), encoding="utf-8")

    def test_accepts_exact_version_platform_and_checksum(self):
        result = verify_binary(self.manifest, self.binary, version="2.1.325", platform="linux-x64")
        self.assertEqual(result["status"], "PASS")
        self.assertTrue(result["checksum_match"])
        self.assertEqual(result["sha256"], self.digest)

    def test_rejects_manifest_version_mismatch(self):
        with self.assertRaisesRegex(ReleaseVerificationError, "version"):
            verify_binary(self.manifest, self.binary, version="2.1.326", platform="linux-x64")

    def test_rejects_missing_platform(self):
        with self.assertRaisesRegex(ReleaseVerificationError, "platform"):
            verify_binary(self.manifest, self.binary, version="2.1.325", platform="linux-arm64")

    def test_rejects_malformed_checksum(self):
        self.write_manifest({"version": "2.1.325", "platforms": {"linux-x64": {"checksum": "not-a-digest"}}})
        with self.assertRaisesRegex(ReleaseVerificationError, "checksum"):
            verify_binary(self.manifest, self.binary, version="2.1.325", platform="linux-x64")

    def test_rejects_binary_checksum_mismatch(self):
        self.write_manifest({"version": "2.1.325", "platforms": {"linux-x64": {"checksum": "0" * 64}}})
        with self.assertRaisesRegex(ReleaseVerificationError, "does not match"):
            verify_binary(self.manifest, self.binary, version="2.1.325", platform="linux-x64")

    def test_rejects_invalid_version_and_platform(self):
        with self.assertRaisesRegex(ReleaseVerificationError, "version"):
            verify_binary(self.manifest, self.binary, version="latest", platform="linux-x64")
        with self.assertRaisesRegex(ReleaseVerificationError, "platform"):
            verify_binary(self.manifest, self.binary, version="2.1.325", platform="../linux")

    def test_rejects_unavailable_manifest_or_binary(self):
        with self.assertRaisesRegex(ReleaseVerificationError, "manifest"):
            verify_binary(self.root / "missing.json", self.binary, version="2.1.325", platform="linux-x64")
        with self.assertRaisesRegex(ReleaseVerificationError, "executable"):
            verify_binary(self.manifest, self.root / "missing", version="2.1.325", platform="linux-x64")


if __name__ == "__main__":
    unittest.main(verbosity=2)
