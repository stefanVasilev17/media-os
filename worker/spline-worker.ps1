param(
  [switch]$Once,
  [int]$PollSeconds = 5,
  [switch]$LauncherSelfTest
)

$ErrorActionPreference = "Stop"

function Resolve-CodexStartInfo {
  param(
    [string]$Command
  )

  $resolved = Get-Command $Command -ErrorAction Stop
  $codexPath = $resolved.Source

  if ([string]::IsNullOrWhiteSpace($codexPath)) {
    $codexPath = $resolved.Path
  }
  if ([string]::IsNullOrWhiteSpace($codexPath)) {
    $codexPath = $Command
  }

  if ($codexPath -match '\.ps1  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true

  if ($codexPath -match '\.ps1$') {
    $powershellExe = Join-Path $PSHOME "powershell.exe"
    if (-not (Test-Path $powershellExe)) {
      $powershellExe = (Get-Command powershell.exe -ErrorAction Stop).Source
    }

    $startInfo.FileName = $powershellExe
    $startInfo.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" exec --skip-git-repo-check --ephemeral --sandbox workspace-write -' -f $codexPath
  } elseif ($codexPath -match '\.(cmd|bat)$') {
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""{0}" exec --skip-git-repo-check --ephemeral --sandbox workspace-write -"' -f $codexPath
  } else {
    $startInfo.FileName = $codexPath
    $startInfo.Arguments = 'exec --skip-git-repo-check --ephemeral --sandbox workspace-write -'
  }

  return $startInfo
}

function Invoke-CodexSplineJob {
  param(
    [string]$Prompt,
    [string]$Command
  )

  $startInfo = Resolve-CodexStartInfo -Command $Command
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo

  if (-not $process.Start()) {
    throw "Could not start Codex process."
  }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()

  $process.StandardInput.Write($Prompt)
  $process.StandardInput.Close()

  $process.WaitForExit()

  $stdout = $stdoutTask.Result
  $stderr = $stderrTask.Result
  $outputParts = @()

  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    $outputParts += $stdout.TrimEnd()
  }
  if (-not [string]::IsNullOrWhiteSpace($stderr)) {
    $outputParts += $stderr.TrimEnd()
  }

  return @{
    ExitCode = $process.ExitCode
    Output = ($outputParts -join [Environment]::NewLine)
  }
}

if ($LauncherSelfTest) {
  $fakeDir = Join-Path $env:TEMP ("media-os-codex-selftest-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $fakeDir -Force | Out-Null

  $fakeCodexPs1 = Join-Path $fakeDir "codex.ps1"
  $fakeCodexCmd = Join-Path $fakeDir "codex.cmd"

  @'
throw "The PowerShell shim should not run when a sibling native Windows shim exists."
'@ | Set-Content -Path $fakeCodexPs1 -Encoding UTF8

  @'
@echo off
echo FAKE_CODEX_CMD_OK
more
exit /b 0
'@ | Set-Content -Path $fakeCodexCmd -Encoding ASCII

  try {
    $result = Invoke-CodexSplineJob -Prompt "PING" -Command $fakeCodexPs1

    if ([int]$result.ExitCode -ne 0) {
      throw "Launcher self-test returned exit code $($result.ExitCode). Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch 'FAKE_CODEX_CMD_OK') {
      throw "Launcher self-test did not prefer the sibling native Windows shim. Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch 'PING') {
      throw "Launcher self-test did not preserve redirected stdin. Output: $($result.Output)"
    }

    Write-Host "Codex launcher self-test OK"
    exit 0
  } finally {
    Remove-Item $fakeDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

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
  param(
    [string]$Path,
    [object]$Body
  )

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
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($statusCode -ne 204) {
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

    $codexResult = Invoke-CodexSplineJob -Prompt $prompt -Command $codexCommand
    $output = [string]$codexResult.Output

    if ([int]$codexResult.ExitCode -ne 0) {
      throw "Codex exited with code $($codexResult.ExitCode). $output"
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
) {
    $nativeExe = [System.IO.Path]::ChangeExtension($codexPath, ".exe")
    $nativeCmd = [System.IO.Path]::ChangeExtension($codexPath, ".cmd")
    $nativeBat = [System.IO.Path]::ChangeExtension($codexPath, ".bat")

    if (Test-Path $nativeExe) {
      $codexPath = $nativeExe
    } elseif (Test-Path $nativeCmd) {
      $codexPath = $nativeCmd
    } elseif (Test-Path $nativeBat) {
      $codexPath = $nativeBat
    }
  }

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true

  if ($codexPath -match '\.ps1$') {
    $powershellExe = Join-Path $PSHOME "powershell.exe"
    if (-not (Test-Path $powershellExe)) {
      $powershellExe = (Get-Command powershell.exe -ErrorAction Stop).Source
    }

    $startInfo.FileName = $powershellExe
    $startInfo.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" exec --skip-git-repo-check --ephemeral --sandbox workspace-write -' -f $codexPath
  } elseif ($codexPath -match '\.(cmd|bat)$') {
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""{0}" exec --skip-git-repo-check --ephemeral --sandbox workspace-write -"' -f $codexPath
  } else {
    $startInfo.FileName = $codexPath
    $startInfo.Arguments = 'exec --skip-git-repo-check --ephemeral --sandbox workspace-write -'
  }

  return $startInfo
}

function Invoke-CodexSplineJob {
  param(
    [string]$Prompt,
    [string]$Command
  )

  $startInfo = Resolve-CodexStartInfo -Command $Command
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo

  if (-not $process.Start()) {
    throw "Could not start Codex process."
  }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()

  $process.StandardInput.Write($Prompt)
  $process.StandardInput.Close()

  $process.WaitForExit()

  $stdout = $stdoutTask.Result
  $stderr = $stderrTask.Result
  $outputParts = @()

  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    $outputParts += $stdout.TrimEnd()
  }
  if (-not [string]::IsNullOrWhiteSpace($stderr)) {
    $outputParts += $stderr.TrimEnd()
  }

  return @{
    ExitCode = $process.ExitCode
    Output = ($outputParts -join [Environment]::NewLine)
  }
}

if ($LauncherSelfTest) {
  $fakeCodex = Join-Path $env:TEMP "media-os-fake-codex.ps1"
  @'
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$stdin = [Console]::In.ReadToEnd()
Write-Output "FAKE_CODEX_OK:$stdin"
exit 0
'@ | Set-Content -Path $fakeCodex -Encoding UTF8

  try {
    $result = Invoke-CodexSplineJob -Prompt "PING" -Command $fakeCodex

    if ([int]$result.ExitCode -ne 0) {
      throw "Launcher self-test returned exit code $($result.ExitCode)."
    }

    if ([string]$result.Output -notmatch 'FAKE_CODEX_OK:PING') {
      throw "Launcher self-test did not receive redirected stdin/stdout correctly. Output: $($result.Output)"
    }

    Write-Host "Codex launcher self-test OK"
    exit 0
  } finally {
    Remove-Item $fakeCodex -Force -ErrorAction SilentlyContinue
  }
}

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
  param(
    [string]$Path,
    [object]$Body
  )

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
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($statusCode -ne 204) {
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

    $codexResult = Invoke-CodexSplineJob -Prompt $prompt -Command $codexCommand
    $output = [string]$codexResult.Output

    if ([int]$codexResult.ExitCode -ne 0) {
      throw "Codex exited with code $($codexResult.ExitCode). $output"
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
