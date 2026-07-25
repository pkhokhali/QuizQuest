# Start QuizQuest API so phones on the same Wi-Fi can connect.
# Run from repo root: .\scripts\start-for-mobile.ps1
# (Run PowerShell as Administrator once if the firewall rule is missing.)

$ErrorActionPreference = "Stop"
$ruleName = "QuizQuest API"

function Get-LanIp {
  (Get-NetIPConfiguration | Where-Object {
    $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up"
  } | Select-Object -First 1).IPv4Address.IPAddress
}

$ip = Get-LanIp
if (-not $ip) {
  Write-Host "Could not detect a Wi-Fi/LAN IP. Connect to Wi-Fi and try again." -ForegroundColor Red
  exit 1
}

$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Adding firewall rule for TCP port 4000 (needs Administrator)..." -ForegroundColor Yellow
  netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=4000 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not add firewall rule. Right-click PowerShell -> Run as administrator, then run:" -ForegroundColor Red
    Write-Host "  netsh advfirewall firewall add rule name=`"QuizQuest API`" dir=in action=allow protocol=TCP localport=4000" -ForegroundColor Cyan
  }
}

Write-Host ""
Write-Host "QuizQuest mobile setup" -ForegroundColor Green
Write-Host "  1. Phone must be on the SAME Wi-Fi (not mobile data / guest Wi-Fi)"
Write-Host "  2. On the phone browser, open:  http://${ip}:4000/"
Write-Host "     You should see JSON with `"ok`":true"
Write-Host "  3. Use the APK built with APP_API_URL = http://${ip}:4000"
Write-Host ""
Write-Host "Starting API on http://0.0.0.0:4000 ..." -ForegroundColor Green
Write-Host ""

Set-Location (Join-Path $PSScriptRoot "..\server")
npm run dev
