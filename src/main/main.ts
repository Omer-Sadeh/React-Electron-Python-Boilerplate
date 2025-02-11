/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { getAssetPath, resolveHtmlPath } from './util';
import { spawn } from 'child_process';
import fs from "fs";
import { getPort } from 'scotty-beam-me-up';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let loaderWindow: BrowserWindow | null = null;
let pyproc: any = null;
let pyport: number | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createLoaderWindow = async () => {
  loaderWindow = new BrowserWindow({
    width: 200,
    height: 200,
    icon: getAssetPath('icon.png'),
    transparent: true,
    frame: false,
    titleBarStyle: 'hidden',
    movable: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      devTools: false
    },
  });

  loaderWindow.setWindowButtonVisibility(false)
  loaderWindow.loadFile(getAssetPath('loader/loader.html'));
  loaderWindow.center();
  loaderWindow.show();
};

const createMainWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (loaderWindow !== null && !loaderWindow.isDestroyed()) {
      loaderWindow.close();
    }

    if (process.env.START_MINIMIZED) {
      mainWindow?.minimize();
    } else {
      mainWindow?.show();
    }
    mainWindow?.center();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

const startPythonBackend = async () => {
  for (let i = 0; i < 10; i++) {
    try {
      pyport = await getPort({ port: 5000 });
      break;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 500));
      pyport = null;
    }
  }
  if (pyport === null) {
    dialog.showErrorBox("Error", "Failed to start app, please try again later.");
    app.quit();
  }
  ipcMain.on('ipc-port', async (event, arg) => {
    event.returnValue = pyport;
  });

  pyproc = null;
  let pythonPath = process.env.NODE_ENV !== 'development' ? path.join(__dirname, '../../..', 'pythondist/app/app') : "backend/app.py"

  if (fs.existsSync(pythonPath)) {
    if (process.env.NODE_ENV === 'development') {
      pyproc = spawn(`python3 ` + pythonPath + ` ${pyport}`, {
        detached: false,
        shell: true,
        stdio: 'inherit'
      });
    } else {
      const serverCmd = process.platform === 'win32' ? 'start ' + pythonPath + '.exe' : pythonPath;
      pyproc = spawn(serverCmd + ` ${pyport}`, { detached: false, shell: true, stdio: 'pipe' });
    }

    if (pyproc === null || pyproc == undefined) {
      dialog.showErrorBox("Error", "Failed to start Python backend.");
      app.quit();
    }
  } else {
    dialog.showErrorBox("Error", "Python backend not found.");
    app.quit();
  }
};

const testPythonBackend = async () => {
  let tries = 10;
  let response = null;
  while (response === null && tries > 0) {
    try {
      response = await fetch(`http://localhost:${pyport}/check_initialization`);
    } catch (err) {
      tries--;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (response == null || response.status !== 200) {
    console.log("Failed to connect to Python backend: " + response);
    dialog.showErrorBox("Error", "Error while loading application. Please try again.");
    app.quit();
  } else {
    let res = await response.json();
    if (res.up) {
      console.log("Python backend started successfully.");
    } else {
      console.log("Failed to connect to Python backend: " + res.message);
      dialog.showErrorBox("Error", "Error while loading application. Please try again.");
      app.quit();
    }
  }
};

/**
 * Add event listeners...
 */

app.whenReady()
  .then(async () => {
    await createLoaderWindow();
    await startPythonBackend().then(testPythonBackend);
    createMainWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createMainWindow();
    });

    app.on('window-all-closed', () => {
      // Respect the OSX convention of having the application in memory even
      // after all windows have been closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      pyproc?.kill();
    });
  })
  .catch(console.log);
