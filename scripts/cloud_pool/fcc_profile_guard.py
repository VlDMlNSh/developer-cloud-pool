#!/usr/bin/env python3
"""Fail-closed, value-redacting audit of one isolated FCC API-key profile.

Run with the pinned FCC virtualenv's Python. This audits the managed profile
without printing, returning, hashing, or otherwise disclosing credential data.
It is a configuration-boundary check, not proof of provider identity or quota.
"""

from __future__ import annotations

import json
import os
import stat
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from free_claude_code.config.env_files import dotenv_values_from_file
from free_claude_code.config.env_migrations import CONFIG_SCHEMA_VERSION
from free_claude_code.config.provider_catalog import PROVIDER_CATALOG
from free_claude_code.config.settings import Settings


class ProfilePolicyError(ValueError):
    """The FCC profile is not safe for a single-account Cloud Pool worker."""


def _private_directory(path: Path, label: str) -> Path:
    try:
        if path.is_symlink():
            raise ProfilePolicyError(f"{label} must not be a symlink")
        resolved = path.resolve(strict=True)
        info = resolved.stat()
    except OSError as exc:
        raise ProfilePolicyError(f"{label} is unavailable") from exc
    if not stat.S_ISDIR(info.st_mode):
        raise ProfilePolicyError(f"{label} must be a directory")
    if info.st_uid != os.geteuid() or info.st_mode & 0o077:
        raise ProfilePolicyError(f"{label} must be owned by the worker and mode 0700")
    return resolved


def _private_config_file(path: Path) -> Path:
    try:
        if path.is_symlink():
            raise ProfilePolicyError("managed FCC config must not be a symlink")
        resolved = path.resolve(strict=True)
        info = resolved.stat()
    except OSError as exc:
        raise ProfilePolicyError("managed FCC config is unavailable") from exc
    if not stat.S_ISREG(info.st_mode):
        raise ProfilePolicyError("managed FCC config must be a regular file")
    if info.st_uid != os.geteuid() or stat.S_IMODE(info.st_mode) != 0o600:
        raise ProfilePolicyError("managed FCC config must be owned by worker and mode 0600")
    return resolved


def _credential_fields() -> tuple[tuple[str, str], ...]:
    fields = {
        (descriptor.provider_id, descriptor.credential_env)
        for descriptor in PROVIDER_CATALOG.values()
        if descriptor.credential_env and descriptor.credential_attr
    }
    return tuple(sorted(fields))


def audit_fcc_profile(
    home: Path,
    process_env: Mapping[str, str] | None = None,
) -> dict[str, Any]:
    """Validate one API-key provider, one key, one model, and no fallback.

    Only non-secret profile metadata is returned. Credential values are parsed
    in memory by the pinned FCC Settings model and never included in errors.
    """
    env = dict(os.environ if process_env is None else process_env)
    home_path = _private_directory(home, "worker HOME")
    profile_dir = _private_directory(home_path / ".fcc", "FCC profile directory")
    config_path = _private_config_file(profile_dir / ".env")
    if config_path.parent != profile_dir:
        raise ProfilePolicyError("managed FCC config must remain inside the profile")

    if env.get("FCC_ENV_FILE"):
        raise ProfilePolicyError("FCC_ENV_FILE override is forbidden")
    for legacy in (
        home_path / "free-claude-code" / ".env",
        home_path / ".config" / "free-claude-code" / ".env",
    ):
        if legacy.exists() or legacy.is_symlink():
            raise ProfilePolicyError("legacy FCC config source is present")

    sensitive_overrides = {
        "FCC_CUSTOM_PROVIDERS",
        "MODEL",
        "MODEL_FABLE",
        "MODEL_OPUS",
        "MODEL_SONNET",
        "MODEL_HAIKU",
        "MODEL_FALLBACKS",
        "ANTHROPIC_AUTH_TOKEN",
        *(name for _, name in _credential_fields()),
    }
    if sensitive_overrides.intersection(env):
        raise ProfilePolicyError("process-level FCC credential or routing override is present")

    auth_dir = profile_dir / "auth"
    if auth_dir.is_symlink():
        raise ProfilePolicyError("FCC auth directory must not be a symlink")
    if auth_dir.exists():
        if not auth_dir.is_dir() or any(auth_dir.iterdir()):
            raise ProfilePolicyError("non-empty FCC OAuth/native auth state is not permitted")

    try:
        managed = dotenv_values_from_file(config_path)
        if managed.get("FCC_CONFIG_SCHEMA") != CONFIG_SCHEMA_VERSION:
            raise ProfilePolicyError("unsupported FCC managed-config schema")
        settings = Settings.model_validate(managed)
    except ProfilePolicyError:
        raise
    except Exception as exc:
        # Do not propagate Pydantic/dotenv exception text: it may contain input.
        raise ProfilePolicyError("FCC managed settings are invalid; values withheld") from None

    if settings.custom_providers:
        raise ProfilePolicyError("custom providers are not permitted in this profile")
    if settings.model_fallbacks:
        raise ProfilePolicyError("MODEL_FALLBACKS must be empty")
    tier_models = (
        settings.model_fable,
        settings.model_opus,
        settings.model_sonnet,
        settings.model_haiku,
    )
    if any(tier_models):
        raise ProfilePolicyError("tier-specific model overrides are not permitted")

    grouped: dict[tuple[str, str], set[str]] = {}
    for descriptor in PROVIDER_CATALOG.values():
        if not descriptor.credential_env or not descriptor.credential_attr:
            continue
        identity = (descriptor.credential_env, descriptor.credential_attr)
        grouped.setdefault(identity, set()).add(descriptor.provider_id)

    configured: list[tuple[str, str, set[str], int]] = []
    for (credential_env, credential_attr), provider_ids in grouped.items():
        keys = getattr(settings, credential_attr, ())
        count = len(keys)
        if count:
            configured.append((credential_env, credential_attr, provider_ids, count))

    if len(configured) != 1:
        raise ProfilePolicyError("exactly one API-key credential owner must be configured")
    _, _, provider_ids, key_count = configured[0]
    if key_count != 1:
        raise ProfilePolicyError("exactly one credential must be configured")
    model_provider = settings.model.partition("/")[0]
    if model_provider not in provider_ids:
        raise ProfilePolicyError("selected model provider does not match credential owner")
    provider_id = model_provider

    return {
        "status": "PASS",
        "profile": ".fcc",
        "provider_id": provider_id,
        "model_id": settings.model,
        "credential_count": 1,
        "fallbacks_disabled": True,
        "tier_overrides_disabled": True,
        "oauth_state_absent": True,
        "secret_values_emitted": False,
    }


def main() -> int:
    try:
        result = audit_fcc_profile(Path.home())
    except ProfilePolicyError as exc:
        print(json.dumps({"status": "DENY", "reason": str(exc), "secret_values_emitted": False}))
        return 78
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
