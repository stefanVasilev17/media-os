import json
import os
import subprocess
import tempfile
from pathlib import Path

import requests
import runpod

BACKEND_URL = os.environ.get("MEDIA_OS_BACKEND_URL", "").rstrip("/")
WORKER_TOKEN = os.environ.get("MEDIA_OS_GPU_WORKER_TOKEN", "").strip()
REQUEST_TIMEOUT = int(os.environ.get("MEDIA_OS_GPU_HTTP_TIMEOUT_SECONDS", "60"))


def require_config():
    if not BACKEND_URL:
        raise RuntimeError("MEDIA_OS_BACKEND_URL is not configured.")
    if not WORKER_TOKEN:
        raise RuntimeError("MEDIA_OS_GPU_WORKER_TOKEN is not configured.")


def worker_headers(worker_id: str):
    return {
        "X-Media-OS-GPU-Token": WORKER_TOKEN,
        "X-Media-OS-GPU-Worker": worker_id,
    }


def ensure_gpu_available():
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader"],
        capture_output=True,
        text=True,
        timeout=20,
    )
    if result.returncode != 0:
        raise RuntimeError(f"NVIDIA GPU is unavailable: {result.stderr.strip()}")
    value = result.stdout.strip()
    if not value:
        raise RuntimeError("NVIDIA GPU is unavailable: nvidia-smi returned no GPU.")
    return value


def get_work(render_id: str, worker_id: str):
    response = requests.get(
        f"{BACKEND_URL}/api/v1/spline/gpu-renders/{render_id}/work",
        headers=worker_headers(worker_id),
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def mark_started(render_id: str, worker_id: str):
    response = requests.post(
        f"{BACKEND_URL}/api/v1/spline/gpu-renders/{render_id}/start",
        headers=worker_headers(worker_id),
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()


def mark_failed(render_id: str, worker_id: str, message: str):
    try:
        requests.post(
            f"{BACKEND_URL}/api/v1/spline/gpu-renders/{render_id}/fail",
            headers={**worker_headers(worker_id), "Content-Type": "application/json"},
            data=json.dumps({"error": message[:1800]}),
            timeout=REQUEST_TIMEOUT,
        )
    except Exception as callback_error:
        print(f"Could not report GPU render failure: {callback_error}", flush=True)


def upload_video(render_id: str, worker_id: str, video_path: Path):
    with video_path.open("rb") as video:
        response = requests.put(
            f"{BACKEND_URL}/api/v1/spline/gpu-renders/{render_id}/complete",
            headers={**worker_headers(worker_id), "Content-Type": "video/mp4"},
            data=video,
            timeout=max(REQUEST_TIMEOUT, 180),
        )
    response.raise_for_status()
    return response.json()


def render_video(work: dict, output_path: Path):
    payload = dict(work)
    payload["backendUrl"] = BACKEND_URL
    payload["outputPath"] = str(output_path)

    process = subprocess.run(
        ["node", "/app/render.mjs", json.dumps(payload, separators=(",", ":"))],
        capture_output=True,
        text=True,
        timeout=max(120, int(work.get("durationMs", 20000) / 1000) + 120),
    )
    if process.stdout:
        print(process.stdout, flush=True)
    if process.stderr:
        print(process.stderr, flush=True)
    if process.returncode != 0:
        raise RuntimeError(f"GPU browser render failed with exit code {process.returncode}.")
    if not output_path.exists() or output_path.stat().st_size < 50_000:
        raise RuntimeError("GPU renderer did not produce a valid MP4 file.")


def handler(job):
    require_config()
    input_data = job.get("input") or {}
    render_id = str(input_data.get("renderId") or "").strip()
    if not render_id:
        raise ValueError("input.renderId is required.")

    runpod_job_id = str(job.get("id") or "unknown")
    worker_id = f"RUNPOD_GPU:{runpod_job_id}"

    try:
        gpu = ensure_gpu_available()
        print(f"GPU ready: {gpu}", flush=True)
        work = get_work(render_id, worker_id)
        mark_started(render_id, worker_id)

        with tempfile.TemporaryDirectory(prefix=f"media-os-{render_id}-") as directory:
            output_path = Path(directory) / "shot.mp4"
            render_video(work, output_path)
            result = upload_video(render_id, worker_id, output_path)
            return {
                "renderId": render_id,
                "status": "READY",
                "sizeBytes": output_path.stat().st_size,
                "backend": result,
            }
    except Exception as error:
        message = str(error) or error.__class__.__name__
        print(f"GPU render failed: {message}", flush=True)
        mark_failed(render_id, worker_id, message)
        raise


runpod.serverless.start({"handler": handler})
