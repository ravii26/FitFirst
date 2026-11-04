# One-time setup for FitFirst on Windows. Safe to run again.
# Run with: powershell -ExecutionPolicy Bypass -File setup.ps1
# Add -SkipAI to leave out the Python garment tagger (torch is a large download).
param([switch]$SkipAI)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Step($message) { Write-Host "`n==> $message" -ForegroundColor Cyan }
function Run($command, [string[]]$arguments) {
    & $command @arguments
    if ($LASTEXITCODE -ne 0) { throw "Failed: $command $($arguments -join ' ')" }
}
function Require($command, $wingetId) {
    if (Get-Command $command -ErrorAction SilentlyContinue) { return }
    throw "$command is missing. Install it with: winget install --id $wingetId -e   then open a new terminal and run this again."
}
function Start-Docker {
    docker info --format '{{.ServerVersion}}' *> $null
    if ($LASTEXITCODE -eq 0) { return }
    Write-Host 'Starting Docker Desktop...'
    $paths = @("$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe", "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe")
    Start-Process ($paths | Where-Object { Test-Path $_ } | Select-Object -First 1)
    for ($i = 0; $i -lt 36; $i++) {
        Start-Sleep -Seconds 5
        docker info --format '{{.ServerVersion}}' *> $null
        if ($LASTEXITCODE -eq 0) { return }
    }
    throw 'Docker Desktop did not start. Open it by hand, wait for "Engine running", and run this again.'
}

Step 'Checking tools'
Require 'node' 'OpenJS.NodeJS.LTS'
Require 'docker' 'Docker.DockerDesktop'
if ([int]((node -v) -replace '^v(\d+).*', '$1') -lt 20) { throw 'Node 20 or newer is required.' }
Start-Docker

Step 'Creating backend\.env (an existing file is never overwritten)'
$envPath = Join-Path $PSScriptRoot 'backend\.env'
if (Test-Path $envPath) {
    Write-Host 'backend\.env already exists, keeping it.'
} else {
    # The dashboard and kiosk proxy /api to port 3008, so the backend has to listen there.
    $lines = Get-Content '.env.example' | ForEach-Object { if ($_ -match '^PORT=') { 'PORT=3008' } else { $_ } }
    # Without a BOM, because dotenv would otherwise read it as part of the first key.
    [IO.File]::WriteAllLines($envPath, [string[]]$lines, (New-Object Text.UTF8Encoding($false)))
    Write-Host 'Created backend\.env.'
}

Step 'Installing npm packages'
if (Test-Path 'package-lock.json') { Run 'npm' @('ci') } else { Run 'npm' @('install') }

Step 'Starting the database in Docker'
Run 'docker' @('compose', 'up', '-d', '--wait')

Step 'Preparing the database'
Push-Location backend
try {
    Run 'npx' @('prisma', 'generate')
    Run 'npx' @('prisma', 'migrate', 'deploy')

    # The seed script refuses to touch a database that already holds data.
    $env:FITFIRST_DEMO_SEED = '1'
    & npx tsx prisma/seed.ts
    if ($LASTEXITCODE -ne 0) { Write-Host 'Demo data skipped (the database is not empty).' -ForegroundColor Yellow }
    Remove-Item Env:\FITFIRST_DEMO_SEED
} finally {
    Pop-Location
}

if ($SkipAI) {
    Write-Host "`nSkipped the AI service (-SkipAI)."
} else {
    Step 'Setting up the Python AI service (torch is a large download)'
    Require 'py' 'Python.Python.3.13'
    # Python 3.15 is too new for some of these packages, so pin the virtual environment to 3.13.
    & py -3.13 --version *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.13 is required: winget install --id Python.Python.3.13 -e' }
    $venv = Join-Path $PSScriptRoot 'backend\ai-service\.venv'
    if (-not (Test-Path $venv)) { Run 'py' @('-3.13', '-m', 'venv', $venv) }
    Run (Join-Path $venv 'Scripts\python.exe') @('-m', 'pip', 'install', '-r', 'backend\ai-service\requirements-dev.txt')
}

Step 'Done'
Write-Host 'Add AICREDITS_API_KEY to backend\.env to turn on AI garment tagging, and choose your own DASHBOARD_PIN.'
Write-Host 'Start everything:  npm run dev'
Write-Host 'Dashboard http://localhost:5173 | Kiosk http://localhost:5174 | API http://localhost:3008'
Write-Host 'Start the AI service in a second terminal:  backend\ai-service\start.bat'
