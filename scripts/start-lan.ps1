# Start QuizQuest API + admin portal for access from any device on the same LAN.
# Run from repo root: .\scripts\start-lan.ps1
# (Run PowerShell as Administrator once if firewall rules are missing.)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent

function Get-LanIp {
  (Get-NetIPConfiguration | Where-Object {
    $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up"
  } | Select-Object -First 1).IPv4Address.IPAddress
}

function Test-PortInUse {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Ensure-FirewallRule {
  param([int]$Port, [string]$Name)
  netsh advfirewall firewall show rule name="$Name" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding firewall rule for TCP port $Port (needs Administrator)..." -ForegroundColor Yellow
    netsh advfirewall firewall add rule name="$Name" dir=in action=allow protocol=TCP localport=$Port | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Could not add firewall rule for port $Port. Run PowerShell as Administrator:" -ForegroundColor Red
      Write-Host "  netsh advfirewall firewall add rule name=`"$Name`" dir=in action=allow protocol=TCP localport=$Port" -ForegroundColor Cyan
    }
  }
}

function Ensure-NpmInstall {
  param([string]$Dir, [string]$Label)
  $nodeModules = Join-Path $Dir "node_modules"
  if (-not (Test-Path $nodeModules)) {
    Write-Host "Installing $Label dependencies (first run)..." -ForegroundColor Yellow
    Push-Location $Dir
    try {
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed in $Dir" }
    } finally {
      Pop-Location
    }
  }
}

function Start-DevWindow {
  param([string]$Dir, [string]$Title)
  Start-Process powershell -WorkingDirectory $Dir -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '$Title'; npm run dev"
}

$ip = Get-LanIp
if (-not $ip) {
  Write-Host "Could not detect a Wi-Fi/LAN IP. Connect to Wi-Fi and try again." -ForegroundColor Red
  exit 1
}

$serverDir = Join-Path $repoRoot "server"
$adminDir = Join-Path $repoRoot "admin"

Ensure-FirewallRule -Port 4000 -Name "QuizQuest API"
Ensure-FirewallRule -Port 3000 -Name "QuizQuest Admin"
Ensure-NpmInstall -Dir $serverDir -Label "server"
Ensure-NpmInstall -Dir $adminDir -Label "admin"

$questionCount = 0
try {
  Push-Location $serverDir
  $questionCount = node -e "import db from './src/db.js'; console.log(db.prepare('SELECT COUNT(*) c FROM questions').get().c);"
  Pop-Location
} catch {
  Pop-Location
}

if ([int]$questionCount -eq 0) {
  Write-Host "Question bank is empty — seeding (first run, ~10s)..." -ForegroundColor Yellow
  Push-Location $serverDir
  npm run seed
  Pop-Location
}

$apiRunning = Test-PortInUse -Port 4000
$adminRunning = Test-PortInUse -Port 3000

Write-Host ""
Write-Host "QuizQuest LAN access" -ForegroundColor Green
Write-Host "  Devices must be on the SAME Wi-Fi (not mobile data / guest Wi-Fi)"
Write-Host ""
Write-Host "  API:   http://${ip}:4000/"
Write-Host "  Admin: http://${ip}:3000/"
Write-Host ""
Write-Host "  Mobile app: set server URL to http://${ip}:4000 (Advanced on login screen)"
Write-Host "              or build with EXPO_PUBLIC_API_URL=http://${ip}:4000"
Write-Host ""

if ($apiRunning) {
  Write-Host "API already running on port 4000 — skipping." -ForegroundColor Yellow
} else {
  Write-Host "Starting API..." -ForegroundColor Green
  Start-DevWindow -Dir $serverDir -Title "QuizQuest API (:4000)"
}

if ($adminRunning) {
  Write-Host "Admin already running on port 3000 — skipping." -ForegroundColor Yellow
} else {
  Write-Host "Starting admin portal..." -ForegroundColor Green
  Start-DevWindow -Dir $adminDir -Title "QuizQuest Admin (:3000)"
}

Write-Host ""
if (-not $apiRunning -or -not $adminRunning) {
  Write-Host "Dev server window(s) opened." -ForegroundColor Green
} else {
  Write-Host "Both services were already running. Open the URLs above from other devices." -ForegroundColor Green
}
