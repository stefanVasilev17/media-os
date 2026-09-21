param(
  [int]$PollSeconds = 5,
  [int]$RestartDelaySeconds = 5,
  [switch]$SelfTest
)

$ErrorActionPreference = "Stop"

$installRoot = Join-Path $env:LOCALAPPDATA "MediaOS"
$workerDir = Join-Path $installRoot "worker"
$logDir = Join-Path $installRoot "logs"
$workerPath = Join-Path $workerDir "spline-worker.ps1"
$workerTempPath = Join-Path $workerDir "spline-worker.ps1.download"
$logPath = Join-Path $logDir "spline-worker.log"
$workerSource = "https://raw.githubusercontent.com/stefanVasilev17/media-os/main/worker/spline-worker.ps1"

New-Item -ItemType Directory -Path $workerDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-RunnerLog {
  param([string]$Message)

  $line = "{0} [LocalRunner] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line -Encoding UTF8
}

function Rotate-RunnerLog {
  if (-not (Test-Path $logPath)) {
    return
  }

  $file = Get-Item $logPath

  if ($file.Length -lt 10MB) {
    return
  }

  $archivePath = "$logPath.1"
  Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
  Move-Item $logPath $archivePath -Force
}

function Sync-Worker {
  try {
    Invoke-WebRequest -Uri $workerSource -OutFile $workerTempPath -UseBasicParsing
    Move-Item $workerTempPath $workerPath -Force
    Write-RunnerLog "Worker synced from GitHub main."
  } catch {
    Remove-Item $workerTempPath -Force -ErrorAction SilentlyContinue

    if (-not (Test-Path $workerPath)) {
      throw "Could not download spline-worker.ps1 and no cached worker exists. $($_.Exception.Message)"
    }

    Write-RunnerLog "Worker update failed; using cached copy. $($_.Exception.Message)"
  }
}

$workerKey = [Environment]::GetEnvironmentVariable("MEDIA_OS_WORKER_KEY", "User")

if ([string]::IsNullOrWhiteSpace($workerKey)) {
  $workerKey = $env:MEDIA_OS_WORKER_KEY
}

if ($null -ne $workerKey) {
  $workerKey = ($workerKey -replace "[\r\n]", "").Trim()
}

if ([string]::IsNullOrWhiteSpace($workerKey)) {
  throw "MEDIA_OS_WORKER_KEY is missing from the Windows user environment."
}

$env:MEDIA_OS_WORKER_KEY = $workerKey

$userBaseUrl = [Environment]::GetEnvironmentVariable("MEDIA_OS_BASE_URL", "User")
if (-not [string]::IsNullOrWhiteSpace($userBaseUrl)) {
  $env:MEDIA_OS_BASE_URL = $userBaseUrl.Trim()
}

$userWorkerId = [Environment]::GetEnvironmentVariable("MEDIA_OS_WORKER_ID", "User")
if (-not [string]::IsNullOrWhiteSpace($userWorkerId)) {
  $env:MEDIA_OS_WORKER_ID = ($userWorkerId -replace "[\r\n]", "").Trim()
}

$userCodexCommand = [Environment]::GetEnvironmentVariable("CODEX_COMMAND", "User")
if (-not [string]::IsNullOrWhiteSpace($userCodexCommand)) {
  $env:CODEX_COMMAND = $userCodexCommand.Trim()
}

if ($SelfTest) {
  Sync-Worker

  if (-not (Test-Path $workerPath)) {
    throw "Local Runner self-test could not find the worker."
  }

  Write-Host "MEDIA_OS_LOCAL_RUNNER_SELF_TEST: OK"
  exit 0
}

$createdNew = $false
$mutex = New-Object System.Threading.Mutex($false, "Local\MediaOSLocalRunner", [ref]$createdNew)

if (-not $createdNew) {
  Write-RunnerLog "Another Local Runner instance is already active."
  exit 0
}

try {
  Write-RunnerLog "Local Runner started for $env:COMPUTERNAME."

  while ($true) {
    Rotate-RunnerLog
    Sync-Worker

    Write-RunnerLog "Starting continuous Spline worker."

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $workerPath -PollSeconds $PollSeconds *>> $logPath
    $exitCode = $LASTEXITCODE

    Write-RunnerLog "Spline worker exited with code $exitCode. Restarting in $RestartDelaySeconds seconds."
    Start-Sleep -Seconds $RestartDelaySeconds
  }
} finally {
  if ($null -ne $mutex) {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
  }
}
