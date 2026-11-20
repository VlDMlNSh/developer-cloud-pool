#!/usr/bin/env python3
"""Verify an installed Claude Code binary against a release manifest.

The caller must verify the detached manifest signature against Anthropic's
pinned release-key fingerprint before invoking this checksum verifier.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import stat
import sys
from pathlib import Path


class ReleaseVerificationError(ValueError):
    """The manifest or installed binary does not match the pinned release."""


def verify_binary(manifest_path: Path, binary_path: Path, *, version: str, platform: str) -> dict[str, object]:
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ReleaseVerificationError("expected version must be an exact semantic version")
    if not re.fullmatch(r"[a-z0-9-]+", platform):
        raise ReleaseVerificationError("platform identifier is invalid")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        raise ReleaseVerificationError("signed release manifest is unavailable or invalid") from None
    if not isinstance(manifest, dict):
        raise ReleaseVerificationError("release manifest root must be an object")
    manifest_version = manifest.get("version")
    if manifest_version is not None and str(manifest_version) != version:
        raise ReleaseVerificationError("release manifest version does not match the pinned version")
    platforms = manifest.get("platforms")
    if not isinstance(platforms, dict) or not isinstance(platforms.get(platform), dict):
        raise ReleaseVerificationError("pinned platform is missing from the release manifest")
    checksum = platforms[platform].get("checksum")
    if not isinstance(checksum, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", checksum):
        raise ReleaseVerificationError("release manifest checksum is missing or malformed")
    try:
        resolved = binary_path.resolve(strict=True)
        info = resolved.stat()
        if not stat.S_ISREG(info.st_mode):
            raise ReleaseVerificationError("installed executable is not a regular file")
        digest = hashlib.sha256(resolved.read_bytes()).hexdigest()
    except ReleaseVerificationError:
        raise
    except OSError:
        raise ReleaseVerificationError("installed executable is unavailable") from None
    if digest.lower() != checksum.lower():
        raise ReleaseVerificationError("installed executable checksum does not match the signed manifest")
    return {
        "status": "PASS",
        "version": version,
        "platform": platform,
        "sha256": digest,
        "checksum_match": True,
        "binary_size_bytes": info.st_size,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--version", required=True)
    parser.add_argument("--platform", required=True)
    args = parser.parse_args()
    try:
        result = verify_binary(args.manifest, args.binary, version=args.version, platform=args.platform)
    except ReleaseVerificationError as exc:
        print(json.dumps({"status": "DENY", "reason": str(exc)}, sort_keys=True))
        return 78
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
