import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceApi } from '../shared/contracts';

// Sandboxed preload imports only Electron at runtime; each bridge method has a fixed channel.
const api: WorkspaceApi = {
  listProjects: () => ipcRenderer.invoke('workspace:listProjects'),
  createProject: (input) => ipcRenderer.invoke('workspace:createProject', input),
  openProject: (input) => ipcRenderer.invoke('workspace:openProject', input),
  addAction: (input) => ipcRenderer.invoke('workspace:addAction', input),
  completeAction: (input) => ipcRenderer.invoke('workspace:completeAction', input),
  saveCheckpoint: (input) => ipcRenderer.invoke('workspace:saveCheckpoint', input),
};

contextBridge.exposeInMainWorld('workspace', api);
