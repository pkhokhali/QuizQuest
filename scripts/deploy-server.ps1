# ==============================================================================
# QuizQuest Server Manual Deployment Script
# ==============================================================================

param (
    [string]$VpsUser = "subisus3",
    [string]$VpsHost = "110.34.21.180",
    [string]$RemoteDir = "quizquest/server",
    [string]$ContainerName = "quizquest-server",
    [string]$IdentityFile = "$env:USERPROFILE\.ssh\school_mgmt_vps"
)

$sshArgs = @()
$scpArgs = @()

if (Test-Path $IdentityFile) {
    $sshArgs += @("-i", $IdentityFile)
    $scpArgs += @("-i", $IdentityFile)
}

Write-Host ""
Write-Host "[DEPLOY] Deploying QuizQuest Server updates to $VpsUser@$VpsHost..." -ForegroundColor Cyan

# 1. Upload server/src and server/seed directories to VPS host
Write-Host "[1/3] Uploading updated server/src/ and server/seed/ to VPS host..." -ForegroundColor Yellow
scp @scpArgs -r "server/src" "$VpsUser@${VpsHost}:${RemoteDir}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SCP upload for server/src failed." -ForegroundColor Red
    exit 1
}

scp @scpArgs -r "server/seed" "$VpsUser@${VpsHost}:${RemoteDir}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SCP upload for server/seed failed." -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Files copied to VPS host ($RemoteDir/src, $RemoteDir/seed)!" -ForegroundColor Green

# 2. Copy updated files into the Docker container
Write-Host "[2/3] Updating files inside container ($ContainerName)..." -ForegroundColor Yellow
ssh @sshArgs "$VpsUser@$VpsHost" "docker cp ~/$RemoteDir/src ${ContainerName}:/app/ && docker cp ~/$RemoteDir/seed ${ContainerName}:/app/"

# 3. Restart the Docker container so Node reloads the new code
Write-Host "[3/3] Restarting $ContainerName..." -ForegroundColor Yellow
ssh @sshArgs "$VpsUser@$VpsHost" "docker restart $ContainerName"

Start-Sleep -Seconds 3

# 4. Verify container status and logs
Write-Host "[VERIFY] Checking container status..." -ForegroundColor Yellow
ssh @sshArgs "$VpsUser@$VpsHost" "docker ps --filter name=${ContainerName} --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

Write-Host ""
Write-Host "[LOGS] Recent container logs:" -ForegroundColor Cyan
ssh @sshArgs "$VpsUser@$VpsHost" "docker logs --tail 10 ${ContainerName}"
