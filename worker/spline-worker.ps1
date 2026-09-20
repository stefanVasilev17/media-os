param(
  [switch]$Once,
  [int]$PollSeconds = 5
)

$ErrorActionPreference = "Stop"

$baseUrl = $env:MEDIA_OS_BASE_URL
$workerKey = $env:MEDIA_OS_WORKER_KEY
$workerId = $env:MEDIA_OS_WORKER_ID
$codexCommand = $env:CODEX_COMMAND

if ([string]::IsNullOrWhiteSpace($baseUrl)) {
  $baseUrl = "https://media-os-backend-production.up.railway.app"
}
if ([string]::IsNullOrWhiteSpace($workerId)) {
  $workerId = "$env:COMPUTERNAME-spline-worker"
}
if ([string]::IsNullOrWhiteSpace($codexCommand)) {
  $codexCommand = "codex"
}
if ([string]::IsNullOrWhiteSpace($workerKey)) {
  throw "MEDIA_OS_WORKER_KEY is required."
}

$headers = @{
  "X-Worker-Key" = $workerKey
  "X-Worker-Id" = $workerId
}

function Invoke-WorkerPost {
  param([string]$Path, [object]$Body)
  Invoke-RestMethod -Method Post -Uri "$baseUrl$Path" -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

Write-Host "Media OS Spline Worker"
Write-Host "Worker: $workerId"
Write-Host "Backend: $baseUrl"
Write-Host "Codex: $codexCommand"
Write-Host ""

while ($true) {
  $job = $null

  try {
    $job = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/worker/spline/jobs/next" -Headers $headers
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 204) {
      Write-Warning "Could not poll Media OS: $($_.Exception.Message)"
    }
  }

  if ($null -eq $job) {
    if ($Once) {
      Write-Host "No queued Spline job."
      exit 0
    }
    Start-Sleep -Seconds $PollSeconds
    continue
  }

  Write-Host "Claimed job $($job.id): $($job.taskType)"
  Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/started" -Body @{}

  $permissions = ($job.permissions | ConvertTo-Json -Compress -Depth 10)
  $protectedObjects = ($job.protectedObjects | ConvertTo-Json -Compress -Depth 10)

  $prompt = @"
You are the Architectural Thinking Media OS Spline Agent.

This is a controlled execution job issued by Media OS.
You MUST use the Spline MCP server and make the requested edit in the currently focused Spline 3D editor tab.
Do not merely explain how to do it.

JOB TYPE:
$($job.taskType)

TARGET:
$($job.target)

INSTRUCTIONS:
$($job.instructions)

ALLOWED PERMISSIONS:
$permissions

PROTECTED OBJECTS:
$protectedObjects

SAFETY:
- Treat every existing object as protected unless the job explicitly permits editing it.
- Do not delete or redesign existing architecture.
- If Spline MCP is unavailable, stop and report that clearly.
- Execute only the requested change.
- End with a concise report beginning with MEDIA_OS_SPLINE_RESULT.
"@

  try {
    Write-Host "Executing through Codex + Spline MCP..."
    $output = & $codexCommand exec --skip-git-repo-check --ephemeral --sandbox workspace-write $prompt 2>&1 | Out-String

    if ($LASTEXITCODE -ne 0) {
      throw "Codex exited with code $LASTEXITCODE. $output"
    }

    Write-Host $output
    Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/complete" -Body @{ output = $output; error = $null }
    Write-Host "Job completed and reported to Media OS."
  } catch {
    $message = $_.Exception.Message
    Write-Error $message -ErrorAction Continue

    try {
      Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/fail" -Body @{ output = $null; error = $message }
    } catch {
      Write-Warning "Could not report failure to Media OS: $($_.Exception.Message)"
    }
  }

  if ($Once) {
    exit 0
  }
}
