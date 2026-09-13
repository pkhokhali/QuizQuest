# ==============================================================================
# QuizQuest Server Manual Deployment Script
# ==============================================================================

param (
    [string]$VpsUser = "subisus3",
    [string]$VpsHost = "110.34.21.180",
    [string]$RemoteDir = "quizquest/server",
    [string]$ContainerName = "quizquest-server"
)

Write-Host ""
Write-Host "[DEPLOY] Deploying QuizQuest Server updates to $VpsUser@$VpsHost..." -ForegroundColor Cyan

# 1. Upload server/src directory to VPS host
Write-Host "[1/3] Uploading updated server/src/ to VPS host..." -ForegroundColor Yellow
scp -r "server/src" "$VpsUser@${VpsHost}:${RemoteDir}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SCP upload failed. Please check your SSH password or connection." -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Files copied to VPS host ($RemoteDir/src)!" -ForegroundColor Green

# 2. Copy updated src files into the Docker container
Write-Host "[2/3] Updating files inside container ($ContainerName)..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "docker cp ~/$RemoteDir/src ${ContainerName}:/app/"

# 3. Restart the Docker container so Node reloads the new code
Write-Host "[3/3] Restarting $ContainerName..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "docker restart $ContainerName"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Server deployment completed successfully!" -ForegroundColor Green
    Write-Host "[INFO] Daily Digest rotation, Zip randomization, and Reminder push endpoints are live." -ForegroundColor Cyan
} else {
    Write-Host "[WARNING] Please verify the container status with: docker ps" -ForegroundColor Yellow
}

