import subprocess
import unittest
from unittest.mock import patch

import handler as gpu_handler


class HandlerTests(unittest.TestCase):
    def test_worker_headers(self):
        self.assertEqual(
            gpu_handler.worker_headers("abc"),
            {"X-Media-OS-GPU-Token": "abc"},
        )

    def test_api_prefix_separates_remotion_and_spline(self):
        self.assertEqual(
            gpu_handler.api_prefix("remotion"),
            "/api/v1/remotion/gpu-renders",
        )
        self.assertEqual(
            gpu_handler.api_prefix("spline"),
            "/api/v1/spline/gpu-renders",
        )

    def test_compact_process_error_includes_renderer_output(self):
        process = subprocess.CompletedProcess(
            args=["node", "/app/render-remotion.mjs"],
            returncode=1,
            stdout="renderer stdout",
            stderr="renderer stderr",
        )
        message = gpu_handler.compact_process_error(process, "Remotion render")
        self.assertIn("exit code 1", message)
        self.assertIn("stderr: renderer stderr", message)
        self.assertIn("stdout: renderer stdout", message)
        self.assertIn("Remotion render", message)

    def test_compact_process_error_handles_empty_output(self):
        process = subprocess.CompletedProcess(
            args=["node", "/app/render.mjs"],
            returncode=2,
            stdout="",
            stderr="",
        )
        self.assertIn(
            "No renderer output was captured",
            gpu_handler.compact_process_error(process, "GPU browser render"),
        )

    @patch.object(gpu_handler, "ensure_gpu_available", return_value="NVIDIA Test GPU, 999.0")
    @patch.object(gpu_handler, "run_gpu_preflight", return_value={"status": "GPU_PREFLIGHT_OK", "webgl": {"renderer": "NVIDIA"}})
    def test_preflight_mode_does_not_require_render_callback_fields(self, preflight, ensure_gpu):
        result = gpu_handler.handler({"input": {"mode": "preflight"}})
        self.assertEqual(result["status"], "GPU_PREFLIGHT_OK")
        self.assertEqual(result["gpu"], "NVIDIA Test GPU, 999.0")
        preflight.assert_called_once_with()
        ensure_gpu.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
