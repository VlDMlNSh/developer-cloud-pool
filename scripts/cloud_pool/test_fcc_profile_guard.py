#!/usr/bin/env python3
"""Synthetic, no-secret tests for the FCC single-credential profile guard."""

import json
import os
import tempfile
import unittest
from pathlib import Path

from free_claude_code.config.env_migrations import quote_env_value
from fcc_profile_guard import ProfilePolicyError, audit_fcc_profile


class FccProfileGuardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name) / "home"
        self.home.mkdir(mode=0o700)
        os.chmod(self.home, 0o700)
        self.profile = self.home / ".fcc"
        self.profile.mkdir(mode=0o700)
        os.chmod(self.profile, 0o700)
        self.config = self.profile / ".env"
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": json.dumps(["synthetic-account-key"]),
            "MODEL": "groq/test-model",
        })

    def write_config(self, values: dict[str, str]) -> None:
        content = "".join(f"{key}={quote_env_value(value)}\n" for key, value in values.items())
        self.config.write_text(content, encoding="utf-8")
        os.chmod(self.config, 0o600)

    def audit(self, process_env=None):
        return audit_fcc_profile(self.home, process_env or {})

    def test_accepts_one_private_provider_credential_and_matching_model(self):
        result = self.audit()
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["provider_id"], "groq")
        self.assertEqual(result["credential_count"], 1)
        self.assertFalse(result["secret_values_emitted"])
        self.assertNotIn("synthetic-account-key", json.dumps(result))

    def test_rejects_multiple_credentials_for_same_provider(self):
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": json.dumps(["synthetic-one", "synthetic-two"]),
            "MODEL": "groq/test-model",
        })
        with self.assertRaisesRegex(ProfilePolicyError, "exactly one credential"):
            self.audit()

    def test_rejects_multiple_provider_accounts(self):
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": "synthetic-groq",
            "OPENAI_API_KEY": "synthetic-openai",
            "MODEL": "groq/test-model",
        })
        with self.assertRaisesRegex(ProfilePolicyError, "exactly one API-key provider"):
            self.audit()

    def test_rejects_model_provider_mismatch(self):
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": "synthetic-groq",
            "MODEL": "openai_api/test-model",
        })
        with self.assertRaisesRegex(ProfilePolicyError, "does not match"):
            self.audit()

    def test_rejects_model_fallbacks_without_echoing_values(self):
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": "synthetic-secret-marker",
            "MODEL": "groq/test-model",
            "MODEL_FALLBACKS": json.dumps([{"model": "groq/other", "api_key_number": 1}]),
        })
        with self.assertRaises(ProfilePolicyError) as caught:
            self.audit()
        self.assertNotIn("synthetic-secret-marker", str(caught.exception))

    def test_rejects_tier_model_override(self):
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": "synthetic-key",
            "MODEL": "groq/test-model",
            "MODEL_OPUS": "openai_api/other",
        })
        with self.assertRaisesRegex(ProfilePolicyError, "tier-specific"):
            self.audit()

    def test_rejects_custom_provider_even_when_single_key(self):
        self.write_config({
            "FCC_CONFIG_SCHEMA": "2",
            "GROQ_API_KEY": "synthetic-key",
            "MODEL": "groq/test-model",
            "FCC_CUSTOM_PROVIDERS": json.dumps([{
                "provider_id": "custom_" + "a" * 32,
                "display_name": "synthetic",
                "base_url": "https://custom.example/v1",
                "api_keys": ["synthetic-custom-key"],
            }]),
        })
        with self.assertRaisesRegex(ProfilePolicyError, "custom providers"):
            self.audit()

    def test_rejects_process_environment_credential_override(self):
        with self.assertRaisesRegex(ProfilePolicyError, "process-level"):
            self.audit({"GROQ_API_KEY": "synthetic-process-key"})

    def test_rejects_explicit_alternate_env_file(self):
        with self.assertRaisesRegex(ProfilePolicyError, "FCC_ENV_FILE"):
            self.audit({"FCC_ENV_FILE": "/tmp/untrusted.env"})

    def test_rejects_nonempty_oauth_auth_directory(self):
        auth = self.profile / "auth"
        auth.mkdir(mode=0o700)
        (auth / "openai.json").write_text("synthetic-oauth-state", encoding="utf-8")
        with self.assertRaisesRegex(ProfilePolicyError, "OAuth/native auth"):
            self.audit()

    def test_rejects_group_or_world_accessible_profile(self):
        os.chmod(self.profile, 0o750)
        with self.assertRaisesRegex(ProfilePolicyError, "mode 0700"):
            self.audit()

    def test_rejects_group_or_world_accessible_config(self):
        os.chmod(self.config, 0o640)
        with self.assertRaisesRegex(ProfilePolicyError, "mode 0600"):
            self.audit()

    def test_rejects_legacy_config_source(self):
        legacy = self.home / "free-claude-code"
        legacy.mkdir()
        (legacy / ".env").write_text("synthetic=true", encoding="utf-8")
        with self.assertRaisesRegex(ProfilePolicyError, "legacy FCC config"):
            self.audit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
