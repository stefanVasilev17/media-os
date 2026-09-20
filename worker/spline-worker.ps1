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

    $runId = [Guid]::NewGuid().ToString("N")
    $promptFile = Join-Path $env:TEMP "media-os-codex-$runId.prompt.txt"
    $stdoutFile = Join-Path $env:TEMP "media-os-codex-$runId.stdout.txt"
    $stderrFile = Join-Path $env:TEMP "media-os-codex-$runId.stderr.txt"

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($promptFile, $prompt, $utf8NoBom)

    $resolved = Get-Command $codexCommand -ErrorAction Stop
    $codexPath = $resolved.Source
    if ([string]::IsNullOrWhiteSpace($codexPath)) {
      $codexPath = $resolved.Path
    }
    if ([string]::IsNullOrWhiteSpace($codexPath)) {
      $codexPath = $codexCommand
    }

    if ($codexPath -match '\.(cmd|bat)    Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/complete" -Body @{ output = $output; error = $null }
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
) {
      $cmdLine = '"' + $codexPath + '" exec --skip-git-repo-check --ephemeral --sandbox workspace-write -'
      $process = Start-Process -FilePath $env:ComSpec -ArgumentList @("/d", "/s", "/c", $cmdLine) -RedirectStandardInput $promptFile -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile -NoNewWindow -Wait -PassThru
    } else {
      $process = Start-Process -FilePath $codexPath -ArgumentList @("exec", "--skip-git-repo-check", "--ephemeral", "--sandbox", "workspace-write", "-") -RedirectStandardInput $promptFile -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile -NoNewWindow -Wait -PassThru
    }

    $stdout = if (Test-Path $stdoutFile) { Get-Content -Raw $stdoutFile } else { "" }
    $stderr = if (Test-Path $stderrFile) { Get-Content -Raw $stderrFile } else { "" }
    $output = @($stdout, $stderr) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.TrimEnd() }
    $output = $output -join [Environment]::NewLine

    Remove-Item $promptFile, $stdoutFile, $stderrFile -Force -ErrorAction SilentlyContinue

    if ($process.ExitCode -ne 0) {
      throw "Codex exited with code $($process.ExitCode). $output"
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
