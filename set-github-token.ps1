# PowerShell script to set GitHub token for electron-builder
# Run this script before building the application

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

# Set the environment variable for the current session
$env:GITHUB_TOKEN = $Token

# Also set it for the user profile (persistent)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $Token, "User")

Write-Host "GitHub token set successfully!" -ForegroundColor Green
Write-Host "You can now run: npm run dist:win" -ForegroundColor Yellow
Write-Host "Note: The token will be used for publishing updates to GitHub releases." -ForegroundColor Cyan 