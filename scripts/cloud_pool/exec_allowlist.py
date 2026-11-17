#!/usr/bin/env python3
"""Execute a child process with a deliberately small Cloud Pool environment.

This wrapper is intended for trusted, ephemeral GitHub-hosted runner jobs.
It does not sanitize an already-running process; invoke it as the process
boundary before starting FCC's fcc-claude launcher.
"""

from __future__ import annotations

import os
import sys
from collections.abc import Mapping, Sequence


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


class EnvironmentPolicyError(ValueError):
    """The supplied parent environment does not satisfy the child policy."""


def build_child_environment(source: Mapping[str, str]) -> dict[str, str]:
    """Copy only explicitly approved, well-formed process variables."""
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

    path_entries = child["PATH"].split(os.pathsep)
    if any(not entry or not os.path.isabs(entry) or entry in {".", ".."} for entry in path_entries):
        raise EnvironmentPolicyError("PATH must contain only non-empty absolute directories")

    if not os.path.isabs(child["HOME"]):
        raise EnvironmentPolicyError("HOME must be an absolute path")

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
