import json
import os
import subprocess
import tempfile
from pathlib import Path

import requests
import runpod

REQUEST_TIMEOUT = int(os.environ.get("MEDIA_OS_GPU_HTTP_TIMEOUT_SECONDS", "60"))


def worker_headers(callback_token: str):
    return {
        "X-Media-OS-GPU-Token": callback_token,
    }


def ensure_gpu_available():
    result = subprocess.run(
        [
            "nvidia-smi",
            "--query-gpu=name,memory.total,driver_version,uuid",
            "--format=csv,noheader",
        ],
        capture_output=True,
        text=True,
        timeout=20,
    )
    if result.returncode != 0:
        raise RuntimeError(f"NVIDIA GPU is unavailable: {result.stderr.strip()}")
    value = result.stdout.strip()
    if not value:
        raise RuntimeError("NVIDIA GPU is unavailable: nvidia-smi returned no GPU.")

    topology = subprocess.run(
        ["nvidia-smi", "-L"],
        capture_output=True,
        text=True,
        timeout=20,
    )
    topology_value = topology.stdout.strip() if topology.returncode == 0 else topology.stderr.strip()
    if topology_value:
        return f"{value} | nvidia-smi -L: {topology_value}"
    return value


def get_work(backend_url: str, render_id: str, callback_token: str):
    response = requests.get(
        f"{backend_url}/api/v1/spline/gpu-renders/{render_id}/work",
        headers=worker_headers(callback_token),
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def mark_started(backend_url: str, render_id: str, callback_token: str):
    response = requests.post(
        f"{backend_url}/api/v1/spline/gpu-renders/{render_id}/start",
        headers=worker_headers(callback_token),
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()


def mark_failed(backend_url: str, render_id: str, callback_token: str, message: str):
    try:
        response = requests.post(
            f"{backend_url}/api/v1/spline/gpu-renders/{render_id}/fail",
            headers={**worker_headers(callback_token), "Content-Type": "application/json"},
            data=json.dumps({"error": message[:1800]}),
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except Exception as callback_error:
        print(f"Could not report GPU render failure: {callback_error}", flush=True)


def upload_video(backend_url: str, render_id: str, callback_token: str, video_path: Path):
    with video_path.open("rb") as video:
        response = requests.put(
            f"{backend_url}/api/v1/spline/gpu-renders/{render_id}/complete",
            headers={**worker_headers(callback_token), "Content-Type": "video/mp4"},
            data=video,
            timeout=max(REQUEST_TIMEOUT, 180),
        )
    response.raise_for_status()
    return response.json()


def compact_process_error(process: subprocess.CompletedProcess) -> str:
    stderr = (process.stderr or "").strip()
    stdout = (process.stdout or "").strip()
    details = []
    if stderr:
        details.append(f"stderr: {stderr[-1450:]}")
    if stdout:
        details.append(f"stdout: {stdout[-250:]}")
    suffix = " | ".join(details)
    if suffix:
        return f"GPU browser render failed with exit code {process.returncode}. {suffix}"
    return f"GPU browser render failed with exit code {process.returncode}. No renderer output was captured."


def run_gpu_preflight():
    process = subprocess.run(
        ["node", "/app/gpu-preflight.mjs"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if process.stdout:
        print(process.stdout, flush=True)
    if process.stderr:
        print(process.stderr, flush=True)
    if process.returncode != 0:
        stderr = (process.stderr or "").strip()
        stdout = (process.stdout or "").strip()
        details = []
        if stderr:
            details.append(f"stderr: {stderr[-1200:]}")
        if stdout:
            details.append(f"stdout: {stdout[-500:]}")
        suffix = " | ".join(details) or "No GPU preflight output was captured."
        raise RuntimeError(f"GPU preflight failed with exit code {process.returncode}. {suffix}")

    marker = "MEDIA_OS_GPU_PREFLIGHT="
    for line in reversed((process.stdout or "").splitlines()):
        if line.startswith(marker):
            return json.loads(line[len(marker):])
    raise RuntimeError("GPU preflight completed without a result marker.")


def render_video(backend_url: str, work: dict, output_path: Path):
    payload = dict(work)
    payload["backendUrl"] = backend_url
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
        raise RuntimeError(compact_process_error(process))
    if not output_path.exists() or output_path.stat().st_size < 50_000:
        raise RuntimeError("GPU renderer did not produce a valid MP4 file.")


def handler(job):
    input_data = job.get("input") or {}
    mode = str(input_data.get("mode") or "render").strip().lower()

    if mode == "preflight":
        gpu = ensure_gpu_available()
        print(f"GPU preflight target: {gpu}", flush=True)
        try:
            result = run_gpu_preflight()
        except Exception as error:
            raise RuntimeError(f"{error} | GPU target: {gpu}") from error
        return {**result, "gpu": gpu}

    render_id = str(input_data.get("renderId") or "").strip()
    callback_token = str(input_data.get("callbackToken") or "").strip()
    backend_url = str(input_data.get("backendUrl") or "").strip().rstrip("/")

    if not render_id:
        raise ValueError("input.renderId is required.")
    if not callback_token:
        raise ValueError("input.callbackToken is required.")
    if not backend_url.startswith("https://"):
        raise ValueError("input.backendUrl must be an HTTPS URL.")

    try:
        gpu = ensure_gpu_available()
        print(f"GPU ready: {gpu}", flush=True)
        work = get_work(backend_url, render_id, callback_token)
        mark_started(backend_url, render_id, callback_token)

        with tempfile.TemporaryDirectory(prefix=f"media-os-{render_id}-") as directory:
            output_path = Path(directory) / "shot.mp4"
            render_video(backend_url, work, output_path)
            result = upload_video(backend_url, render_id, callback_token, output_path)
            return {
                "renderId": render_id,
                "status": "READY",
                "sizeBytes": output_path.stat().st_size,
                "backend": result,
            }
    except Exception as error:
        message = str(error) or error.__class__.__name__
        print(f"GPU render failed: {message}", flush=True)
        mark_failed(backend_url, render_id, callback_token, message)
        raise


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
