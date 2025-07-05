echo Set oWS = WScript.CreateObject("WScript.Shell") 
echo sLinkFile = "%USERPROFILE%\Desktop\POS System.lnk" 
echo Set oLink = oWS.CreateShortcut(sLinkFile) 
echo oLink.TargetPath = "C:\Program Files\POS-System\pos-system.exe" 
echo oLink.WorkingDirectory = "C:\Program Files\POS-System" 
echo oLink.Description = "POS System" 
echo oLink.Save 
