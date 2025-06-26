const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  // Screenshot capture
  captureScreen: (options) =>
    ipcRenderer.invoke('capture-screen', options),
  
  // File operations
  saveImage: (dataUrl, filename) =>
    ipcRenderer.invoke('save-image', dataUrl, filename),
  
  copyToClipboard: (dataUrl) =>
    ipcRenderer.invoke('copy-to-clipboard', dataUrl),
  
  // Window management
  showCaptureWindow: () =>
    ipcRenderer.invoke('show-capture-window'),
  
  closeCaptureWindow: () =>
    ipcRenderer.invoke('close-capture-window'),
  
  getScreenSize: () =>
    ipcRenderer.invoke('get-screen-size'),
  
  // Event listeners
  onCaptureRequested: (callback) =>
    ipcRenderer.on('capture-requested', (event, data) => callback(data)),
  
  removeCaptureListener: () =>
    ipcRenderer.removeAllListeners('capture-requested'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);