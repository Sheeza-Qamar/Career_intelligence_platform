# Script to fix secrets and push to GitHub
# Run this script AFTER closing Cursor completely

Write-Host "Removing git lock file..." -ForegroundColor Yellow
Remove-Item -Force .git\index.lock -ErrorAction SilentlyContinue

Write-Host "Adding DEPLOYMENT_GUIDE.md..." -ForegroundColor Yellow
git add DEPLOYMENT_GUIDE.md

Write-Host "Amending commit to remove secrets..." -ForegroundColor Yellow
git commit --amend --no-edit

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "Done! Secrets removed and pushed successfully." -ForegroundColor Green
