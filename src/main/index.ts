import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'
import { autoUpdater } from 'electron-updater'
import { existsSync } from 'fs'

let backendProcess: ReturnType<typeof spawn> | null = null

// Configure auto updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Add additional configuration for better error handling
autoUpdater.logger = console

// Set request headers to avoid some common issues
autoUpdater.requestHeaders = {
  'User-Agent': 'Supermax-POS-Updater'
}

// Update events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...')
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info)
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. Would you like to download it now?',
    buttons: ['Yes', 'No'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
    }
  })
})

autoUpdater.on('update-not-available', () => {
  console.log('Update not available')
})

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err)
  
  // Filter out common network and server errors that shouldn't show to users
  const errorMessage = err.message || 'Unknown error'
  
  if (errorMessage.includes('404') || 
      errorMessage.includes('ENOTFOUND') || 
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('null byte') ||
      errorMessage.includes('Unexpected token') ||
      errorMessage.includes('Invalid JSON')) {
    console.log('Update server not available or response malformed, skipping update check:', errorMessage)
    return
  }
  
  // Only show critical errors to users
  if (errorMessage.includes('EACCES') || errorMessage.includes('EPERM')) {
    dialog.showErrorBox('Update Error', 'Permission denied when checking for updates. Please run the application as administrator.')
  } else if (!errorMessage.includes('network') && !errorMessage.includes('timeout')) {
    dialog.showErrorBox('Update Error', 'Error checking for updates: ' + errorMessage)
  }
})

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info)
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will restart to install the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})

function startBackend() {
  try {
    // Determine the correct path for the backend
    const backendPath = is.dev 
      ? join(process.cwd(), 'backend', 'server.js')
      : join(__dirname, '..', 'backend', 'server.js')
    
    console.log('Starting backend at:', backendPath)
    
    // Check if the backend file exists
    if (!existsSync(backendPath)) {
      console.error('Backend file not found at:', backendPath)
      return
    }
    
    // Use proper path handling for Windows with spaces
    const nodeCommand = process.platform === 'win32' ? 'node.exe' : 'node'
    
    // For Windows, use shell to handle paths with spaces properly
    if (process.platform === 'win32') {
      // On Windows, use shell to handle paths with spaces
      backendProcess = spawn(`"${nodeCommand}" "${backendPath}"`, [], {
        stdio: 'inherit' as const,
        shell: true,
        cwd: is.dev ? process.cwd() : join(__dirname, '..') // Set working directory
      })
    } else {
      // On other platforms, use direct spawn
      backendProcess = spawn(nodeCommand, [backendPath], {
        stdio: 'inherit' as const,
        shell: false,
        cwd: is.dev ? process.cwd() : join(__dirname, '..') // Set working directory
      })
    }

    if (backendProcess) {
      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`)
      })

      backendProcess.on('error', (error) => {
        console.error('Backend process error:', error)
      })
    }
  } catch (error) {
    console.error('Error starting backend:', error)
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // IPC handler for direct printing
  ipcMain.handle('print-receipt', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      return new Promise((resolve, reject) => {
        win.webContents.print(
          {
            silent: true,
            printBackground: true,
            pageSize: 'A4', // Print on A4 paper
          },
          (success, errorType) => {
            if (!success) reject(errorType);
            else resolve('printed');
          }
        );
      });
    }
    return Promise.reject('No window found');
  });

  // IPC handler to list available printers
  ipcMain.handle('list-printers', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      console.log('webContents methods:', Object.keys(win.webContents));
      // @ts-ignore
      return win.webContents.getPrinters();
    }
    return [];
  });

  // IPC handler for printing only the receipt content in a new window
  ipcMain.handle('print-receipt-content', async (_, html) => {
    return new Promise((resolve, reject) => {
      const printWindow = new BrowserWindow({
        width: 800,
        height: 1120, // A4 aspect ratio
        show: false,
        webPreferences: {
          sandbox: false,
        },
      });
      // Load the HTML as a data URL
      printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
          <head>
            <style>
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `));
      printWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
          printWindow.webContents.print({
            silent: true,
            printBackground: true,
            pageSize: 'A4',
          }, (success, errorType) => {
            setTimeout(() => {
              printWindow.close();
            }, 3000); // Close after 3 seconds
            if (!success) reject(errorType);
            else resolve('printed');
          });
        }, 500); // Wait a bit for rendering
      });
    });
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, result }
    } catch (error) {
      console.error('Error checking for updates:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Filter out common errors that shouldn't be shown to users
      if (errorMessage.includes('404') || 
          errorMessage.includes('ENOTFOUND') || 
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('null byte') ||
          errorMessage.includes('Unexpected token') ||
          errorMessage.includes('Invalid JSON')) {
        return { success: false, error: 'Update server not available' }
      }
      
      return { success: false, error: errorMessage }
    }
  })

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      console.error('Error downloading update:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall()
    return { success: true }
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  startBackend()

  createWindow()

  // Check for updates on app start (only in production)
  if (!is.dev && process.env.DISABLE_AUTO_UPDATE !== 'true') {
    setTimeout(() => {
      autoUpdater.checkForUpdates()
    }, 3000) // Check after 3 seconds
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
