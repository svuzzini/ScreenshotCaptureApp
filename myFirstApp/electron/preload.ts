import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Screenshot capture
  captureScreen: (options: { type: 'fullscreen' | 'window' | 'region' }) =>
    ipcRenderer.invoke('capture-screen', options),
  
  // File operations
  saveImage: (dataUrl: string, filename?: string) =>
    ipcRenderer.invoke('save-image', dataUrl, filename),
  
  copyToClipboard: (dataUrl: string) =>
    ipcRenderer.invoke('copy-to-clipboard', dataUrl),
  
  // Window management
  showCaptureWindow: () =>
    ipcRenderer.invoke('show-capture-window'),
  
  closeCaptureWindow: () =>
    ipcRenderer.invoke('close-capture-window'),
  
  getScreenSize: () =>
    ipcRenderer.invoke('get-screen-size'),
  
  // Event listeners
  onCaptureRequested: (callback: (data: any) => void) =>
    ipcRenderer.on('capture-requested', (event, data) => callback(data)),
  
  removeCaptureListener: () =>
    ipcRenderer.removeAllListeners('capture-requested'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;