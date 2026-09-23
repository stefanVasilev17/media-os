param(
  [switch]$Once,
  [int]$PollSeconds = 5,
  [switch]$LauncherSelfTest
)

$ErrorActionPreference = "Stop"

function Get-CodexRuntimeArguments {
  param(
    [string]$ExecutionProfile
  )

  $reasoningEffort = "medium"
  $ultraLeanRecipeExecution = $false
  $authoringOverlayDiscovery = $false

  if (
    $ExecutionProfile -eq "REFERENCE_COMPONENT_CREATE_V1" -or
    $ExecutionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V1" -or
    $ExecutionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2" -or
    $ExecutionProfile -eq "TARGETED_OBJECT_V2" -or
    $ExecutionProfile -eq "SCENE_CATALOG_ROOTS_V2" -or
    $ExecutionProfile -eq "SCENE_CATALOG_SECTION_V1" -or
    $ExecutionProfile -eq "AUTHORING_OVERLAY_DISCOVERY_V1"
  ) {
    $reasoningEffort = "low"
  }

  if ($ExecutionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2") {
    $reasoningEffort = "low"
    $ultraLeanRecipeExecution = $true
  }

  if ($ExecutionProfile -eq "AUTHORING_OVERLAY_DISCOVERY_V1") {
    $reasoningEffort = "low"
    $authoringOverlayDiscovery = $true
  }

  $configs = @(
    "web_search=disabled",
    "agents.enabled=false",
    "model_reasoning_effort=$reasoningEffort",
    "model_reasoning_summary=none",
    "model_verbosity=low"
  )

  if ($ultraLeanRecipeExecution) {
    $configs += @(
      "features.shell_tool=false",
      "features.skill_mcp_dependency_install=false",
      "mcp_servers.spline.enabled_tools=['3d_get_objects','3d_run_code']",
      "mcp_servers.spline.tools.3d_get_objects.output_token_limit=2500",
      "mcp_servers.spline.tools.3d_run_code.output_token_limit=2000"
    )
  }

  if ($authoringOverlayDiscovery) {
    $configs += @(
      "features.shell_tool=false",
      "features.skill_mcp_dependency_install=false",
      "mcp_servers.spline.enabled_tools=['3d_get_objects']",
      "mcp_servers.spline.tools.3d_get_objects.output_token_limit=3500"
    )
  }

  $configArgs = ($configs | ForEach-Object { "--config $_" }) -join " "
  return "$configArgs --approve-for-me exec --skip-git-repo-check --ephemeral -"
}

function Resolve-CodexStartInfo {
  param(
    [string]$Command,
    [string]$ExecutionProfile
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
  $codexRuntimeArguments = Get-CodexRuntimeArguments -ExecutionProfile $ExecutionProfile

  if ($codexPath.EndsWith(".ps1", [System.StringComparison]::OrdinalIgnoreCase)) {
    $powershellExe = Join-Path $PSHOME "powershell.exe"

    if (-not (Test-Path $powershellExe)) {
      $powershellExe = (Get-Command powershell.exe -ErrorAction Stop).Source
    }

    $startInfo.FileName = $powershellExe
    $startInfo.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" {1}' -f $codexPath, $codexRuntimeArguments
  } elseif (
    $codexPath.EndsWith(".cmd", [System.StringComparison]::OrdinalIgnoreCase) -or
    $codexPath.EndsWith(".bat", [System.StringComparison]::OrdinalIgnoreCase)
  ) {
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = '/d /s /c ""{0}" {1}"' -f $codexPath, $codexRuntimeArguments
  } else {
    $startInfo.FileName = $codexPath
    $startInfo.Arguments = $codexRuntimeArguments
  }

  return $startInfo
}

function Invoke-CodexSplineJob {
  param(
    [string]$Prompt,
    [string]$Command,
    [string]$ExecutionProfile
  )

  $startInfo = Resolve-CodexStartInfo -Command $Command -ExecutionProfile $ExecutionProfile
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo

  if (-not $process.Start()) {
    throw "Could not start Codex process."
  }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()

  $promptBytes = [System.Text.Encoding]::UTF8.GetBytes($Prompt)
  $process.StandardInput.BaseStream.Write($promptBytes, 0, $promptBytes.Length)
  $process.StandardInput.BaseStream.Flush()
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

function Invoke-DirectSplineAuthoringOverlay {
  param(
    [string]$SceneFingerprint,
    [object[]]$Targets
  )

  $helperPath = Join-Path (Split-Path -Parent $PSCommandPath) "spline-direct-overlay.js"
  if (-not (Test-Path $helperPath)) {
    throw "Direct Spline overlay helper is missing: $helperPath"
  }

  $nodeCommand = Get-Command node -ErrorAction Stop
  $nodePath = $nodeCommand.Source
  if ([string]::IsNullOrWhiteSpace($nodePath)) {
    $nodePath = $nodeCommand.Path
  }
  if ([string]::IsNullOrWhiteSpace($nodePath)) {
    throw "Node.js is required for direct Spline MCP overlay discovery."
  }

  $splineExe = Join-Path $env:LOCALAPPDATA "Programs\Spline\Spline.exe"
  $mcpScript = Join-Path $env:LOCALAPPDATA "Programs\Spline\resources\spline-mcp.cjs"

  if (-not (Test-Path $splineExe)) {
    throw "Spline.exe was not found at $splineExe"
  }
  if (-not (Test-Path $mcpScript)) {
    throw "spline-mcp.cjs was not found at $mcpScript"
  }

  $targetsJson = ConvertTo-Json -InputObject @($Targets) -Compress -Depth 20

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true
  $startInfo.FileName = $nodePath
  $startInfo.Arguments = '"{0}"' -f $helperPath
  $startInfo.EnvironmentVariables["MEDIA_OS_SPLINE_TARGETS_JSON"] = $targetsJson
  $startInfo.EnvironmentVariables["MEDIA_OS_SCENE_FINGERPRINT"] = $SceneFingerprint
  $startInfo.EnvironmentVariables["MEDIA_OS_SPLINE_EXE"] = $splineExe
  $startInfo.EnvironmentVariables["MEDIA_OS_SPLINE_MCP_SCRIPT"] = $mcpScript

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo

  if (-not $process.Start()) {
    throw "Could not start direct Spline MCP helper."
  }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  $process.WaitForExit()

  $stdout = $stdoutTask.Result
  $stderr = $stderrTask.Result

  return @{
    ExitCode = $process.ExitCode
    Output = if ($null -eq $stdout) { "" } else { $stdout.Trim() }
    Diagnostics = if ($null -eq $stderr) { "" } else { $stderr.Trim() }
  }
}

function Capture-SplineWindowSnapshot {
  Add-Type -AssemblyName System.Drawing

  if (-not ("MediaOsWindowCapture" -as [type])) {
    Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class MediaOsWindowCapture {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool BringWindowToTop(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll")]
  public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(
    IntPtr hWnd,
    IntPtr hWndInsertAfter,
    int X,
    int Y,
    int cx,
    int cy,
    uint uFlags
  );
}
"@
  }

  $process = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -match "(?i)spline" } |
    Select-Object -First 1

  if ($null -eq $process) {
    throw "Could not find an open Spline desktop window."
  }

  $handle = [IntPtr]$process.MainWindowHandle
  $HWND_TOPMOST = [IntPtr](-1)
  $HWND_NOTOPMOST = [IntPtr](-2)
  $SWP_NOMOVE = 0x0002
  $SWP_NOSIZE = 0x0001
  $SWP_SHOWWINDOW = 0x0040
  $flags = $SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW

  [MediaOsWindowCapture]::ShowWindowAsync($handle, 9) | Out-Null
  [MediaOsWindowCapture]::SetWindowPos($handle, $HWND_TOPMOST, 0, 0, 0, 0, $flags) | Out-Null
  [MediaOsWindowCapture]::BringWindowToTop($handle) | Out-Null
  [MediaOsWindowCapture]::SetForegroundWindow($handle) | Out-Null
  Start-Sleep -Milliseconds 250
  [MediaOsWindowCapture]::SetWindowPos($handle, $HWND_NOTOPMOST, 0, 0, 0, 0, $flags) | Out-Null
  [MediaOsWindowCapture]::SetForegroundWindow($handle) | Out-Null
  Start-Sleep -Milliseconds 650

  $foreground = [MediaOsWindowCapture]::GetForegroundWindow()
  if ($foreground -ne $handle) {
    throw "Spline could not be brought to the foreground. Close or minimize the active Windows dialog and try Refresh map again."
  }

  $rect = New-Object MediaOsWindowCapture+RECT
  if (-not [MediaOsWindowCapture]::GetWindowRect($handle, [ref]$rect)) {
    throw "Could not read the Spline window bounds."
  }

  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top

  if ($width -lt 100 -or $height -lt 100) {
    throw "Spline window is minimized or has invalid bounds."
  }

  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $path = Join-Path $env:TEMP ("media-os-spline-snapshot-" + [Guid]::NewGuid().ToString("N") + ".png")

  try {
    $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }

  return @{
    Path = $path
    Width = $width
    Height = $height
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

function Get-MediaOsAuthoringOverlay {
  param(
    [string]$Output
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $null
  }

  $match = [regex]::Match(
    $Output,
    '(?is)MEDIA_OS_AUTHORING_OVERLAY_BEGIN\s*(.*?)\s*MEDIA_OS_AUTHORING_OVERLAY_END'
  )

  if (-not $match.Success) {
    return $null
  }

  try {
    return ($match.Groups[1].Value | ConvertFrom-Json)
  } catch {
    throw "Codex returned invalid authoring overlay JSON."
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

function Get-CodexFailureDetail {
  param(
    [string]$Output,
    [int]$ExitCode
  )

  $prefix = "Codex exited with code $ExitCode."

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $prefix
  }

  $clean = ($Output -replace "[\x00-\x08\x0B\x0C\x0E-\x1F]", "").Trim()
  $maxLength = 3500

  if ($clean.Length -gt $maxLength) {
    $clean = "... " + $clean.Substring($clean.Length - $maxLength)
  }

  return "$prefix $clean"
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

function Get-MediaOsSplineRecipe {
  param(
    [string]$Output
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $null
  }

  $match = [regex]::Match(
    $Output,
    '(?is)MEDIA_OS_SPLINE_RECIPE_BEGIN\s*(.*?)\s*MEDIA_OS_SPLINE_RECIPE_END'
  )

  if (-not $match.Success) {
    return $null
  }

  try {
    return ($match.Groups[1].Value | ConvertFrom-Json)
  } catch {
    throw "Codex returned invalid component recipe JSON."
  }
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
powershell -NoProfile -Command "$inputStream=[Console]::OpenStandardInput(); $memory=New-Object System.IO.MemoryStream; $buffer=New-Object byte[] 4096; while (($read=$inputStream.Read($buffer,0,$buffer.Length)) -gt 0) { $memory.Write($buffer,0,$read) }; try { $utf8=New-Object System.Text.UTF8Encoding($false,$true); $text=$utf8.GetString($memory.ToArray()); if ($text -notmatch 'PING') { exit 43 }; Write-Output 'UTF8_STDIN_OK'; exit 0 } catch { Write-Error $_.Exception.Message; exit 42 }"
exit /b %ERRORLEVEL%
'@ | Set-Content -Path $fakeCodexCmd -Encoding ASCII

  try {
    $result = Invoke-CodexSplineJob -Prompt "PING – UTF-8 ✓" -Command $fakeCodexPs1 -ExecutionProfile "REFERENCE_COMPONENT_CREATE_V1"

    if ([int]$result.ExitCode -ne 0) {
      throw "Launcher self-test returned exit code $($result.ExitCode). Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch "FAKE_CODEX_CMD_OK") {
      throw "Launcher self-test did not prefer the sibling native Windows shim. Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch "--approve-for-me exec") {
      throw "Launcher self-test did not enable Codex auto-review. Output: $($result.Output)"
    }

    if ([string]$result.Output -notmatch "model_reasoning_effort=low") {
      throw "Launcher self-test did not apply low reasoning for targeted execution. Output: $($result.Output)"
    }

    $ultraLeanArgs = Get-CodexRuntimeArguments -ExecutionProfile "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2"
    if ($ultraLeanArgs -notmatch "model_reasoning_effort=low") {
      throw "Ultra-lean recipe execution did not apply low reasoning. Args: $ultraLeanArgs"
    }
    if ($ultraLeanArgs -notmatch "features.shell_tool=false") {
      throw "Ultra-lean recipe execution did not disable the shell tool. Args: $ultraLeanArgs"
    }
    if ($ultraLeanArgs -notmatch "mcp_servers.spline.enabled_tools=") {
      throw "Ultra-lean recipe execution did not restrict the Spline MCP tool surface. Args: $ultraLeanArgs"
    }
    if ($ultraLeanArgs -notmatch "3d_get_objects" -or $ultraLeanArgs -notmatch "3d_run_code") {
      throw "Ultra-lean recipe execution is missing required Spline tools. Args: $ultraLeanArgs"
    }

    $overlayArgs = Get-CodexRuntimeArguments -ExecutionProfile "AUTHORING_OVERLAY_DISCOVERY_V1"
    if ($overlayArgs -notmatch "model_reasoning_effort=low") {
      throw "Authoring overlay discovery did not apply low reasoning. Args: $overlayArgs"
    }
    if ($overlayArgs -notmatch "features.shell_tool=false") {
      throw "Authoring overlay discovery did not disable shell execution. Args: $overlayArgs"
    }

    if ([string]$result.Output -notmatch "UTF8_STDIN_OK") {
      throw "Launcher self-test did not preserve UTF-8 redirected stdin. Output: $($result.Output)"
    }

    $successSample = "noise" + [Environment]::NewLine + "MEDIA_OS_SPLINE_RESULT: SUCCEEDED - test"
    $failureSample = "noise" + [Environment]::NewLine + "MEDIA_OS_SPLINE_RESULT: FAILED - test"
    $successMarker = Get-MediaOsSplineResult -Output $successSample
    $failureMarker = Get-MediaOsSplineResult -Output $failureSample
    $catalogSample = "MEDIA_OS_SPLINE_CATALOG_BEGIN" + [Environment]::NewLine + '{"sceneName":"Test","sections":[{"name":"ROOT","type":"Group","path":"ROOT","children":[{"name":"CHILD","type":"Shape","path":"ROOT/CHILD","children":[]}]}]}' + [Environment]::NewLine + "MEDIA_OS_SPLINE_CATALOG_END"
    $catalogMarker = Get-MediaOsSplineCatalog -Output $catalogSample
    $recipeSample = "MEDIA_OS_SPLINE_RECIPE_BEGIN" + [Environment]::NewLine + '{"recipeVersion":1,"referenceObjectName":"Headers","construction":{"root":{"type":"Group"}}}' + [Environment]::NewLine + "MEDIA_OS_SPLINE_RECIPE_END"
    $recipeMarker = Get-MediaOsSplineRecipe -Output $recipeSample
    $overlaySample = "MEDIA_OS_AUTHORING_OVERLAY_BEGIN" + [Environment]::NewLine + '{"sceneFingerprint":"abc","items":[{"slotKey":"AT_SLOT_TEST","label":{"status":"FOUND","targetPath":"Test/TITLE","currentText":"Test"},"states":[],"eventBindings":[],"actionGraph":[],"coverage":{"label":"EXPOSED","states":"CONFIRMED_EMPTY","events":"CONFIRMED_EMPTY","actions":"CONFIRMED_EMPTY"}}]}' + [Environment]::NewLine + "MEDIA_OS_AUTHORING_OVERLAY_END"
    $overlayMarker = Get-MediaOsAuthoringOverlay -Output $overlaySample

    if (
      $null -eq $recipeMarker -or
      $recipeMarker.referenceObjectName -ne "Headers" -or
      $recipeMarker.construction.root.type -ne "Group"
    ) {
      throw "Spline component recipe marker self-test failed."
    }

    if (
      $null -eq $overlayMarker -or
      $overlayMarker.items[0].slotKey -ne "AT_SLOT_TEST" -or
      $overlayMarker.items[0].label.targetPath -ne "Test/TITLE"
    ) {
      throw "Spline authoring overlay marker self-test failed."
    }

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

  if ([string]$job.taskType -eq "CAPTURE_SPLINE_SNAPSHOT") {
    $snapshot = $null
    $timer = [System.Diagnostics.Stopwatch]::StartNew()

    try {
      $snapshot = Capture-SplineWindowSnapshot
      $uploadUri = "$baseUrl/api/v1/worker/spline/snapshot/$($job.id)?width=$($snapshot.Width)&height=$($snapshot.Height)"

      Invoke-WebRequest -Method Post -Uri $uploadUri -Headers $headers -ContentType "image/png" -InFile $snapshot.Path -UseBasicParsing | Out-Null
      $timer.Stop()

      Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/complete" -Body @{
        output = "MEDIA_OS_SPLINE_RESULT: SUCCEEDED - local Spline snapshot captured"
        error = $null
        metrics = @{
          tokenCount = 0
          splineMcpCalls = 0
          durationMs = $timer.ElapsedMilliseconds
          executionProfile = "LOCAL_SCREENSHOT_V1"
        }
        catalog = $null
      }

      Write-Host "Spline snapshot captured and uploaded without Codex."
    } catch {
      $timer.Stop()
      $message = $_.Exception.Message
      Write-Error $message -ErrorAction Continue

      try {
        Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/fail" -Body @{
          output = $null
          error = $message
          metrics = @{
            tokenCount = 0
            splineMcpCalls = 0
            durationMs = $timer.ElapsedMilliseconds
            executionProfile = "LOCAL_SCREENSHOT_V1"
          }
          catalog = $null
        }
      } catch {
        Write-Warning "Could not report snapshot failure to Media OS: $($_.Exception.Message)"
      }
    } finally {
      if ($null -ne $snapshot -and $null -ne $snapshot.Path) {
        Remove-Item $snapshot.Path -Force -ErrorAction SilentlyContinue
      }
    }

    if ($Once) {
      exit 0
    }

    continue
  }

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

  if (
    $executionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2" -or
    $executionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V1"
  ) {
    $titleDirective = "preserve recipe title"
    if (
      $null -ne $job.payload.titleText -and
      -not [string]::IsNullOrWhiteSpace([string]$job.payload.titleText)
    ) {
      $titleDirective = [string]$job.payload.titleText
    }

    $placementDirective = [string]$job.payload.placementPolicy
    if ([string]::IsNullOrWhiteSpace($placementDirective)) {
      $placementDirective = "NEAREST_SAFE_EMPTY_AREA"
    }

    $componentRecipe = ($job.payload.componentRecipe | ConvertTo-Json -Compress -Depth 30)

    $prompt = @"
RECIPE_EXEC
ROOT=$($job.payload.targetRootName)
TITLE=$titleDirective
PLACE=$placementDirective
RECIPE=$componentRecipe

Only Spline MCP is available. Use <=3 MCP calls total:
1) 3d_get_objects: exact ROOT existence check only.
2) 3d_run_code: create ROOT + descendants from RECIPE in one mutation. Never change pre-existing objects.
3) 3d_get_objects: exact ROOT verification only.

Do not read the reference, scene, camera, or unrelated objects. No skill load, screenshot, shell, web, or narration.
If ROOT already exists or create/verify is unsafe: MEDIA_OS_SPLINE_RESULT: FAILED
If created and verified: MEDIA_OS_SPLINE_RESULT: SUCCEEDED
"@
  } elseif ($executionProfile -eq "REFERENCE_COMPONENT_CREATE_V1") {
    $titleDirective = "Preserve the reference title text."
    if (
      $null -ne $job.payload.titleText -and
      -not [string]::IsNullOrWhiteSpace([string]$job.payload.titleText)
    ) {
      $titleDirective = "Set the new title text to: $($job.payload.titleText)"
    }

    $placementDirective = "Place it in the nearest safe empty area."
    if ([string]$job.payload.placementPolicy -eq "BELOW_MAIN_ARCHITECTURE_MAP") {
      $placementDirective = "Place it in a safe empty area below the main architecture map."
    } elseif ([string]$job.payload.placementPolicy -eq "EMPTY_AREA") {
      $placementDirective = "Place it in a safe empty area without moving existing objects."
    }

    $prompt = @"
REFERENCE_COMPONENT_CREATE_V1

Use only Spline MCP. Keep reasoning and narration minimal.

REFERENCE READ-ONLY: $($job.payload.referenceObjectName)
NEW ROOT: $($job.payload.targetRootName)
TITLE: $titleDirective
PLACEMENT: $placementDirective

EXECUTION CONTRACT:
1. Use exact-name targeted object lookup. Never enumerate the full scene and never call 3d_get_scene_mcp.
2. Check the exact NEW ROOT name first. If it already exists, end FAILED before mutation.
3. Read only the REFERENCE object and the minimum descendants required to reproduce its card construction.
4. Never mutate, move, rename, recolor, resize, reparent, or delete the REFERENCE or any pre-existing object.
5. Create only NEW ROOT and children beneath it. Match reference dimensions, body/background, border, corner radius, accent colors, spacing, and relevant child structure. Apply TITLE only to the new component.
6. Use the minimum mutation calls. Prefer one safe 3d_run_code mutation when supported; otherwise use the fewest Spline mutation calls possible.
7. Verify NEW ROOT with one exact targeted readback. No screenshot, no camera change, no global settings change.
8. After successful verification, emit a compact reusable recipe between these exact markers:
MEDIA_OS_SPLINE_RECIPE_BEGIN
{"recipeVersion":1,"referenceObjectName":"$($job.payload.referenceObjectName)","construction":{...}}
MEDIA_OS_SPLINE_RECIPE_END
The recipe must contain only reusable construction data: root type/size, visual/material properties, border/corner treatment, child types, relative transforms/sizes, text roles, and spacing needed to recreate the component. Do not include absolute scene position, transient Spline object IDs, the new root name, or unrelated scene data.
9. Do not use web, browser, CUA, node_repl, codex_apps, or any non-Spline fallback.
10. End with exactly one concise line:
MEDIA_OS_SPLINE_RESULT: SUCCEEDED
or
MEDIA_OS_SPLINE_RESULT: FAILED
"@
  } elseif ($executionProfile -eq "CREATOR_CHAT_V2") {
    $prompt = @"
You are the Architectural Thinking Media OS Spline Agent.

This is a creator-approved CREATOR_CHAT_V2 execution job against the currently focused Spline 3D editor tab.

CREATOR COMMAND:
$($job.payload.creatorMessage)

ALLOWED PERMISSIONS:
$permissions

PROTECTED OBJECTS:
$protectedObjects

MANDATORY TOOL ROUTE:
- Use only Spline/* MCP tools for scene inspection and mutation.
- Load the Spline 3D skill at most once if required.
- Do not use browser automation, screenshots, cua_repl, or non-Spline fallbacks.
- Do not enumerate the full scene when the creator named specific objects. Read only the named targets, references, and the minimum placement context required.

CREATOR CHAT V2 SAFETY CONTRACT:
- The creator command is the source of truth, but safety boundaries below are mandatory.
- Existing objects described as reference, visual reference, source, example, template, or comparison are READ-ONLY. Never move, resize, recolor, rename, reparent, delete, or otherwise mutate them.
- Existing objects may be mutated only when the creator explicitly asks to change that exact object.
- Any NEW root sandbox object must have a name beginning with MEDIA_OS_. If the creator asks to create a new object but does not provide a MEDIA_OS_* root name, fail before mutation.
- Before creating a requested MEDIA_OS_* root object, check that the exact root name does not already exist. If it already exists, fail before mutation rather than overwrite or repurpose it.
- Children created under a new MEDIA_OS_* root may use descriptive names without the prefix, but they must remain inside that newly created sandbox subtree.
- For a creation request, read all required reference properties BEFORE the first mutation.
- Use the minimum number of mutation calls needed to reproduce the requested dimensions, materials, border/body treatment, spacing, text, and structure. The old one-mutation limit does not apply to creator-approved component creation.
- Never mutate objects outside explicit creator targets or the newly created MEDIA_OS_* subtree.
- Never delete pre-existing objects. You may remove only objects created during this same job if required to roll back a partial failed creation.
- Do not change camera, global scene settings, lighting, or unrelated hierarchy.
- After mutation, verify the exact new/edited target with targeted readback. For creation, verify the root name/path, transform/size, visible material or color properties when available, and child structure relevant to the request.
- If any required reference cannot be read or the requested result cannot be verified, report FAILED with a concise reason. Never pretend success.

RESULT:
- If the requested Spline change is actually completed and verified, end with exactly one concise line beginning:
  MEDIA_OS_SPLINE_RESULT: SUCCEEDED
- If it cannot be completed safely, end with exactly one concise line beginning:
  MEDIA_OS_SPLINE_RESULT: FAILED
- Never report SUCCEEDED unless the scene change was performed through Spline MCP and verified.
"@
  } elseif ($executionProfile -eq "AUTHORING_OVERLAY_DISCOVERY_V1") {
    $overlayTargets = ($job.payload.overlays | ConvertTo-Json -Compress -Depth 20)
    $prompt = @"
AUTHORING_OVERLAY_DISCOVERY_V1

This is a strictly READ-ONLY, token-minimized metadata extraction job against the currently focused Spline 3D editor tab.

SCENE FINGERPRINT:
$($job.payload.sceneFingerprint)

EXACT TARGETS:
$overlayTargets

GOAL:
For each supplied target only, extract authoring metadata that Media OS cannot obtain from the published browser runtime:
1) the visible Text object/path that acts as the primary displayed label, if directly identifiable;
2) authored state definitions directly exposed by Spline read tools;
3) authored event bindings directly exposed by Spline read tools;
4) authored action/transition information directly exposed by Spline read tools.

TOKEN / CALL BUDGET:
- Keep reasoning and narration minimal.
- Do NOT call 3d_load_skill, get_scene_mcp, get_scene, run_code, or any other Spline tool.
- Call exactly one Spline/3d_get_objects for the entire batch.
- The only valid input is {"ids":[...]}; fill ids with every exact objectUuid from EXACT TARGETS, preserving target order.
- Do not use objectName or editorPath as lookup arguments. 3d_get_objects accepts object ids only.
- Use the returned object details as the sole source of truth for states, events, actions/transitions, and variable bindings.
- If a requested label is not directly exposed by the returned target detail, mark label NOT_EXPOSED instead of performing another lookup.
- Do not enumerate the full scene.
- Do not take screenshots.
- Do not use shell, web, browser automation, cua_repl, or non-Spline fallbacks.
- Never call mutation tools or 3d_run_code.
- Do not retry speculative lookups repeatedly. If metadata is not directly exposed, mark it NOT_EXPOSED and move on.

TRUTHFULNESS:
- Never infer a label target from naming alone. It must be directly visible in the returned target/subtree metadata.
- Never invent states, event bindings, actions, paths, text, or IDs.
- An empty array means the read result directly confirmed none.
- If the API/tool does not expose a field, use coverage value NOT_EXPOSED and keep the corresponding array empty.
- Preserve every slotKey exactly as provided.

OUTPUT ONLY:
MEDIA_OS_AUTHORING_OVERLAY_BEGIN
{"sceneFingerprint":"$($job.payload.sceneFingerprint)","items":[{"slotKey":"exact input slotKey","objectName":"exact input objectName","editorPath":"exact input editorPath","label":{"status":"FOUND|NOT_FOUND|NOT_EXPOSED","targetPath":"exact path or null","currentText":"exact visible text or null"},"states":[],"eventBindings":[],"actionGraph":[],"coverage":{"label":"EXPOSED|NOT_FOUND|NOT_EXPOSED|PARTIAL","states":"EXPOSED|CONFIRMED_EMPTY|NOT_EXPOSED|PARTIAL","events":"EXPOSED|CONFIRMED_EMPTY|NOT_EXPOSED|PARTIAL","actions":"EXPOSED|CONFIRMED_EMPTY|NOT_EXPOSED|PARTIAL"},"notes":"brief factual note or null"}]}
MEDIA_OS_AUTHORING_OVERLAY_END
MEDIA_OS_SPLINE_RESULT: SUCCEEDED - authoring overlay batch read

If none of the supplied targets can be read safely:
MEDIA_OS_SPLINE_RESULT: FAILED - authoring overlay targets unreadable
"@
  } elseif ($executionProfile -eq "SCENE_CATALOG_ROOTS_V2") {
    $prompt = @"
You are the Architectural Thinking Media OS Spline Catalog Indexer.

This is a strictly READ-ONLY root index job against the currently focused Spline 3D editor tab.

GOAL:
Do NOT try to enumerate all 700+ objects. Read only the scene summary needed to identify every top-level/root object or group. Large-scene folding is acceptable below the root level.

MANDATORY TOOL ROUTE:
- Use only Spline/* MCP tools.
- FIRST call Spline/3d_load_skill exactly once.
- Then call Spline/3d_get_scene_mcp once.
- Do not call 3d_run_code.
- Do not use cua_repl, screenshots, browser/UI automation, or any fallback.
- Do not modify anything.

OUTPUT:
Return exactly one compact JSON payload:
MEDIA_OS_SPLINE_CATALOG_BEGIN
{"sceneName":"exact scene name or Focused Spline 3D Scene","objectCount":771,"sections":[{"name":"exact root name","type":"concise type","path":"exact root name","loaded":false,"children":[]}]}
MEDIA_OS_SPLINE_CATALOG_END

Rules:
- sections contains only top-level/root entries visible in the scene summary.
- objectCount should use the total reported by Spline when available; it may be larger than sections.length.
- If a root entry is explicitly known to be a leaf with no children, set loaded:true. Otherwise set loaded:false.
- Preserve exact names.
- Never invent root entries.
- If at least one real root entry is read, end with: MEDIA_OS_SPLINE_RESULT: SUCCEEDED - scene root index synced
- Otherwise emit MEDIA_OS_SPLINE_DIAGNOSTIC and end with FAILED.
"@
  } elseif ($executionProfile -eq "SCENE_CATALOG_SECTION_V1") {
    $prompt = @"
You are the Architectural Thinking Media OS Spline Section Reader.

This is a strictly READ-ONLY targeted section job against the currently focused Spline 3D editor tab.

TARGET SECTION:
Name: $($job.payload.sectionName)
Path: $($job.payload.sectionPath)

GOAL:
Read this one section/subtree only. Do not enumerate unrelated scene objects.

MANDATORY TOOL ROUTE:
- Use only Spline/* MCP tools.
- FIRST call Spline/3d_load_skill exactly once.
- Use the exact read-only object lookup arguments documented by the loaded skill.
- Resolve the target section by exact name/path from the scene summary if an identifier is required.
- Prefer Spline/3d_get_objects for the target section and its descendants.
- If the returned target subtree is folded, follow only the identifiers of child groups inside this target branch until the branch is complete.
- Do not call 3d_run_code.
- Do not use cua_repl, screenshots, browser/UI automation, or any fallback.
- Do not modify anything.

OUTPUT:
Return exactly one compact JSON payload:
MEDIA_OS_SPLINE_CATALOG_BEGIN
{"sceneName":"Focused Spline 3D Scene","sectionPath":"$($job.payload.sectionPath)","section":{"name":"$($job.payload.sectionName)","type":"Group","path":"$($job.payload.sectionPath)","loaded":true,"children":[...]}}
MEDIA_OS_SPLINE_CATALOG_END

Every child node must contain:
- name: exact Spline name
- type: concise type
- path: slash-separated path under the target section
- loaded:true when its returned descendants are complete
- children: child nodes or []

Rules:
- Never include objects outside the requested target section.
- Preserve exact names.
- If the branch cannot be completed, emit MEDIA_OS_SPLINE_DIAGNOSTIC with the unresolved child/group and end with FAILED rather than pretending the branch is complete.
- If the target section is completely read, end with: MEDIA_OS_SPLINE_RESULT: SUCCEEDED - scene section synced
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
    $directOverlayUsed = $false

    if ($executionProfile -eq "AUTHORING_OVERLAY_DISCOVERY_V1") {
      Write-Host "Executing direct Spline MCP overlay discovery..."

      $executionTimer = [System.Diagnostics.Stopwatch]::StartNew()

      try {
        $directResult = Invoke-DirectSplineAuthoringOverlay `
          -SceneFingerprint ([string]$job.payload.sceneFingerprint) `
          -Targets @($job.payload.overlays)

        if ([int]$directResult.ExitCode -ne 0) {
          $directFailure = [string]$directResult.Diagnostics
          if ([string]::IsNullOrWhiteSpace($directFailure)) {
            $directFailure = "Direct Spline MCP helper exited with code $($directResult.ExitCode)."
          }
          throw $directFailure
        }

        $output = [string]$directResult.Output
        $codexResult = @{
          ExitCode = 0
          Output = $output
        }
        $directOverlayUsed = $true
        $executionTimer.Stop()

        $metrics = [pscustomobject]@{
          durationMs = $executionTimer.ElapsedMilliseconds
          tokenCount = 0
          splineMcpCalls = 1
          targetMcpCalls = 1
          reasoningEffort = "none"
          executionProfile = $executionProfile
          targetTokenBudget = 0
          batchSize = @($job.payload.overlays).Count
          readOnly = $true
          efficiencyBudgetExceeded = $false
          executionEngine = "DIRECT_SPLINE_MCP"
        }
      } catch {
        if ($executionTimer.IsRunning) {
          $executionTimer.Stop()
        }
        $directFailure = $_.Exception.Message
        $metrics = [pscustomobject]@{
          durationMs = $executionTimer.ElapsedMilliseconds
          tokenCount = 0
          splineMcpCalls = 1
          targetMcpCalls = 1
          reasoningEffort = "none"
          executionProfile = $executionProfile
          targetTokenBudget = 0
          batchSize = @($job.payload.overlays).Count
          readOnly = $true
          efficiencyBudgetExceeded = $false
          executionEngine = "DIRECT_SPLINE_MCP_FAILED"
        }
        throw "Direct Spline MCP overlay discovery failed without Codex fallback. $directFailure"
      }
    } else {
      Write-Host "Executing through Codex + Spline MCP..."

      $executionTimer = [System.Diagnostics.Stopwatch]::StartNew()
      $codexResult = Invoke-CodexSplineJob -Prompt $prompt -Command $codexCommand -ExecutionProfile $executionProfile
      $executionTimer.Stop()
      $output = [string]$codexResult.Output
      $metrics = Get-CodexExecutionMetrics -Output $output -DurationMs $executionTimer.ElapsedMilliseconds -ExecutionProfile $executionProfile
    }
    if (
      $executionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2" -or
      $executionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V1"
    ) {
      $metrics.recipeCache = "HIT"
      $metrics.referenceReadSkipped = $true
      $metrics.reasoningEffort = if ($executionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2") { "low" } else { "low" }
      $metrics.mcpToolSurface = if ($executionProfile -eq "REFERENCE_COMPONENT_CREATE_FROM_RECIPE_V2") { 2 } else { $null }
      $metrics.targetMcpCalls = 3
      $metrics.targetTokenBudget = 6000
      if ($null -ne $componentRecipe) {
        $metrics.recipeChars = $componentRecipe.Length
      }
      $metrics.efficiencyBudgetExceeded = (
        [int]$metrics.splineMcpCalls -gt 3 -or
        ($null -ne $metrics.tokenCount -and [long]$metrics.tokenCount -gt 6000)
      )
    } elseif ($executionProfile -eq "REFERENCE_COMPONENT_CREATE_V1") {
      $metrics.recipeCache = "MISS_LEARN"
      $metrics.referenceReadSkipped = $false
    } elseif ($executionProfile -eq "AUTHORING_OVERLAY_DISCOVERY_V1" -and -not $directOverlayUsed) {
      $metrics.reasoningEffort = "low"
      $metrics.readOnly = $true
      $metrics.targetTokenBudget = 5000
      $metrics.targetMcpCalls = 1
      $metrics.batchSize = @($job.payload.overlays).Count
      $metrics.efficiencyBudgetExceeded = (
        [int]$metrics.splineMcpCalls -gt 1 -or
        ($null -ne $metrics.tokenCount -and [long]$metrics.tokenCount -gt 5000)
      )
    }

    Write-Host $output

    if ([int]$codexResult.ExitCode -ne 0) {
      throw (Get-CodexFailureDetail -Output $output -ExitCode ([int]$codexResult.ExitCode))
    }

    $resultLine = Get-MediaOsSplineResult -Output $output
    $catalog = $null
    $recipe = $null
    $authoringOverlay = $null

    if ($executionProfile -eq "REFERENCE_COMPONENT_CREATE_V1") {
      try {
        $recipe = Get-MediaOsSplineRecipe -Output $output
      } catch {
        Write-Warning "Component recipe could not be parsed; the verified Spline change can still succeed. $($_.Exception.Message)"
        $recipe = $null
      }

      if ($null -eq $recipe) {
        $metrics.recipeCache = "MISS_NO_RECIPE"
      } else {
        $recipeJsonForMetrics = ($recipe | ConvertTo-Json -Compress -Depth 30)
        $metrics.recipeChars = $recipeJsonForMetrics.Length
      }
    }

    if ($executionProfile -eq "AUTHORING_OVERLAY_DISCOVERY_V1") {
      $authoringOverlay = Get-MediaOsAuthoringOverlay -Output $output
      if ($null -eq $authoringOverlay) {
        throw "Codex finished authoring overlay discovery without MEDIA_OS_AUTHORING_OVERLAY markers."
      }
      if (
        $null -eq $authoringOverlay.PSObject.Properties["sceneFingerprint"] -or
        $null -eq $authoringOverlay.PSObject.Properties["items"] -or
        @($authoringOverlay.items).Count -le 0
      ) {
        throw "Codex returned an invalid authoring overlay discovery payload."
      }
    }

    if (
      $executionProfile -eq "SCENE_CATALOG_ROOTS_V2" -or
      $executionProfile -eq "SCENE_CATALOG_SECTION_V1"
    ) {
      $catalog = Get-MediaOsSplineCatalog -Output $output
      if ($null -eq $catalog) {
        throw "Codex finished catalog sync without MEDIA_OS_SPLINE_CATALOG markers."
      }

      if ($executionProfile -eq "SCENE_CATALOG_ROOTS_V2") {
        $catalogNodeCount = 0
        foreach ($section in @($catalog.sections)) {
          $catalogNodeCount += Get-MediaOsCatalogNodeCount -Node $section
        }

        if ($catalogNodeCount -le 0) {
          throw "Codex returned an empty Spline root catalog."
        }
      } else {
        if (
          $null -eq $catalog.PSObject.Properties["section"] -or
          $null -eq $catalog.PSObject.Properties["sectionPath"]
        ) {
          throw "Codex returned an invalid targeted Spline section catalog."
        }
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
      recipe = $recipe
      authoringOverlay = $authoringOverlay
    }

    Write-Host "Job completed and reported to Media OS."
  } catch {
    $message = $_.Exception.Message
    Write-Error $message -ErrorAction Continue

    try {
      Invoke-WorkerPost -Path "/api/v1/worker/spline/jobs/$($job.id)/fail" -Body @{
        output = $output
        error = $message
        metrics = $metrics
        catalog = $null
        recipe = $null
      }
    } catch {
      Write-Warning "Could not report failure to Media OS: $($_.Exception.Message)"
    }
  }

  if ($Once) {
    exit 0
  }
}
