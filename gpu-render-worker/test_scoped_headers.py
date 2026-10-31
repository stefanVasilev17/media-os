import importlib
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

sys.modules.setdefault("requests", types.ModuleType("requests"))
sys.modules.setdefault("runpod", types.ModuleType("runpod"))
handler = importlib.import_module("handler")


class ScopedGpuHeadersTests(unittest.TestCase):
    def test_legacy_callback_still_uses_legacy_token_only(self):
        self.assertEqual(
            handler.worker_headers("legacy"),
            {"X-Media-OS-GPU-Token": "legacy"},
        )

    def test_render_scoped_headers_require_both_parts(self):
        expected = handler.worker_headers("legacy", "scoped-token", "runpod-gpu:abc")
        self.assertEqual(expected["X-Media-OS-GPU-Token"], "legacy")
        self.assertEqual(expected["X-MediaOS-Workload-Token"], "scoped-token")
        self.assertEqual(expected["X-Worker-Id"], "runpod-gpu:abc")
        with self.assertRaises(ValueError):
            handler.worker_headers("legacy", "scoped-token", "")
        with self.assertRaises(ValueError):
            handler.worker_headers("legacy", "", "runpod-gpu:abc")

    def test_scoped_headers_follow_every_callback_without_network(self):
        render_id = "11111111-aaaa-4bbb-8ccc-111111111111"
        secret = "abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_W"
        worker_id = f"runpod-gpu:{render_id}"
        job = {"input": {
            "mode": "remotion", "renderId": render_id,
            "callbackToken": "legacy-only-for-test",
            "backendUrl": "https://temporary-qa.invalid",
            "workloadToken": secret, "workloadWorkerId": worker_id,
        }}
        with patch.object(handler, "ensure_gpu_available", return_value="test-gpu"), \
             patch.object(handler, "get_work", return_value={}) as get_work, \
             patch.object(handler, "mark_started") as mark_started, \
             patch.object(handler, "render_remotion_video", side_effect=lambda work, target: Path(target).write_bytes(b"0"*51000)), \
             patch.object(handler, "upload_video", return_value={"ok": True}) as upload:
            response = handler.handler(job)
        self.assertEqual(response["status"], "READY")
        self.assertEqual(get_work.call_args.args[-2:], (secret, worker_id))
        self.assertEqual(mark_started.call_args.args[-2:], (secret, worker_id))
        self.assertEqual(upload.call_args.args[-2:], (secret, worker_id))

    def test_rejects_worker_binding_to_other_render(self):
        render_id = "11111111-aaaa-4bbb-8ccc-111111111111"
        secret = "abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_W"
        job = {"input": {
            "mode": "remotion", "renderId": render_id,
            "callbackToken": "legacy", "backendUrl": "https://qa.invalid",
            "workloadToken": secret, "workloadWorkerId": "runpod-gpu:other-id",
        }}
        with self.assertRaisesRegex(ValueError, "render-scoped"):
            handler.handler(job)


if __name__ == "__main__":
    unittest.main()
