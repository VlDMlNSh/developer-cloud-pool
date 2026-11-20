#!/usr/bin/env python3
"""Execute a child process with a deliberately small Cloud Pool environment.

The wrapper is a process boundary, not a host firewall or a sanitizer for its
parent. PATH and HOME/XDG directories are validated before exec; callers must
construct an isolated HOME and a trusted PATH before invoking this module.
"""

from __future__ import annotations

import os
import stat
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path


ALLOWED_ENV_KEYS = frozenset(
    {
        "PATH",
        "HOME",
        "USER",
        "LOGNAME",
        "LANG",
        "LC_ALL",
        "TERM",
        "TMPDIR",
        "TMP",
        "TEMP",
        "XDG_CONFIG_HOME",
        "XDG_DATA_HOME",
        "XDG_CACHE_HOME",
        "HOST",
        "PORT",
        "FCC_OPEN_BROWSER",
        "PROVIDER_MAX_ATTEMPTS",
        "PROVIDER_MAX_CONCURRENCY",
    }
)
REQUIRED_ENV_KEYS = frozenset({"PATH", "HOME"})
XDG_KEYS = ("XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME")


class EnvironmentPolicyError(ValueError):
    """The supplied parent environment does not satisfy the child policy."""


def _resolved_directory(value: str, *, variable: str) -> Path:
    """Resolve an existing directory and reject unsafe ownership or write bits."""
    try:
        resolved = Path(value).resolve(strict=True)
        metadata = resolved.stat()
    except (OSError, RuntimeError) as exc:
        raise EnvironmentPolicyError(f"{variable} must resolve to an existing directory") from exc

    if not stat.S_ISDIR(metadata.st_mode):
        raise EnvironmentPolicyError(f"{variable} must resolve to a directory")
    if metadata.st_uid not in {0, os.geteuid()}:
        raise EnvironmentPolicyError(f"{variable} directory has an untrusted owner")
    if metadata.st_mode & 0o022:
        raise EnvironmentPolicyError(
            f"{variable} directory is group/world writable: {resolved} "
            f"(mode={stat.S_IMODE(metadata.st_mode):04o}, uid={metadata.st_uid})"
        )
    return resolved


def _private_user_directory(value: str, *, variable: str) -> Path:
    """Require a private directory owned by the current runner identity."""
    resolved = _resolved_directory(value, variable=variable)
    metadata = resolved.stat()
    if metadata.st_uid != os.geteuid():
        raise EnvironmentPolicyError(f"{variable} directory must be owned by the current user")
    if metadata.st_mode & 0o077:
        raise EnvironmentPolicyError(f"{variable} directory must not be accessible by group/other")
    return resolved


def build_child_environment(source: Mapping[str, str]) -> dict[str, str]:
    """Copy approved variables after validating executable and config directories."""
    child: dict[str, str] = {}
    for key in sorted(ALLOWED_ENV_KEYS):
        value = source.get(key)
        if value is None:
            continue
        if not value or "\x00" in value or "\r" in value or "\n" in value:
            raise EnvironmentPolicyError(f"invalid value for allowlisted variable: {key}")
        child[key] = value

    missing = REQUIRED_ENV_KEYS.difference(child)
    if missing:
        raise EnvironmentPolicyError(
            "missing required environment variables: " + ", ".join(sorted(missing))
        )

    home = _private_user_directory(child["HOME"], variable="HOME")
    path_entries = child["PATH"].split(os.pathsep)
    if not path_entries or any(not entry or not os.path.isabs(entry) for entry in path_entries):
        raise EnvironmentPolicyError("PATH must contain only non-empty absolute directories")

    resolved_path = []
    for entry in path_entries:
        resolved = _resolved_directory(entry, variable="PATH entry")
        metadata = resolved.stat()
        # The worker UID must not be able to replace a launcher after validation.
        # Require immutable-to-worker, root-owned system directories in PATH.
        if metadata.st_uid != 0:
            raise EnvironmentPolicyError("PATH entries must be owned by root")
        resolved_path.append(resolved)
    if len(set(resolved_path)) != len(resolved_path):
        raise EnvironmentPolicyError("PATH must not contain duplicate resolved directories")
    child["PATH"] = os.pathsep.join(str(entry) for entry in resolved_path)

    for key in XDG_KEYS:
        value = child.get(key)
        if value is None:
            continue
        xdg_path = _private_user_directory(value, variable=key)
        try:
            xdg_path.relative_to(home)
        except ValueError as exc:
            raise EnvironmentPolicyError(f"{key} must be inside the isolated HOME") from exc
        child[key] = str(xdg_path)

    child["HOME"] = str(home)
    return child


def main(argv: Sequence[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if args and args[0] == "--":
        args = args[1:]
    if not args:
        print("usage: exec_allowlist.py -- COMMAND [ARG ...]", file=sys.stderr)
        return 64

    try:
        child_env = build_child_environment(os.environ)
    except EnvironmentPolicyError as exc:
        print(f"Cloud Pool child environment rejected: {exc}", file=sys.stderr)
        return 78

    try:
        os.execvpe(args[0], args, child_env)
    except OSError as exc:
        print(f"Cloud Pool child process could not be started: {exc}", file=sys.stderr)
        return 127
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
