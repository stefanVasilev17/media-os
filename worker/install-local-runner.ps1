param(
  [switch]$Uninstall,
  [switch]$Status
)

$ErrorActionPreference = "Stop"

$taskName = "Media OS Local Runner"
$installRoot = Join-Path $env:LOCALAPPDATA "MediaOS"
$workerDir = Join-Path $installRoot "worker"
$runnerPath = Join-Path $workerDir "media-os-local-runner.ps1"
$workerPath = Join-Path $workerDir "spline-worker.ps1"
$runnerSource = "https://raw.githubusercontent.com/stefanVasilev17/media-os/main/worker/media-os-local-runner.ps1"
$workerSource = "https://raw.githubusercontent.com/stefanVasilev17/media-os/main/worker/spline-worker.ps1"

if ($Uninstall) {
  $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

  if ($null -ne $existing) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }

  Write-Host "Media OS Local Runner uninstalled. Local logs and cached worker files were kept at $installRoot."
  exit 0
}

if ($Status) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

  if ($null -eq $task) {
    Write-Host "MEDIA_OS_LOCAL_RUNNER: NOT_INSTALLED"
    exit 1
  }

  $info = Get-ScheduledTaskInfo -TaskName $taskName
  Write-Host "MEDIA_OS_LOCAL_RUNNER: $($task.State)"
  Write-Host "Last run: $($info.LastRunTime)"
  Write-Host "Last result: $($info.LastTaskResult)"
  exit 0
}

$workerKey = [Environment]::GetEnvironmentVariable("MEDIA_OS_WORKER_KEY", "User")

if ([string]::IsNullOrWhiteSpace($workerKey)) {
  throw "MEDIA_OS_WORKER_KEY is not stored in the Windows user environment. Configure it before installing the Local Runner."
}

$workerKey = ($workerKey -replace "[\r\n]", "").Trim()
[Environment]::SetEnvironmentVariable("MEDIA_OS_WORKER_KEY", $workerKey, "User")

New-Item -ItemType Directory -Path $workerDir -Force | Out-Null

Invoke-WebRequest -Uri $runnerSource -OutFile $runnerPath -UseBasicParsing
Invoke-WebRequest -Uri $workerSource -OutFile $workerPath -UseBasicParsing

$powershellExe = Join-Path $PSHOME "powershell.exe"
if (-not (Test-Path $powershellExe)) {
  $powershellExe = (Get-Command powershell.exe -ErrorAction Stop).Source
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $runnerPath

$action = New-ScheduledTaskAction -Execute $powershellExe -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Always-on Media OS worker bridge for approved Spline production jobs." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 2

$task = Get-ScheduledTask -TaskName $taskName
$info = Get-ScheduledTaskInfo -TaskName $taskName

Write-Host "MEDIA_OS_LOCAL_RUNNER: INSTALLED"
Write-Host "Task state: $($task.State)"
Write-Host "Last result: $($info.LastTaskResult)"
Write-Host "Worker directory: $workerDir"
Write-Host "Logs: $(Join-Path $installRoot 'logs\spline-worker.log')"
