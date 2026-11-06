// Isolated design viewer: no production app import, preload, IPC or SQLite.
const { app, BrowserWindow, session } = require('electron');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../../../artifacts/v3-visual-prototype');
const profile = path.join(output, 'viewer-profile');
mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
globalThis.designConsoleErrors = [];
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_, done) => done({ cancel: true }));
  const win = new BrowserWindow({ width: 1540, height: 1040, show: process.env.DESIGN_HEADLESS !== '1', backgroundColor: '#101219',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('console-message', (_event, details) => {
    if (details.level === 'error') globalThis.designConsoleErrors.push(details.message);
  });
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile(path.join(output, 'build/index.html'));
});
app.on('window-all-closed', () => app.quit());
