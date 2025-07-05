@echo off
echo Creating POS System Installer...

REM Create installer directory
if exist "installer" rmdir /s /q "installer"
mkdir installer

REM Copy the built application
echo Copying application files...
xcopy "out\*" "installer\POS-System\" /E /I /Y

REM Create a simple installer script
echo Creating installer script...
(
echo @echo off
echo echo Installing POS System...
echo echo.
echo if not exist "C:\Program Files\POS-System" mkdir "C:\Program Files\POS-System"
echo xcopy "POS-System\*" "C:\Program Files\POS-System\" /E /I /Y
echo echo.
echo echo Creating desktop shortcut...
echo echo Set oWS = WScript.CreateObject^("WScript.Shell"^) > CreateShortcut.vbs
echo echo sLinkFile = "%%USERPROFILE%%\Desktop\POS System.lnk" >> CreateShortcut.vbs
echo echo Set oLink = oWS.CreateShortcut^(sLinkFile^) >> CreateShortcut.vbs
echo echo oLink.TargetPath = "C:\Program Files\POS-System\pos-system.exe" >> CreateShortcut.vbs
echo echo oLink.WorkingDirectory = "C:\Program Files\POS-System" >> CreateShortcut.vbs
echo echo oLink.Description = "POS System" >> CreateShortcut.vbs
echo echo oLink.Save >> CreateShortcut.vbs
echo cscript //nologo CreateShortcut.vbs
echo del CreateShortcut.vbs
echo echo.
echo echo POS System has been installed successfully!
echo echo You can find it on your desktop or in C:\Program Files\POS-System
echo pause
) > installer\install.bat

REM Create a README for the installer
(
echo POS System v1.0.0
echo =================
echo.
echo Installation Instructions:
echo 1. Run install.bat as Administrator
echo 2. The application will be installed to C:\Program Files\POS-System
echo 3. A desktop shortcut will be created automatically
echo.
echo System Requirements:
echo - Windows 10 or later
echo - Node.js runtime ^(included^)
echo - Internet connection for database access
echo.
echo Default Login:
echo Owner: John Doe
echo PIN: 5222
echo.
echo For support, please contact your system administrator.
) > installer\README.txt

REM Create a zip file
echo Creating installer package...
powershell -command "Compress-Archive -Path 'installer\*' -DestinationPath 'POS-System-v1.0.0-Installer.zip' -Force"

echo.
echo Installer created successfully!
echo File: POS-System-v1.0.0-Installer.zip
echo.
pause 