@echo off
echo Setting GitHub Personal Access Token...
echo.

set /p token="Please enter your GitHub Personal Access Token: "

set GITHUB_TOKEN=%token%

echo.
echo Token set successfully!
echo You can now run: npm run dist:win
echo Note: The token will be used for publishing updates to GitHub releases.
echo.
pause 