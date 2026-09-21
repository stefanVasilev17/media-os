param(
  [int]$PollSeconds = 5,
  [int]$ReleaseSyncSeconds = 30,
  [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
$runnerVersion = "2.0.0"
$workerVersion = "dynamic"

$installRoot = Join-Path $env:LOCALAPPDATA "MediaOS"
$workerDir = Join-Path $installRoot "worker"
$logDir = Join-Path $installRoot "logs"
$runnerPath = Join-Path $workerDir "media-os-local-runner.ps1"
$runnerTempPath = Join-Path $workerDir "media-os-local-runner.ps1.download"
$workerPath = Join-Path $workerDir "spline-worker.ps1"
$workerTempPath = Join-Path $workerDir "spline-worker.ps1.download"
$logPath = Join-Path $logDir "spline-worker.log"

New-Item -ItemType Directory -Path $workerDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-RunnerLog {
  param([string]$Message)
  $line = "{0} [LocalRunner] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line -Encoding UTF8
}

function Rotate-RunnerLog {
  if (-not (Test-Path $logPath)) { return }
  $file = Get-Item $logPath
  if ($file.Length -lt 10MB) { return }
  $archivePath = "$logPath.1"
  Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
  Move-Item $logPath $archivePath -Force
}

function Get-FileHashValue {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $null }
  return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash
}

function Download-Atomic {
  param([string]$Uri, [string]$TargetPath, [string]$TempPath)
  Invoke-WebRequest -Uri $Uri -OutFile $TempPath -UseBasicParsing
  $currentHash = Get-FileHashValue -Path $TargetPath
  $newHash = Get-FileHashValue -Path $TempPath

  if ($currentHash -ne $newHash) {
    Move-Item $TempPath $TargetPath -Force
    return $true
  }

  Remove-Item $TempPath -Force -ErrorAction SilentlyContinue
  return $false
}

$workerKey = [Environment]::GetEnvironmentVariable("MEDIA_OS_WORKER_KEY", "User")
if ([string]::IsNullOrWhiteSpace($workerKey)) { $workerKey = $env:MEDIA_OS_WORKER_KEY }
if ($null -ne $workerKey) { $workerKey = ($workerKey -replace "[\r\n]", "").Trim() }
if ([string]::IsNullOrWhiteSpace($workerKey)) {
  throw "MEDIA_OS_WORKER_KEY is missing from the Windows user environment."
}
$env:MEDIA_OS_WORKER_KEY = $workerKey

$baseUrl = [Environment]::GetEnvironmentVariable("MEDIA_OS_BASE_URL", "User")
if ([string]::IsNullOrWhiteSpace($baseUrl)) { $baseUrl = $env:MEDIA_OS_BASE_URL }
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
  $baseUrl = "https://media-os-backend-production.up.railway.app"
}
$baseUrl = $baseUrl.Trim().TrimEnd("/")
$env:MEDIA_OS_BASE_URL = $baseUrl

$workerId = [Environment]::GetEnvironmentVariable("MEDIA_OS_WORKER_ID", "User")
if ([string]::IsNullOrWhiteSpace($workerId)) { $workerId = "$env:COMPUTERNAME-spline-worker" }
$workerId = ($workerId -replace "[\r\n]", "").Trim()
$env:MEDIA_OS_WORKER_ID = $workerId

$codexCommand = [Environment]::GetEnvironmentVariable("CODEX_COMMAND", "User")
if (-not [string]::IsNullOrWhiteSpace($codexCommand)) {
  $env:CODEX_COMMAND = $codexCommand.Trim()
}

$headers = @{ "X-Worker-Key" = $workerKey }
$currentCommit = "unknown"
$lastReleaseSync = [DateTime]::MinValue
$lastHeartbeat = [DateTime]::MinValue
$lastError = $null

function Send-Heartbeat {
  param([string]$Status)

  if (((Get-Date) - $script:lastHeartbeat).TotalSeconds -lt 12 -and $Status -eq "IDLE") {
    return
  }

  try {
    $body = @{
      workerId = $workerId
      hostname = $env:COMPUTERNAME
      status = $Status
      runnerVersion = $runnerVersion
      workerVersion = $workerVersion
      productionCommit = $script:currentCommit
      lastError = $script:lastError
    } | ConvertTo-Json -Compress

    $utf8 = [System.Text.Encoding]::UTF8.GetBytes($body)
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/worker/runner/heartbeat" -Headers $headers -ContentType "application/json; charset=utf-8" -Body $utf8 | Out-Null
    $script:lastHeartbeat = Get-Date
  } catch {
    Write-RunnerLog "Heartbeat failed: $($_.Exception.Message)"
  }
}

function Sync-ProductionRelease {
  try {
    $release = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/runner/release"
    $commit = [string]$release.commitSha
    if ([string]::IsNullOrWhiteSpace($commit)) { $commit = "main" }
    $script:currentCommit = $commit.Trim()

    $root = "https://raw.githubusercontent.com/stefanVasilev17/media-os/$($script:currentCommit)/worker"
    $workerChanged = Download-Atomic -Uri "$root/spline-worker.ps1" -TargetPath $workerPath -TempPath $workerTempPath

    if ($workerChanged) {
      Write-RunnerLog "Worker updated to production commit $($script:currentCommit)."
    }

    $runnerChanged = Download-Atomic -Uri "$root/media-os-local-runner.ps1" -TargetPath $runnerPath -TempPath $runnerTempPath
    $script:lastReleaseSync = Get-Date

    if ($runnerChanged) {
      Write-RunnerLog "Runner update staged from production commit $($script:currentCommit); restarting through Task Scheduler."
      Send-Heartbeat -Status "UPDATING"
      exit 23
    }
  } catch {
    $script:lastError = "Release sync failed: $($_.Exception.Message)"
    Write-RunnerLog $script:lastError
    if (-not (Test-Path $workerPath)) { throw $script:lastError }
  }
}

if ($SelfTest) {
  Sync-ProductionRelease
  if (-not (Test-Path $workerPath)) {
    throw "Local Runner self-test could not find the worker."
  }
  Write-Host "MEDIA_OS_LOCAL_RUNNER_SELF_TEST: OK"
  Write-Host "Runner version: $runnerVersion"
  Write-Host "Production commit: $currentCommit"
  exit 0
}

$createdNew = $false
$mutex = New-Object System.Threading.Mutex($false, "Local\MediaOSLocalRunner", [ref]$createdNew)
if (-not $createdNew) {
  Write-RunnerLog "Another Local Runner instance is already active."
  exit 0
}

try {
  Write-RunnerLog "Local Runner v$runnerVersion started for $env:COMPUTERNAME."

  while ($true) {
    Rotate-RunnerLog

    if (((Get-Date) - $lastReleaseSync).TotalSeconds -ge $ReleaseSyncSeconds) {
      Sync-ProductionRelease
    }

    Send-Heartbeat -Status "IDLE"

    try {
      & $workerPath -Once *>> $logPath
      $lastError = $null
    } catch {
      $lastError = "Worker cycle failed: $($_.Exception.Message)"
      Write-RunnerLog $lastError
      Send-Heartbeat -Status "DEGRADED"
    }

    Start-Sleep -Seconds $PollSeconds
  }
} finally {
  if ($null -ne $mutex) {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
  }
}
