Write-Host "Setting GitHub Personal Access Token..." -ForegroundColor Green
Write-Host ""

$token = Read-Host "Please enter your GitHub Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:GH_TOKEN = $plainToken

Write-Host ""
Write-Host "Token set successfully!" -ForegroundColor Green
Write-Host "You can now run: npm run dist:win" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: This token will only be available in the current PowerShell session." -ForegroundColor Cyan
Write-Host "To make it permanent, add it to your system environment variables." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue" 