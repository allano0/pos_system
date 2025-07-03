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
}
