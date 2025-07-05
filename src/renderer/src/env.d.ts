/// <reference types="vite/client" />

interface Window {
  electron: {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      // add other methods if needed
    };
    process: {
      versions: {
        electron: string;
        chrome: string;
        node: string;
        [key: string]: string;
      };
    };
  };
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
