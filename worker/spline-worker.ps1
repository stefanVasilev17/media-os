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

  if ($codexPath.EndsWith(".ps1", [System.StringComparison]::OrdinalIgnoreCase)) {
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

  if ($codexPath.EndsWith(".ps1", [System.StringComparison]::OrdinalIgnoreCase)) {
    $powershellExe = Join-Path $PSHOME "powershell.exe"

    if (-not (Test-Path $powershellExe)) {
      $powershellExe = (Get-Command powershell.exe -ErrorAction Stop).Source
    }

    $startInfo.FileName = $powershellExe
    $startInfo.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" --approve-for-me exec --skip-git-repo-check --ephemeral -' -f $codexPath
  } elseif (
    $codexPath.EndsWith(".cmd", [System.StringComparison]::OrdinalIgnoreCase) -or
    $codexPath.EndsWith(".bat", [System.StringComparison]::OrdinalIgnoreCase)
  ) {
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""{0}" --approve-for-me exec --skip-git-repo-check --ephemeral -"' -f $codexPath
  } else {
    $startInfo.FileName = $codexPath
    $startInfo.Arguments = '--approve-for-me exec --skip-git-repo-check --ephemeral -'
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

function Get-CodexExecutionMetrics {
  param(
    [string]$Output,
    [long]$DurationMs,
    [string]$ExecutionProfile
  )

  $tokenCount = $null
  $tokenMatch = [regex]::Match($Output, '(?is)tokens\s+used\s+([\d,]+)')

  if ($tokenMatch.Success) {
    $tokenText = $tokenMatch.Groups[1].Value -replace ',', ''
    $parsedTokens = 0L
    if ([long]::TryParse($tokenText, [ref]$parsedTokens)) {
      $tokenCount = $parsedTokens
    }
  }

  $mcpCalls = [regex]::Matches(
    $Output,
    '(?im)^mcp:\s+Spline/[^\r\n]+\(completed\)\s*$'
  ).Count

  return @{
    tokenCount = $tokenCount
    splineMcpCalls = $mcpCalls
    durationMs = $DurationMs
    executionProfile = $ExecutionProfile
  }
}

function Get-MediaOsSplineResult {
  param(
    [string]$Output
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $null
  }

  $matches = [regex]::Matches(
    $Output,
    '(?im)^MEDIA_OS_SPLINE_RESULT:\s*(SUCCEEDED|FAILED)\b[^\r\n]*'
  )

  if ($matches.Count -eq 0) {
    return $null
  }

  return $matches[$matches.Count - 1].Value.Trim()
}

if ($LauncherSelfTest) {
  $fakeDir = Join-Path $env:TEMP ("media-os-codex-selftest-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $fakeDir -Force | Out-Null

  $fakeCodexPs1 = Join-Path $fakeDir "codex.ps1"
  $fakeCodexCmd = Join-Path $fakeDir "codex.cmd"

  @'
throw "PowerShell shim was selected instead of the sibling native Windows shim."
'@ | Set-Content -Path $fakeCodexPs1 -Encoding UTF8

  @'
@echo off
echo FAKE_CODEX_CMD_OK
echo ARGS:%*
more
exit /b 0
'@ | Set-Content -Path $fakeCodexCmd -Encoding ASCII

  try {
    $result = Invoke-CodexSplineJob -Prompt "PING" -Command $fakeCodexPs1

    if ([int]$result.ExitCode -ne 0) {
      throw "Launcher self-test returned exit code $($result.ExitCode). Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch "FAKE_CODEX_CMD_OK") {
      throw "Launcher self-test did not prefer the sibling native Windows shim. Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch "--approve-for-me exec") {
      throw "Launcher self-test did not enable Codex auto-review. Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch "PING") {
      throw "Launcher self-test did not preserve redirected stdin. Output: $($result.Output)"
    }

    $successSample = "noise" + [Environment]::NewLine + "MEDIA_OS_SPLINE_RESULT: SUCCEEDED - test"
    $failureSample = "noise" + [Environment]::NewLine + "MEDIA_OS_SPLINE_RESULT: FAILED - test"
    $successMarker = Get-MediaOsSplineResult -Output $successSample
    $failureMarker = Get-MediaOsSplineResult -Output $failureSample

    if ($successMarker -notmatch "^MEDIA_OS_SPLINE_RESULT: SUCCEEDED") {
      throw "Semantic success marker self-test failed."
    }

    if ($failureMarker -notmatch "^MEDIA_OS_SPLINE_RESULT: FAILED") {
      throw "Semantic failure marker self-test failed."
    }

    Write-Host "Codex launcher and semantic result self-test OK"
    exit 0
  } finally {
    Remove-Item $fakeDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

$baseUrl = $env:MEDIA_OS_BASE_URL
$workerKey = $env:MEDIA_OS_WORKER_KEY
$workerId = $env:MEDIA_OS_WORKER_ID
$codexCommand = $env:CODEX_COMMAND

if ($null -ne $baseUrl) {
  $baseUrl = $baseUrl.Trim()
}

if ($null -ne $workerKey) {
  $workerKey = ($workerKey -replace "[\r\n]", "").Trim()
}

if ($null -ne $workerId) {
  $workerId = ($workerId -replace "[\r\n]", "").Trim()
}

if ($null -ne $codexCommand) {
  $codexCommand = $codexCommand.Trim()
}

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

  $json = $Body | ConvertTo-Json -Depth 10 -Compress
  $utf8 = [System.Text.Encoding]::UTF8.GetBytes($json)

  Invoke-RestMethod -Method Post -Uri "$baseUrl$Path" -Headers $headers -ContentType "application/json; charset=utf-8" -Body $utf8
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

  $jobId = $null

  if ($null -ne $job -and $null -ne $job.PSObject.Properties["id"]) {
    $jobId = [string]$job.id
  }

  if ([string]::IsNullOrWhiteSpace($jobId)) {
    if ($Once) {
      Write-Host "No queued Spline job."
      exit 0
    }

    Start-Sleep -Seconds $PollSeconds
    continue
  }

  Write-Host "Claimed job ${jobId}: $($job.taskType)"
  Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/started" -Body @{}

  $permissions = ($job.permissions | ConvertTo-Json -Compress -Depth 10)
  $protectedObjects = ($job.protectedObjects | ConvertTo-Json -Compress -Depth 10)
  $payload = ($job.payload | ConvertTo-Json -Compress -Depth 10)
  $executionProfile = "LEGACY"

  if ($null -ne $job.payload -and $null -ne $job.payload.executionProfile) {
    $executionProfile = [string]$job.payload.executionProfile
  }

  $efficiencyContract = ""

  if ($executionProfile -eq "TARGETED_OBJECT_V2") {
    $efficiencyContract = @"
TOKEN EFFICIENCY CONTRACT:
- Keep reasoning and narration minimal.
- Load the Spline 3D skill at most once if it is required.
- Do not enumerate or inspect the full scene when an exact-name object lookup is available.
- Use the objectName from JOB PAYLOAD as the exact target.
- Prefer one targeted object read before the change.
- Perform at most one mutation call for the requested edit.
- Verify with one targeted object readback.
- Do not take a screenshot unless targeted readback cannot verify a requested visual property.
- If the object already matches all requested properties, do not mutate it; verify and report success.
"@
  }

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

JOB PAYLOAD:
$payload

$efficiencyContract

SAFETY:
- Treat every existing object as protected unless the job explicitly permits editing it.
- Do not delete or redesign existing architecture.
- Execute only the requested change.
- If Spline MCP is unavailable or any required tool call is denied, end with exactly one concise line beginning: MEDIA_OS_SPLINE_RESULT: FAILED
- If the requested Spline change is actually completed, end with exactly one concise line beginning: MEDIA_OS_SPLINE_RESULT: SUCCEEDED
- Never report SUCCEEDED unless the scene change was performed through Spline MCP.
"@

  $metrics = $null

  try {
    Write-Host "Executing through Codex + Spline MCP..."

    $executionTimer = [System.Diagnostics.Stopwatch]::StartNew()
    $codexResult = Invoke-CodexSplineJob -Prompt $prompt -Command $codexCommand
    $executionTimer.Stop()
    $output = [string]$codexResult.Output
    $metrics = Get-CodexExecutionMetrics -Output $output -DurationMs $executionTimer.ElapsedMilliseconds -ExecutionProfile $executionProfile

    Write-Host $output

    if ([int]$codexResult.ExitCode -ne 0) {
      throw "Codex exited with code $($codexResult.ExitCode)."
    }

    $resultLine = Get-MediaOsSplineResult -Output $output

    if ([string]::IsNullOrWhiteSpace($resultLine)) {
      throw "Codex finished without a MEDIA_OS_SPLINE_RESULT status line."
    }

    if ($resultLine -match "^MEDIA_OS_SPLINE_RESULT: FAILED") {
      throw $resultLine
    }

    if ($resultLine -notmatch "^MEDIA_OS_SPLINE_RESULT: SUCCEEDED") {
      throw "Codex returned an unrecognized Spline result: $resultLine"
    }

    Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/complete" -Body @{
      output = $resultLine
      error = $null
      metrics = $metrics
    }

    Write-Host "Job completed and reported to Media OS."
  } catch {
    $message = $_.Exception.Message
    Write-Error $message -ErrorAction Continue

    try {
      Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/fail" -Body @{
        output = $null
        error = $message
        metrics = $metrics
      }
    } catch {
      Write-Warning "Could not report failure to Media OS: $($_.Exception.Message)"
    }
  }

  if ($Once) {
    exit 0
  }
}
