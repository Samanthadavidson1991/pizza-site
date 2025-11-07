# PowerShell script to clean admin files from deployment and commit to git

# Set the deployment directory
$deployDir = "c:\Users\sammi\OneDrive\Desktop\pizza-site\public"
$repoDir = "c:\Users\sammi\OneDrive\Desktop\pizza-site"

# Remove admin files (html, js, css)
Write-Host "Removing admin files from deployment directory..."
Remove-Item "$deployDir\admin-*.html" -Force -ErrorAction SilentlyContinue
Remove-Item "$deployDir\admin-*.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$deployDir\admin-*.css" -Force -ErrorAction SilentlyContinue

# Change to repo directory
Set-Location $repoDir

# Stage all changes (including deletions)
Write-Host "Staging all changes..."
git add -A

# Commit
$commitMsg = "Remove admin files from public directory (automated)"
Write-Host "Committing changes..."
git commit -m $commitMsg

# Push
Write-Host "Pushing to origin main..."
git push origin main

Write-Host "Admin file cleanup and git sync complete."