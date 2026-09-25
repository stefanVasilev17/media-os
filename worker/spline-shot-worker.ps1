param(
  [switch]$Once,
  [int]$PollSeconds = 5,
  [switch]$LauncherSelfTest
)

$ErrorActionPreference = "Stop"

function Get-CodexArguments {
  $configs = @(
    "web_search=disabled",
    "agents.enabled=false",
    "model_reasoning_effort=medium",
    "model_reasoning_summary=none",
    "model_verbosity=low",
    "features.shell_tool=false",
    "features.skill_mcp_dependency_install=false",
    "mcp_servers.spline.enabled_tools=['3d_load_skill','3d_get_scene_mcp','3d_get_objects']",
    "mcp_servers.spline.tools.3d_get_scene_mcp.output_token_limit=6000",
    "mcp_servers.spline.tools.3d_get_objects.output_token_limit=6000"
  )
  $configArgs = ($configs | ForEach-Object { "--config $_" }) -join " "
  return "$configArgs --approve-for-me exec --skip-git-repo-check --ephemeral -"
}

function Resolve-CodexStartInfo {
  param([string]$Command)

  $resolved = Get-Command $Command -ErrorAction Stop
  $codexPath = $resolved.Source
  if ([string]::IsNullOrWhiteSpace($codexPath)) { $codexPath = $resolved.Path }
  if ([string]::IsNullOrWhiteSpace($codexPath)) { $codexPath = $Command }

  if ($codexPath.EndsWith(".ps1", [System.StringComparison]::OrdinalIgnoreCase)) {
    $nativeExe = [System.IO.Path]::ChangeExtension($codexPath, ".exe")
    $nativeCmd = [System.IO.Path]::ChangeExtension($codexPath, ".cmd")
    $nativeBat = [System.IO.Path]::ChangeExtension($codexPath, ".bat")
    if (Test-Path $nativeExe) { $codexPath = $nativeExe }
    elseif (Test-Path $nativeCmd) { $codexPath = $nativeCmd }
    elseif (Test-Path $nativeBat) { $codexPath = $nativeBat }
  }

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true
  $arguments = Get-CodexArguments

  if ($codexPath.EndsWith(".ps1", [System.StringComparison]::OrdinalIgnoreCase)) {
    $powershellExe = Join-Path $PSHOME "powershell.exe"
    if (-not (Test-Path $powershellExe)) { $powershellExe = (Get-Command powershell.exe -ErrorAction Stop).Source }
    $startInfo.FileName = $powershellExe
    $startInfo.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" {1}' -f $codexPath, $arguments
  } elseif ($codexPath.EndsWith(".cmd", [System.StringComparison]::OrdinalIgnoreCase) -or $codexPath.EndsWith(".bat", [System.StringComparison]::OrdinalIgnoreCase)) {
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""{0}" {1}"' -f $codexPath, $arguments
  } else {
    $startInfo.FileName = $codexPath
    $startInfo.Arguments = $arguments
  }

  return $startInfo
}

function Invoke-ShotDirector {
  param([string]$Prompt, [string]$Command)

  $startInfo = Resolve-CodexStartInfo -Command $Command
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  if (-not $process.Start()) { throw "Could not start Codex Shot Director process." }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Prompt)
  $process.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
  $process.StandardInput.BaseStream.Flush()
  $process.StandardInput.Close()
  $process.WaitForExit()

  $parts = @()
  if (-not [string]::IsNullOrWhiteSpace($stdoutTask.Result)) { $parts += $stdoutTask.Result.TrimEnd() }
  if (-not [string]::IsNullOrWhiteSpace($stderrTask.Result)) { $parts += $stderrTask.Result.TrimEnd() }

  return @{
    ExitCode = $process.ExitCode
    Output = ($parts -join [Environment]::NewLine)
  }
}

function Get-ResultLine {
  param([string]$Output)
  if ([string]::IsNullOrWhiteSpace($Output)) { return $null }
  $matches = [regex]::Matches($Output, '(?im)^MEDIA_OS_SPLINE_RESULT:\s*(SUCCEEDED|FAILED)\b[^\r\n]*')
  if ($matches.Count -eq 0) { return $null }
  return $matches[$matches.Count - 1].Value.Trim()
}

function Get-Metrics {
  param([string]$Output, [long]$DurationMs)

  $tokens = $null
  $tokenMatch = [regex]::Match($Output, '(?is)tokens\s+used\s+([\d,]+)')
  if ($tokenMatch.Success) {
    $parsed = 0L
    if ([long]::TryParse(($tokenMatch.Groups[1].Value -replace ',', ''), [ref]$parsed)) { $tokens = $parsed }
  }

  return @{
    tokenCount = $tokens
    splineMcpCalls = [regex]::Matches($Output, '(?im)^mcp:\s+Spline/[^\r\n]+\(completed\)\s*$').Count
    durationMs = $DurationMs
    executionProfile = "SHOT_DIRECTOR_V1"
    readOnly = $true
    executionEngine = "CODEX_SPLINE_READ_ONLY"
  }
}

if ($LauncherSelfTest) {
  $args = Get-CodexArguments
  if ($args -notmatch "features.shell_tool=false") { throw "Shot Director launcher must disable shell execution." }
  if ($args -notmatch "3d_get_objects") { throw "Shot Director launcher is missing read-only Spline tools." }
  if ($args -match "3d_run_code") { throw "Shot Director launcher must not expose Spline mutation tools." }
  Write-Host "MEDIA_OS_SHOT_WORKER_SELF_TEST: OK"
  exit 0
}

$baseUrl = $env:MEDIA_OS_BASE_URL
$workerKey = $env:MEDIA_OS_WORKER_KEY
$workerId = $env:MEDIA_OS_WORKER_ID
$codexCommand = $env:CODEX_COMMAND

if ([string]::IsNullOrWhiteSpace($baseUrl)) { $baseUrl = "https://media-os-backend-production.up.railway.app" }
$baseUrl = $baseUrl.Trim().TrimEnd("/")
if ([string]::IsNullOrWhiteSpace($workerId)) { $workerId = "$env:COMPUTERNAME-spline-worker" }
$workerId = (($workerId -replace "[\r\n]", "").Trim()) + "-shot"
if ([string]::IsNullOrWhiteSpace($codexCommand)) { $codexCommand = "codex" }
if ([string]::IsNullOrWhiteSpace($workerKey)) { throw "MEDIA_OS_WORKER_KEY is required." }
$workerKey = ($workerKey -replace "[\r\n]", "").Trim()

$headers = @{
  "X-Worker-Key" = $workerKey
  "X-Worker-Id" = $workerId
}

function Invoke-WorkerPost {
  param([string]$Path, [object]$Body)
  $json = $Body | ConvertTo-Json -Depth 60 -Compress
  $utf8 = [System.Text.Encoding]::UTF8.GetBytes($json)
  Invoke-RestMethod -Method Post -Uri "$baseUrl$Path" -Headers $headers -ContentType "application/json; charset=utf-8" -Body $utf8
}

while ($true) {
  $job = $null
  try {
    $job = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/worker/spline-shot/jobs/next" -Headers $headers
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $statusCode = [int]$_.Exception.Response.StatusCode }
    if ($statusCode -ne 204) { Write-Warning "Could not poll Shot Director: $($_.Exception.Message)" }
  }

  $jobId = if ($null -ne $job -and $null -ne $job.PSObject.Properties["id"]) { [string]$job.id } else { $null }
  if ([string]::IsNullOrWhiteSpace($jobId)) {
    if ($Once) { exit 0 }
    Start-Sleep -Seconds $PollSeconds
    continue
  }

  Invoke-WorkerPost -Path "/api/v1/worker/spline-shot/jobs/$jobId/started" -Body @{} | Out-Null
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  $output = ""
  $metrics = $null

  try {
    $payload = $job.payload | ConvertTo-Json -Compress -Depth 50
    $prompt = @"
You are the Architectural Thinking Media OS Shot Director execution agent.

ROLE:
Translate the director's natural-language direction into a temporary browser-runtime ShotSpec. You are planning the shot, not editing the master Spline scene.

HARD SAFETY CONTRACT:
- The focused Spline scene is READ-ONLY for this job.
- Use only the exposed read-only Spline MCP tools.
- Never create, mutate, move, rename, recolor, resize, reparent, delete, or otherwise modify any Spline object.
- Never call mutation tools. They are intentionally unavailable.
- Inspect only the scene references needed to resolve the director's request truthfully.
- Use exact existing camera/reference and object names. Never invent names.
- MEDIA_OS_CAMERA is the runtime production camera. ShotSpec CAMERA beats reference authored camera/reference objects; preview execution later copies those poses to MEDIA_OS_CAMERA.
- Prefer semantic references over absolute coordinates.
- A hold is represented by leaving the current camera unchanged until the next CAMERA beat.

DIRECTOR JOB PAYLOAD:
$payload

JOB INSTRUCTIONS:
$($job.instructions)

COLLABORATION:
- previousShotSpec, when present, is the current cut. Apply the director correction to that cut rather than rebuilding unrelated timing.
- directorMemory contains prior director corrections. Use recurring preferences when relevant, but the newest creatorMessage always wins.
- Keep motion functional and restrained. Do not add decorative camera drift unless the director explicitly requests it.

PROCESS:
1. Load the Spline skill once if needed.
2. Read the minimum scene summary/reference data required to verify the requested camera and object names.
3. Build or revise the ShotSpec.
4. Check that all referenced names actually exist in the scene data you read.
5. Output one compact final result line and nothing after it.

SUCCESS FORMAT, exactly one line:
MEDIA_OS_SPLINE_RESULT: SUCCEEDED {"schemaVersion":1,"name":"shot name","durationMs":20000,"beats":[...]}

Allowed beats:
- CAMERA: {"type":"CAMERA","atMs":0,"targetName":"CAM_LOGIN","transitionMs":0,"easing":"smooth","zoom":0.42}
- EVENT: {"type":"EVENT","atMs":2500,"targetName":"exact object name","eventName":"mouseDown"}
- STATE: {"type":"STATE","atMs":4000,"targetName":"exact object name","stateValue":"ACTIVE"}
- VISIBILITY: {"type":"VISIBILITY","atMs":6000,"targetName":"exact object name","visible":true}
- ZOOM: {"type":"ZOOM","atMs":8000,"value":0.35,"transitionMs":1200,"easing":"smooth"}

Rules: durationMs 500..120000, beats sorted by atMs, easing is linear|smooth|easeInOut, omit unused fields. If required references cannot be verified, output one line beginning MEDIA_OS_SPLINE_RESULT: FAILED with the reason.
"@

    $result = Invoke-ShotDirector -Prompt $prompt -Command $codexCommand
    $timer.Stop()
    $output = [string]$result.Output
    $metrics = Get-Metrics -Output $output -DurationMs $timer.ElapsedMilliseconds

    if ([int]$result.ExitCode -ne 0) { throw "Shot Director Codex exited with code $($result.ExitCode)." }
    $resultLine = Get-ResultLine -Output $output
    if ([string]::IsNullOrWhiteSpace($resultLine)) { throw "Shot Director finished without MEDIA_OS_SPLINE_RESULT." }
    if ($resultLine -match '^MEDIA_OS_SPLINE_RESULT: FAILED') { throw $resultLine }
    if ($resultLine -notmatch '^MEDIA_OS_SPLINE_RESULT: SUCCEEDED\s+\{') { throw "Shot Director returned an invalid success payload." }

    Invoke-WorkerPost -Path "/api/v1/worker/spline-shot/jobs/$jobId/complete" -Body @{
      output = $resultLine
      error = $null
      metrics = $metrics
    } | Out-Null
    Write-Host "Runtime shot prepared and reported to Media OS."
  } catch {
    if ($timer.IsRunning) { $timer.Stop() }
    $message = $_.Exception.Message
    Write-Error $message -ErrorAction Continue
    try {
      Invoke-WorkerPost -Path "/api/v1/worker/spline-shot/jobs/$jobId/fail" -Body @{
        output = $output
        error = $message
        metrics = if ($null -eq $metrics) { @{ durationMs = $timer.ElapsedMilliseconds; executionProfile = "SHOT_DIRECTOR_V1"; readOnly = $true } } else { $metrics }
      } | Out-Null
    } catch {
      Write-Warning "Could not report Shot Director failure: $($_.Exception.Message)"
    }
  }

  if ($Once) { exit 0 }
}
