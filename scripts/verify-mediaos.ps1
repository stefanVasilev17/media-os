$ErrorActionPreference = 'Stop'

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($null -eq $docker) {
    throw 'Docker Desktop with Docker Compose is required. No tests were started.'
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Engine is unavailable. No tests were started.'
}

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $root 'devtools/verification/compose.yaml'
$projectName = 'mediaosverify' + [guid]::NewGuid().ToString('N').Substring(0, 12)

try {
    foreach ($service in @('asset-check', 'backend', 'frontend', 'remotion')) {
        Write-Host ''
        Write-Host "=== MediaOS isolated verification: $service ==="
        & docker compose --project-name $projectName --file $composeFile run --rm $service
        if ($LASTEXITCODE -ne 0) {
            throw "MediaOS verification failed at $service (exit code $LASTEXITCODE)."
        }
    }

    Write-Host ''
    Write-Host 'All four isolated MediaOS verification stages completed successfully.'
    Write-Host 'No GitHub Actions, Railway deployment, Codex task or render was started.'
}
finally {
    & docker compose --project-name $projectName --file $composeFile down --volumes --remove-orphans *> $null
}
