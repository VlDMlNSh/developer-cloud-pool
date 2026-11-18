#!/usr/bin/env python3
"""Provision disposable, per-task HOME/XDG directories for isolated workers.

This is a filesystem isolation primitive, not a sandbox or host firewall.
Callers must still provide a least-privilege process environment and execution
boundary. The returned HOME is fresh and never populated from the runner HOME.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import shutil
import stat
import tempfile
from dataclasses import dataclass
from pathlib import Path


class TaskHomeError(RuntimeError):
    """Raised when a private task HOME cannot be safely provisioned/removed."""


XDG_LAYOUT = {
    "XDG_CONFIG_HOME": ".config",
    "XDG_DATA_HOME": ".local/share",
    "XDG_CACHE_HOME": ".cache",
}
OWNER_MARKER = ".cloud-pool-task-home-owner.json"

FORBIDDEN_STORES = (
    ".claude",
    ".fcc",
    ".aws",
    ".azure",
    ".kube",
    ".ssh",
    ".docker",
    ".config/gh",
    ".config/gcloud",
)


@dataclass(frozen=True)
class TaskHome:
    task_id: str
    path: Path
    environment: dict[str, str]
    instance_id: str = ""


def _private_directory(path: Path, *, create: bool = False) -> Path:
    if create:
        path.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        # Inspect the supplied path before resolving it: resolve() follows
        # symlinks and would otherwise hide a symlinked HOME/root from callers.
        supplied = path.lstat()
        if stat.S_ISLNK(supplied.st_mode):
            raise TaskHomeError("task HOME path must not be a symlink")
        if not stat.S_ISDIR(supplied.st_mode):
            raise TaskHomeError("task HOME path is not a directory")
        resolved = path.resolve(strict=True)
        info = resolved.stat()
    except TaskHomeError:
        raise
    except (OSError, RuntimeError) as exc:
        raise TaskHomeError("task HOME directory is unavailable") from exc
    if not stat.S_ISDIR(info.st_mode):
        raise TaskHomeError("task HOME path is not a directory")
    if info.st_uid != os.geteuid() or info.st_mode & 0o077:
        raise TaskHomeError("task HOME must be owned by the current user and mode 0700")
    return resolved


def create_task_home(root: str | Path, task_id: str) -> TaskHome:
    """Create a new private HOME below root with explicit private XDG paths."""
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", task_id or ""):
        raise TaskHomeError("task identifier is invalid")
    base = _private_directory(Path(root), create=True)
    try:
        home = Path(tempfile.mkdtemp(prefix=f"pool-task-{task_id}-", dir=base))
        os.chmod(home, 0o700)
        home = _private_directory(home)
        instance_id = secrets.token_hex(32)
        marker = home / OWNER_MARKER
        marker_fd = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0), 0o600)
        with os.fdopen(marker_fd, "w", encoding="utf-8") as marker_file:
            json.dump({"task_id": task_id, "instance_id": instance_id}, marker_file, sort_keys=True)
            marker_file.write("\n")
        os.chmod(marker, 0o600)
        xdg: dict[str, str] = {}
        for variable, relative in XDG_LAYOUT.items():
            directory = home / relative
            # Create and validate intermediate parents explicitly as well;
            # pathlib's parents=True does not apply the requested mode to them.
            parent = directory.parent
            parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            os.chmod(parent, 0o700)
            _private_directory(parent)
            directory.mkdir(mode=0o700, exist_ok=False)
            os.chmod(directory, 0o700)
            xdg[variable] = str(_private_directory(directory))
        if any((home / item).exists() or (home / item).is_symlink() for item in FORBIDDEN_STORES):
            raise TaskHomeError("fresh task HOME unexpectedly contains a credential store")
        return TaskHome(
            task_id=task_id,
            path=home,
            environment={"HOME": str(home), **xdg},
            instance_id=instance_id,
        )
    except Exception:
        if "home" in locals():
            shutil.rmtree(home, ignore_errors=True)
        raise


def destroy_task_home(task_home: TaskHome, root: str | Path) -> None:
    """Remove only the exact private task directory created below root."""
    # Validate the caller-supplied paths before canonicalization so a symlink
    # cannot be silently resolved into an apparently valid in-root directory.
    base = _private_directory(Path(root))
    _private_directory(task_home.path)
    home = task_home.path.resolve(strict=True)
    if home.parent != base or not home.name.startswith(f"pool-task-{task_home.task_id}-"):
        raise TaskHomeError("refusing to remove a path outside this task's private root")
    if not re.fullmatch(r"[0-9a-f]{64}", task_home.instance_id or ""):
        raise TaskHomeError("task HOME instance identity is missing or invalid")
    marker = home / OWNER_MARKER
    try:
        marker_info = marker.lstat()
        if not stat.S_ISREG(marker_info.st_mode) or marker_info.st_uid != os.geteuid() or stat.S_IMODE(marker_info.st_mode) != 0o600:
            raise TaskHomeError("task HOME ownership marker is unsafe")
        with marker.open("r", encoding="utf-8") as marker_file:
            ownership = json.load(marker_file)
    except TaskHomeError:
        raise
    except (OSError, ValueError, TypeError) as exc:
        raise TaskHomeError("task HOME ownership marker is unavailable or invalid") from exc
    if ownership != {"task_id": task_home.task_id, "instance_id": task_home.instance_id}:
        raise TaskHomeError("task HOME descriptor does not match this directory instance")
    shutil.rmtree(home)


class isolated_task_home:
    """Context manager that guarantees best-effort teardown after task execution."""

    def __init__(self, root: str | Path, task_id: str):
        self.root = Path(root)
        self.task_id = task_id
        self.task_home: TaskHome | None = None

    def __enter__(self) -> TaskHome:
        self.task_home = create_task_home(self.root, self.task_id)
        return self.task_home

    def __exit__(self, exc_type, exc, traceback) -> bool:
        if self.task_home is not None:
            destroy_task_home(self.task_home, self.root)
        return False
