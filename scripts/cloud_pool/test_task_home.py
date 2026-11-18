#!/usr/bin/env python3
"""Regression tests for disposable per-task HOME provisioning."""
import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from task_home import (
    FORBIDDEN_STORES,
    TaskHomeError,
    create_task_home,
    destroy_task_home,
    isolated_task_home,
)


class TaskHomeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "worker-homes"
        self.root.mkdir(mode=0o700)
        os.chmod(self.root, 0o700)

    def test_home_and_every_xdg_path_are_private_and_fresh(self):
        task = create_task_home(self.root, "task-123")
        self.addCleanup(lambda: destroy_task_home(task, self.root))
        self.assertEqual(task.path.parent, self.root.resolve())
        self.assertEqual(task.path.stat().st_mode & 0o777, 0o700)
        self.assertEqual((task.path / ".local").stat().st_mode & 0o777, 0o700)
        self.assertEqual((task.path / ".local").stat().st_uid, os.geteuid())
        self.assertEqual(set(task.environment), {"HOME", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME"})
        for key, value in task.environment.items():
            path = Path(value)
            self.assertTrue(path.is_dir())
            self.assertEqual(path.stat().st_uid, os.geteuid())
            self.assertEqual(path.stat().st_mode & 0o777, 0o700)
            if key != "HOME":
                self.assertEqual(path.parent if key == "XDG_DATA_HOME" else path.parent, task.path if key != "XDG_DATA_HOME" else task.path / ".local")
                self.assertFalse(any((path / item).exists() for item in FORBIDDEN_STORES))

    def test_distinct_tasks_never_share_home_or_xdg_paths(self):
        tasks = []
        lock = threading.Lock()
        barrier = threading.Barrier(8)
        def provision(index):
            task = create_task_home(self.root, f"parallel-{index}")
            with lock:
                tasks.append(task)
            barrier.wait(timeout=10)
        threads = [threading.Thread(target=provision, args=(index,)) for index in range(8)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)
        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertEqual(len(tasks), 8)
        homes = {task.environment["HOME"] for task in tasks}
        self.assertEqual(len(homes), 8)
        for key in ("XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME"):
            self.assertEqual(len({task.environment[key] for task in tasks}), 8)
        for task in tasks:
            destroy_task_home(task, self.root)

    def test_context_manager_tears_down_after_success_and_exception(self):
        with isolated_task_home(self.root, "success") as task:
            path = task.path
            self.assertTrue(path.exists())
        self.assertFalse(path.exists())
        with self.assertRaisesRegex(RuntimeError, "sentinel"):
            with isolated_task_home(self.root, "failure") as task:
                path = task.path
                raise RuntimeError("sentinel")
        self.assertFalse(path.exists())

    def test_rejects_invalid_task_ids_and_outside_deletion(self):
        for value in ("", "../escape", "contains space", "x" * 65):
            with self.subTest(task_id=value), self.assertRaises(TaskHomeError):
                create_task_home(self.root, value)
        task = create_task_home(self.root, "safe")
        outside = Path(self.temp.name) / "outside"
        outside.mkdir(mode=0o700)
        forged = type(task)(task.task_id, outside, task.environment)
        with self.assertRaises(TaskHomeError):
            destroy_task_home(forged, self.root)
        destroy_task_home(task, self.root)

    def test_rejects_symlinked_root_and_task_home_without_following(self):
        real_root = self.root / "real-root"
        real_root.mkdir(mode=0o700)
        os.chmod(real_root, 0o700)
        root_link = self.root / "root-link"
        root_link.symlink_to(real_root, target_is_directory=True)
        with self.assertRaisesRegex(TaskHomeError, "symlink"):
            create_task_home(root_link, "root-link")

        task = create_task_home(self.root, "symlinked")
        alias = self.root / "pool-task-symlinked-alias"
        alias.symlink_to(task.path, target_is_directory=True)
        forged = type(task)(task.task_id, alias, task.environment)
        with self.assertRaisesRegex(TaskHomeError, "symlink"):
            destroy_task_home(forged, self.root)
        self.assertTrue(task.path.is_dir())
        alias.unlink()
        destroy_task_home(task, self.root)

    def test_rejects_dangling_credential_store_symlink_and_cleans_home(self):
        real_mkdtemp = tempfile.mkdtemp

        def contaminated_home(*args, **kwargs):
            created = Path(real_mkdtemp(*args, **kwargs))
            (created / ".aws").symlink_to(created / "missing-credential-target")
            return str(created)

        with patch("task_home.tempfile.mkdtemp", side_effect=contaminated_home):
            with self.assertRaisesRegex(TaskHomeError, "credential store"):
                create_task_home(self.root, "dangling-store")

        self.assertEqual(list(self.root.iterdir()), [])

    def test_refuses_insecure_root(self):
        os.chmod(self.root, 0o777)
        with self.assertRaises(TaskHomeError):
            create_task_home(self.root, "unsafe")


if __name__ == "__main__":
    unittest.main(verbosity=2)
