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

function Get-MediaOsSplineCatalog {
  param(
    [string]$Output
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $null
  }

  $match = [regex]::Match(
    $Output,
    '(?is)MEDIA_OS_SPLINE_CATALOG_BEGIN\s*(.*?)\s*MEDIA_OS_SPLINE_CATALOG_END'
  )

  if (-not $match.Success) {
    return $null
  }

  try {
    return ($match.Groups[1].Value | ConvertFrom-Json)
  } catch {
    throw "Codex returned invalid Spline catalog JSON."
  }
}

function Get-MediaOsCatalogNodeCount {
  param([object]$Node)

  if ($null -eq $Node) {
    return 0
  }

  $count = 1

  if ($null -ne $Node.PSObject.Properties["children"] -and $null -ne $Node.children) {
    foreach ($child in @($Node.children)) {
      $count += Get-MediaOsCatalogNodeCount -Node $child
    }
  }

  return $count
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
    $catalogSample = "MEDIA_OS_SPLINE_CATALOG_BEGIN" + [Environment]::NewLine + '{"sceneName":"Test","sections":[{"name":"ROOT","type":"Group","path":"ROOT","children":[{"name":"CHILD","type":"Shape","path":"ROOT/CHILD","children":[]}]}]}' + [Environment]::NewLine + "MEDIA_OS_SPLINE_CATALOG_END"
    $catalogMarker = Get-MediaOsSplineCatalog -Output $catalogSample

    if (
      $null -eq $catalogMarker -or
      $catalogMarker.sceneName -ne "Test" -or
      $catalogMarker.sections[0].children[0].name -ne "CHILD"
    ) {
      throw "Spline catalog marker self-test failed."
    }

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

  $json = $Body | ConvertTo-Json -Depth 50 -Compress
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

  if ($executionProfile -eq "SCENE_CATALOG_V1") {
    $prompt = @"
You are the Architectural Thinking Media OS Spline Catalog Reader.

This is a READ-ONLY scene catalog sync job against the currently focused Spline 3D editor tab.

WHY THIS JOB USES PAGED READ CODE:
The ordinary Spline scene readers can report the total object count while folding or omitting hundreds of objects in large scenes. They are useful for inspection, but they are not sufficient for a complete 700+ object catalog. For this catalog job, enumerate the hierarchy in bounded read-only pages.

MANDATORY TOOL ROUTE:
- Use ONLY MCP tools from the Spline server. Tool names must begin with Spline/.
- Do NOT use cua_repl, computer-use, browser automation, UI automation, screenshots, or any fallback interface.
- FIRST call Spline/3d_load_skill exactly once so you use the documented Spline scene/code API correctly.
- Then use Spline/3d_run_code ONLY for READ-ONLY enumeration. The code must not assign to scene objects, transforms, materials, names, parents, states, events, variables, or any other scene data.
- Do not use Spline/3d_get_scene or Spline/3d_get_scene_mcp as the source of the full catalog because large-scene results are condensed.
- A scene-read tool may be used only for lightweight metadata such as scene title if needed.
- Do not use any other mutation-capable action.

PAGINATION CONTRACT:
1. In the first read-only 3d_run_code call, traverse the live object hierarchy and produce:
   - total: total number of catalogued objects
   - offset: 0
   - limit: at most 80
   - sceneName when available
   - rows: the first page of minimal rows
2. Each row should contain only the minimum needed to rebuild the tree:
   - path: slash-separated hierarchy path using exact Spline names
   - type: concise Spline object type
3. Repeat read-only 3d_run_code calls with offsets 80, 160, 240, and so on until every object from 0 through total-1 has been returned.
4. Never ask one MCP response to contain the entire 700+ object hierarchy.
5. Do not stop because an individual page is condensed. Reduce the page size and retry that page if necessary.
6. Before reporting success, verify that the number of unique collected paths equals total.

SAFETY:
- This job is strictly READ-ONLY.
- Do not create, modify, delete, rename, move, recolor, resize, regroup, reparent, animate, or otherwise change any object.
- If the loaded Spline skill cannot provide a read-only traversal approach, report FAILED rather than improvising a write.

FINAL OUTPUT:
Rebuild the collected rows into a hierarchy organized by top-level section.
Each catalog node must have:
- name: exact Spline object name
- type: concise Spline object type
- path: slash-separated hierarchy path
- children: child nodes, or [] for a leaf

Return exactly one compact JSON payload between these markers:
MEDIA_OS_SPLINE_CATALOG_BEGIN
{"sceneName":"exact scene name or Focused Spline 3D Scene","objectCount":771,"sections":[...]}
MEDIA_OS_SPLINE_CATALOG_END

Rules:
- objectCount must equal the number of unique nodes in sections.
- Preserve exact object names.
- Include hidden or disabled objects when the live scene traversal exposes them.
- If the tab title is unavailable but hierarchy data is complete, use "Focused Spline 3D Scene".
- No markdown fences.
- Keep narration minimal.
- If pagination or traversal cannot produce every object, emit:
  MEDIA_OS_SPLINE_DIAGNOSTIC: <total reported, unique paths collected, failed offset/page and reason>
- If every object was collected and verified, end with: MEDIA_OS_SPLINE_RESULT: SUCCEEDED - scene catalog synced
- Otherwise end with: MEDIA_OS_SPLINE_RESULT: FAILED - scene catalog sync failed
"@
  } else {
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
  }

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
    $catalog = $null

    if ($executionProfile -eq "SCENE_CATALOG_V1") {
      $catalog = Get-MediaOsSplineCatalog -Output $output
      if ($null -eq $catalog) {
        throw "Codex finished catalog sync without MEDIA_OS_SPLINE_CATALOG markers."
      }

      $catalogNodeCount = 0
      foreach ($section in @($catalog.sections)) {
        $catalogNodeCount += Get-MediaOsCatalogNodeCount -Node $section
      }

      if ($catalogNodeCount -le 0) {
        throw "Codex returned an empty Spline scene catalog."
      }

      if (
        $null -ne $catalog.PSObject.Properties["objectCount"] -and
        [int]$catalog.objectCount -ne $catalogNodeCount
      ) {
        throw "Spline catalog count mismatch. Declared $($catalog.objectCount), parsed $catalogNodeCount."
      }
    }

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
      catalog = $catalog
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
        catalog = $null
      }
    } catch {
      Write-Warning "Could not report failure to Media OS: $($_.Exception.Message)"
    }
  }

  if ($Once) {
    exit 0
  }
}
