import { app, BrowserWindow, ipcMain, screen, desktopCapturer, globalShortcut, clipboard, nativeImage, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let captureWindowInstance: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png')
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function createCaptureWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  captureWindowInstance = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreen: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const captureUrl = isDev 
    ? 'http://localhost:3000#capture' 
    : `file://${path.join(__dirname, '../build/index.html#capture')}`;

  captureWindowInstance.loadURL(captureUrl);
  captureWindowInstance.show();

  captureWindowInstance.on('closed', () => {
    captureWindowInstance = null;
  });
}

app.on('ready', () => {
  createMainWindow();
  
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+3', () => {
    captureFullScreen();
  });
  
  globalShortcut.register('CommandOrControl+Shift+4', () => {
    captureRegion();
  });
  
  globalShortcut.register('CommandOrControl+Shift+5', () => {
    captureWindowType();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('capture-screen', async (event, options: { type: 'fullscreen' | 'window' | 'region' }) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (options.type === 'fullscreen') {
      const primarySource = sources.find(source => source.name === 'Entire Screen') || sources[0];
      return {
        id: primarySource.id,
        name: primarySource.name,
        thumbnail: primarySource.thumbnail.toDataURL()
      };
    }

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error('Error capturing screen:', error);
    throw error;
  }
});

ipcMain.handle('save-image', async (event, dataUrl: string, filename?: string) => {
  try {
    const image = nativeImage.createFromDataURL(dataUrl);
    const isJpeg = dataUrl.startsWith('data:image/jpeg');
    const defaultExt = isJpeg ? 'jpg' : 'png';

    const getBuffer = (filePath: string): Buffer => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        return image.toJPEG(90);
      }
      return image.toPNG();
    };

    if (filename) {
      const filePath = path.join(app.getPath('pictures'), filename);
      fs.writeFileSync(filePath, getBuffer(filePath));
      return filePath;
    } else {
      const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: path.join(app.getPath('pictures'), `screenshot.${defaultExt}`),
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, getBuffer(result.filePath));
        return result.filePath;
      }
    }
    return null;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
});

ipcMain.handle('copy-to-clipboard', (event, dataUrl: string) => {
  try {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
});

ipcMain.handle('show-capture-window', () => {
  if (captureWindowInstance) {
    captureWindowInstance.close();
  }
  createCaptureWindow();
});

ipcMain.handle('close-capture-window', () => {
  if (captureWindowInstance) {
    captureWindowInstance.close();
    captureWindowInstance = null;
  }
});

ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

// Capture functions
function captureFullScreen() {
  mainWindow?.webContents.send('capture-requested', { type: 'fullscreen' });
}

function captureRegion() {
  if (captureWindowInstance) {
    captureWindowInstance.close();
  }
  createCaptureWindow();
}

function captureWindowType() {
  mainWindow?.webContents.send('capture-requested', { type: 'window' });
}