#!/usr/bin/env python3
"""Unit tests for the Cloud Pool child-process environment boundary."""

import os
import unittest

from exec_allowlist import (
    ALLOWED_ENV_KEYS,
    EnvironmentPolicyError,
    build_child_environment,
)


class ChildEnvironmentTests(unittest.TestCase):
    def valid_parent(self) -> dict[str, str]:
        return {
            "PATH": "/opt/fcc/bin:/usr/local/bin:/usr/bin:/bin",
            "HOME": "/tmp/cloud-pool-home",
            "USER": "runner",
            "LANG": "C.UTF-8",
            "HOST": "127.0.0.1",
            "PORT": "18766",
            "FCC_OPEN_BROWSER": "false",
            "PROVIDER_MAX_ATTEMPTS": "1",
            "GITHUB_TOKEN": "synthetic-github-token",
            "GH_TOKEN": "synthetic-gh-token",
            "ANTHROPIC_API_KEY": "synthetic-provider-key",
            "OPENAI_API_KEY": "synthetic-openai-key",
            "GOOGLE_API_KEY": "synthetic-google-key",
            "AWS_SECRET_ACCESS_KEY": "synthetic-aws-secret",
            "HTTP_PROXY": "http://untrusted-proxy.invalid:8080",
            "HTTPS_PROXY": "http://untrusted-proxy.invalid:8080",
            "UNRELATED_PRIVATE_VALUE": "must-not-cross-boundary",
        }

    def test_only_explicit_allowlist_is_forwarded(self) -> None:
        parent = self.valid_parent()
        child = build_child_environment(parent)
        self.assertEqual(set(child), set(parent).intersection(ALLOWED_ENV_KEYS))
        self.assertEqual(child["PATH"], parent["PATH"])
        self.assertEqual(child["HOME"], parent["HOME"])
        self.assertEqual(child["HOST"], "127.0.0.1")
        self.assertEqual(child["PORT"], "18766")

    def test_credential_and_proxy_variables_are_dropped(self) -> None:
        child = build_child_environment(self.valid_parent())
        for name in (
            "GITHUB_TOKEN",
            "GH_TOKEN",
            "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY",
            "GOOGLE_API_KEY",
            "AWS_SECRET_ACCESS_KEY",
            "HTTP_PROXY",
            "HTTPS_PROXY",
            "UNRELATED_PRIVATE_VALUE",
        ):
            self.assertNotIn(name, child)

    def test_missing_required_values_fail_closed(self) -> None:
        for missing in ("PATH", "HOME"):
            parent = self.valid_parent()
            del parent[missing]
            with self.subTest(missing=missing):
                with self.assertRaises(EnvironmentPolicyError):
                    build_child_environment(parent)

    def test_relative_or_empty_path_entries_are_rejected(self) -> None:
        for value in ("/usr/bin::/bin", "/usr/bin:relative:/bin", "/usr/bin:.:/bin"):
            parent = self.valid_parent()
            parent["PATH"] = value
            with self.subTest(path=value):
                with self.assertRaises(EnvironmentPolicyError):
                    build_child_environment(parent)

    def test_non_absolute_home_is_rejected(self) -> None:
        parent = self.valid_parent()
        parent["HOME"] = "relative-home"
        with self.assertRaises(EnvironmentPolicyError):
            build_child_environment(parent)

    def test_malformed_allowlisted_values_are_rejected(self) -> None:
        for value in ("", "line1\nline2", "line1\rline2", "bad\x00value"):
            parent = self.valid_parent()
            parent["TERM"] = value
            with self.subTest(value=repr(value)):
                with self.assertRaises(EnvironmentPolicyError):
                    build_child_environment(parent)


if __name__ == "__main__":
    unittest.main(verbosity=2)
