#!/usr/bin/env python3
"""Unit tests for the Cloud Pool child-process environment boundary."""

import os
import tempfile
import unittest
from pathlib import Path

from exec_allowlist import (
    ALLOWED_ENV_KEYS,
    EnvironmentPolicyError,
    build_child_environment,
)


class ChildEnvironmentTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.home = self.root / "home"
        self.home.mkdir(mode=0o700)
        os.chmod(self.home, 0o700)
        self.bin_dir = self.root / "bin"
        self.bin_dir.mkdir(mode=0o700)
        os.chmod(self.bin_dir, 0o700)
        self.xdg_dirs = {}
        for key in ("XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME"):
            directory = self.home / key.lower()
            directory.mkdir(mode=0o700)
            os.chmod(directory, 0o700)
            self.xdg_dirs[key] = str(directory)

    def valid_parent(self) -> dict[str, str]:
        return {
            "PATH": "/usr/bin",
            "HOME": str(self.home),
            **self.xdg_dirs,
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

    def test_only_explicit_allowlist_is_forwarded_and_paths_are_canonical(self) -> None:
        parent = self.valid_parent()
        child = build_child_environment(parent)
        self.assertEqual(set(child), set(parent).intersection(ALLOWED_ENV_KEYS))
        self.assertEqual(child["PATH"], "/usr/bin")
        self.assertEqual(child["HOME"], str(self.home.resolve()))
        self.assertEqual(child["XDG_CONFIG_HOME"], str((self.home / "xdg_config_home").resolve()))
        self.assertEqual(child["HOST"], "127.0.0.1")

    def test_credential_and_proxy_variables_are_dropped(self) -> None:
        child = build_child_environment(self.valid_parent())
        for name in (
            "GITHUB_TOKEN", "GH_TOKEN", "ANTHROPIC_API_KEY", "OPENAI_API_KEY",
            "GOOGLE_API_KEY", "AWS_SECRET_ACCESS_KEY", "HTTP_PROXY", "HTTPS_PROXY",
            "UNRELATED_PRIVATE_VALUE",
        ):
            self.assertNotIn(name, child)

    def test_fcc_provider_keys_and_fallback_settings_never_cross_child_boundary(self) -> None:
        # Names are derived from the Settings aliases in pinned FCC commit
        # eb92e4c07af0d6ad8881dce1cd958c3d072c27c5. Values are inert sentinels.
        # This guard prevents inherited process config from supplying provider
        # key lists, numbered slots, custom providers or model fallback policy.
        fcc_provider_settings = (
            "FCC_CUSTOM_PROVIDERS",
            "MODEL",
            "MODEL_FALLBACKS",
            "OPENAI_API_KEY",
            "AZURE_OPENAI_API_KEY",
            "OPENROUTER_API_KEY",
            "MISTRAL_API_KEY",
            "CODESTRAL_API_KEY",
            "DEEPSEEK_API_KEY",
            "KIMI_API_KEY",
            "KIMI_CODE_API_KEY",
            "WAFER_API_KEY",
            "MINIMAX_API_KEY",
            "OPENCODE_API_KEY",
            "AI_GATEWAY_API_KEY",
            "AWS_BEARER_TOKEN_BEDROCK",
            "HUGGINGFACE_API_KEY",
            "COHERE_API_KEY",
            "SAMBANOVA_API_KEY",
            "KILO_API_KEY",
            "ZAI_API_KEY",
            "TOKENROUTER_API_KEY",
            "NARAROUTE_API_KEY",
            "POOLSIDE_API_KEY",
            "LLM7_API_KEY",
            "LIGHTNING_API_KEY",
            "EXPLABS_API_KEY",
            "CHEAPER_INFERENCE_API_KEY",
            "ORCAROUTER_API_KEY",
            "ATLASCLOUD_API_KEY",
            "XKIRO_API_KEY",
            "OPPER_API_KEY",
            "FIREWORKS_API_KEY",
            "NOVITA_API_KEY",
            "CLOUDFLARE_API_TOKEN",
            "GEMINI_API_KEY",
            "GROQ_API_KEY",
            "CLINE_API_KEY",
            "XAI_API_KEY",
            "ANTHROPIC_API_KEY",
            "ALIBABA_CLOUD_API_KEY",
            "QWENCLOUD_API_KEY",
            "QWENCLOUD_CODING_API_KEY",
            "TOGETHER_API_KEY",
            "DEEPINFRA_API_KEY",
            "SILICONFLOW_API_KEY",
            "NEBIUS_API_KEY",
            "CHUTES_API_KEY",
            "FEATHERLESS_API_KEY",
            "AGNES_API_KEY",
            "ZENMUX_API_KEY",
            "WANDB_API_KEY",
            "CEREBRAS_API_KEY",
            "OLLAMA_API_KEY",
            "NVIDIA_NIM_API_KEY",
            "ANTHROPIC_AUTH_TOKEN",
        )
        parent = self.valid_parent()
        parent.update({name: "synthetic-placeholder" for name in fcc_provider_settings})

        child = build_child_environment(parent)

        for name in fcc_provider_settings:
            with self.subTest(variable=name):
                self.assertNotIn(name, child)
        self.assertFalse(any("synthetic-placeholder" in value for value in child.values()))

    def test_missing_required_values_fail_closed(self) -> None:
        for missing in ("PATH", "HOME"):
            parent = self.valid_parent()
            del parent[missing]
            with self.subTest(missing=missing):
                with self.assertRaises(EnvironmentPolicyError):
                    build_child_environment(parent)

    def test_relative_empty_missing_and_duplicate_path_entries_are_rejected(self) -> None:
        for value in (
            "/usr/bin::/bin",
            "/usr/bin:relative",
            "/usr/bin:.",
            "/usr/bin:/usr/bin",
            "/usr/bin:/does/not/exist",
        ):
            parent = self.valid_parent()
            parent["PATH"] = value
            with self.subTest(path=value):
                with self.assertRaises(EnvironmentPolicyError):
                    build_child_environment(parent)

    def test_runner_owned_path_directory_is_rejected_even_when_private(self) -> None:
        parent = self.valid_parent()
        parent["PATH"] = str(self.bin_dir)
        with self.assertRaisesRegex(EnvironmentPolicyError, "PATH entries must be owned by root"):
            build_child_environment(parent)

    def test_path_file_and_group_world_writable_directory_are_rejected(self) -> None:
        file_path = self.root / "not-a-directory"
        file_path.write_text("x", encoding="utf-8")
        writable = self.root / "writable"
        writable.mkdir()
        os.chmod(writable, 0o777)
        for entry in (str(file_path), str(writable)):
            parent = self.valid_parent()
            parent["PATH"] = entry
            with self.subTest(path=entry):
                with self.assertRaises(EnvironmentPolicyError) as caught:
                    build_child_environment(parent)
                if entry == str(writable):
                    self.assertIn("mode=0777", str(caught.exception))
                    self.assertIn(str(writable.resolve()), str(caught.exception))

    def test_home_must_be_private_current_user_directory(self) -> None:
        os.chmod(self.home, 0o755)
        with self.assertRaises(EnvironmentPolicyError):
            build_child_environment(self.valid_parent())

    def test_xdg_paths_must_be_private_and_inside_home(self) -> None:
        outside = self.root / "outside"
        outside.mkdir(mode=0o700)
        parent = self.valid_parent()
        parent["XDG_CONFIG_HOME"] = str(outside)
        with self.assertRaises(EnvironmentPolicyError):
            build_child_environment(parent)

        unsafe = self.home / "unsafe"
        unsafe.mkdir(mode=0o755)
        os.chmod(unsafe, 0o755)
        parent = self.valid_parent()
        parent["XDG_CACHE_HOME"] = str(unsafe)
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
