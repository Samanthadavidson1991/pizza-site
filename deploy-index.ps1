# PowerShell script to deploy the latest index.html to the live site and push to git

# Set paths
$source = "c:\Users\sammi\OneDrive\Desktop\pizza website admin\index.html"
$destination = "c:\Users\sammi\OneDrive\Desktop\pizza-site\public\index.html"
$repoDir = "c:\Users\sammi\OneDrive\Desktop\pizza-site"

# Copy index.html to deployment directory
Write-Host "Copying index.html to deployment directory..."
Copy-Item $source $destination -Force

# Change to repo directory
Set-Location $repoDir

# Stage, commit, and push
Write-Host "Staging index.html..."
git add public/index.html

$commitMsg = "Deploy latest index.html to live site (automated)"
Write-Host "Committing changes..."
git commit -m $commitMsg

Write-Host "Pushing to origin main..."
git push origin main

Write-Host "index.html deployment and git sync complete."