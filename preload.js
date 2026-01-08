const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openSettings: () => ipcRenderer.send('open-settings'),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, settings) => callback(settings)),
  onMouseMove: (callback) => ipcRenderer.on('mouse-move', (event, point) => callback(point)),
  onWindowsInfo: (callback) => ipcRenderer.on('windows-info', (event, data) => callback(data)),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  saveSettings: (settings) => ipcRenderer.send('update-settings', settings)
});
