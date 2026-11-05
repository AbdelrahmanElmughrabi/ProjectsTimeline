import { app, BrowserWindow, dialog, protocol, session } from 'electron';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, extname, isAbsolute } from 'node:path';
import { openStore, type WorkspaceStore } from './data/database';
import { registerWorkspaceIpc } from './ipc';
import { appUrl, contentSecurityPolicy, rendererAsset } from './security';

app.setName('ProjectsTimeline');
// Explicit data directories are a main-process launch option for isolated tests and local troubleshooting.
const override = process.argv.find((arg) => arg.startsWith('--data-dir='))?.slice('--data-dir='.length);
if (override && !isAbsolute(override)) throw new Error('--data-dir must be an absolute path.');
const dataDirectory = override ?? join(app.getPath('appData'), 'ProjectsTimeline');
mkdirSync(dataDirectory, { recursive: true });
app.setPath('userData', dataDirectory);
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

let window: BrowserWindow | undefined;
let store: WorkspaceStore | undefined;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.show();
    window?.focus();
  });
  app.whenReady().then(async () => {
    const databasePath = join(app.getPath('userData'), 'data', 'workspace.sqlite');
    try {
      store = await openStore(databasePath);
      const rendererDirectory = join(__dirname, '../renderer');
      protocol.handle('app', async (request) => {
        const path = rendererAsset(request.url, rendererDirectory);
        if (!path || request.method !== 'GET') return new Response('Not found', { status: 404 });
        try {
          const contentTypes: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
          return new Response(await readFile(path), { headers: {
            'Content-Type': `${contentTypes[extname(path)]}; charset=utf-8`,
            'Content-Security-Policy': contentSecurityPolicy,
            'X-Content-Type-Options': 'nosniff',
          } });
        } catch {
          return new Response('Not found', { status: 404 });
        }
      });
      session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
      session.defaultSession.setPermissionCheckHandler(() => false);
      window = new BrowserWindow({
        width: 1160, height: 820, minWidth: 780, minHeight: 600,
        title: 'ProjectsTimeline', backgroundColor: '#f5f4ee', show: false,
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          contextIsolation: true, nodeIntegration: false, sandbox: true,
        },
      });
      window.removeMenu();
      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', (event, url) => { if (url !== appUrl) event.preventDefault(); });
      window.webContents.on('will-attach-webview', (event) => event.preventDefault());
      registerWorkspaceIpc(window, store);
      window.once('ready-to-show', () => window?.show());
      await window.loadURL(appUrl);
    } catch (error) {
      console.error('Workspace startup failed:', error);
      dialog.showErrorBox('ProjectsTimeline could not start', `Your database has not been reset.\n\n${String(error)}\n\nDatabase: ${databasePath}`);
      app.quit();
    }
  }).catch((error) => {
    console.error(error);
    app.quit();
  });
}

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => store?.close());
