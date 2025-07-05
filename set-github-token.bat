@echo off
echo Setting GitHub Personal Access Token...
echo.
echo Please enter your GitHub Personal Access Token:
set /p GH_TOKEN=
echo.
echo Token set successfully!
echo You can now run: npm run dist:win
echo.
pause 