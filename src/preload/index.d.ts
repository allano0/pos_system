import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      printReceipt: () => Promise<any>
      listPrinters: () => Promise<any>
      printReceiptContent: (html: string) => Promise<any>
      checkForUpdates: () => Promise<{ success: boolean; result?: any; error?: string }>
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>
      installUpdate: () => Promise<{ success: boolean }>
      getAppVersion: () => Promise<string>
    }
  }
}
