const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let snowWindows = [];
let settingsWindow;
let tray = null;

function createSnowWindows() {
  const displays = screen.getAllDisplays();

  displays.forEach((display) => {
    const { x, y, width, height } = display.bounds;

    const win = new BrowserWindow({
      width,
      height,
      x,
      y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      focusable: false,
      hasShadow: false,
      title: '下雪特效',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    win.setIgnoreMouseEvents(true);
    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile('index.html');

    win.on('closed', () => {
      snowWindows = snowWindows.filter(w => w !== win);
    });

    snowWindows.push(win);
  });

  // 定时发送鼠标位置到所有窗口
  setInterval(() => {
    const point = screen.getCursorScreenPoint();
    snowWindows.forEach(win => {
      if (!win.isDestroyed()) {
        const bounds = win.getBounds();
        // 转换为窗口内相对坐标
        win.webContents.send('mouse-move', { x: point.x - bounds.x, y: point.y - bounds.y });
      }
    });
  }, 16);
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: '下雪特效设置',
    icon: path.join(__dirname, 'snow.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  settingsWindow.loadFile('settings.html');
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

ipcMain.on('update-settings', (event, settings) => {
  snowWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('settings-updated', settings);
    }
  });
});

ipcMain.on('minimize-app', () => {
  snowWindows.forEach(win => {
    if (!win.isDestroyed()) win.minimize();
  });
});

ipcMain.on('close-app', () => {
  app.quit();
});

app.whenReady().then(() => {
  // 创建托盘图标
  const icon = nativeImage.createFromPath(path.join(__dirname, 'snow.png'));
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '设置', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setToolTip('下雪特效');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => createSettingsWindow());

  createSnowWindows();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSnowWindows();
  }
});
