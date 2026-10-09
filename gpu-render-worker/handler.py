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


def api_prefix(render_mode: str) -> str:
    if render_mode == "remotion":
        return "/api/v1/remotion/gpu-renders"
    return "/api/v1/spline/gpu-renders"


def get_work(backend_url: str, render_id: str, callback_token: str, render_mode: str):
    response = requests.get(
        f"{backend_url}{api_prefix(render_mode)}/{render_id}/work",
        headers=worker_headers(callback_token),
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def mark_started(backend_url: str, render_id: str, callback_token: str, render_mode: str):
    response = requests.post(
        f"{backend_url}{api_prefix(render_mode)}/{render_id}/start",
        headers=worker_headers(callback_token),
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()


def mark_failed(
    backend_url: str,
    render_id: str,
    callback_token: str,
    message: str,
    render_mode: str,
):
    try:
        response = requests.post(
            f"{backend_url}{api_prefix(render_mode)}/{render_id}/fail",
            headers={**worker_headers(callback_token), "Content-Type": "application/json"},
            data=json.dumps({"error": message[:1800]}),
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except Exception as callback_error:
        print(f"Could not report {render_mode} render failure: {callback_error}", flush=True)


def upload_video(
    backend_url: str,
    render_id: str,
    callback_token: str,
    video_path: Path,
    render_mode: str,
):
    with video_path.open("rb") as video:
        response = requests.put(
            f"{backend_url}{api_prefix(render_mode)}/{render_id}/complete",
            headers={**worker_headers(callback_token), "Content-Type": "video/mp4"},
            data=video,
            timeout=max(REQUEST_TIMEOUT, 180),
        )
    response.raise_for_status()
    return response.json()


def compact_process_error(process: subprocess.CompletedProcess, label: str) -> str:
    stderr = (process.stderr or "").strip()
    stdout = (process.stdout or "").strip()
    details = []
    if stderr:
        details.append(f"stderr: {stderr[-1450:]}")
    if stdout:
        details.append(f"stdout: {stdout[-500:]}")
    suffix = " | ".join(details)
    if suffix:
        return f"{label} failed with exit code {process.returncode}. {suffix}"
    return f"{label} failed with exit code {process.returncode}. No renderer output was captured."


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


def render_spline_video(backend_url: str, work: dict, output_path: Path):
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
        raise RuntimeError(compact_process_error(process, "GPU browser render"))
    if not output_path.exists() or output_path.stat().st_size < 50_000:
        raise RuntimeError("GPU browser renderer did not produce a valid MP4 file.")


def render_remotion_video(work: dict, output_path: Path):
    payload = dict(work)
    payload["outputPath"] = str(output_path)
    duration_seconds = max(
        1,
        int(work.get("durationInFrames", 1)) / max(1, int(work.get("fps", 30))),
    )
    timeout_seconds = max(300, min(840, int(duration_seconds * 8 + 180)))

    process = subprocess.run(
        ["node", "/app/render-remotion.mjs", json.dumps(payload, separators=(",", ":"))],
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
    )
    if process.stdout:
        print(process.stdout, flush=True)
    if process.stderr:
        print(process.stderr, flush=True)
    if process.returncode != 0:
        raise RuntimeError(compact_process_error(process, "Remotion render"))
    if not output_path.exists() or output_path.stat().st_size < 50_000:
        raise RuntimeError("Remotion renderer did not produce a valid MP4 file.")


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

    render_mode = "remotion" if mode == "remotion" else "spline"
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
        print(f"GPU ready renderMode={render_mode}: {gpu}", flush=True)
        work = get_work(backend_url, render_id, callback_token, render_mode)
        mark_started(backend_url, render_id, callback_token, render_mode)

        with tempfile.TemporaryDirectory(prefix=f"media-os-{render_mode}-{render_id}-") as directory:
            output_path = Path(directory) / ("preview.mp4" if render_mode == "remotion" else "shot.mp4")
            if render_mode == "remotion":
                render_remotion_video(work, output_path)
            else:
                render_spline_video(backend_url, work, output_path)

            result = upload_video(
                backend_url,
                render_id,
                callback_token,
                output_path,
                render_mode,
            )
            return {
                "renderId": render_id,
                "renderMode": render_mode,
                "status": "READY",
                "sizeBytes": output_path.stat().st_size,
                "backend": result,
            }
    except Exception as error:
        message = str(error) or error.__class__.__name__
        print(f"{render_mode} render failed: {message}", flush=True)
        mark_failed(backend_url, render_id, callback_token, message, render_mode)
        raise


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
