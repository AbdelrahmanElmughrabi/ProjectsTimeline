import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceApi } from '../shared/contracts';

// Sandboxed preload imports only Electron at runtime; each bridge method has a fixed channel.
const api: WorkspaceApi = {
  chooseBlueprintPreview: () => ipcRenderer.invoke('workspace:chooseBlueprintPreview'),
  refreshBlueprintPreview: (input) => ipcRenderer.invoke('workspace:refreshBlueprintPreview', input),
  cancelBlueprintPreview: () => ipcRenderer.invoke('workspace:cancelBlueprintPreview'),
  listProjects: () => ipcRenderer.invoke('workspace:listProjects'),
  getHomeSummary: () => ipcRenderer.invoke('workspace:getHomeSummary'),
  createProject: (input) => ipcRenderer.invoke('workspace:createProject', input),
  openProject: (input) => ipcRenderer.invoke('workspace:openProject', input),
  addAction: (input) => ipcRenderer.invoke('workspace:addAction', input),
  completeAction: (input) => ipcRenderer.invoke('workspace:completeAction', input),
  reopenAction: (input) => ipcRenderer.invoke('workspace:reopenAction', input),
  createRelease: (input) => ipcRenderer.invoke('workspace:createRelease', input),
  getWorkflowLibrary: () => ipcRenderer.invoke('workspace:getWorkflowLibrary'),
  duplicateWorkflowTemplate: (input) => ipcRenderer.invoke('workspace:duplicateWorkflowTemplate', input),
  createWorkflowTemplate: (input) => ipcRenderer.invoke('workspace:createWorkflowTemplate', input),
  updateWorkflowTemplate: (input) => ipcRenderer.invoke('workspace:updateWorkflowTemplate', input),
  addWorkflowStage: (input) => ipcRenderer.invoke('workspace:addWorkflowStage', input),
  updateWorkflowStage: (input) => ipcRenderer.invoke('workspace:updateWorkflowStage', input),
  reorderWorkflowStages: (input) => ipcRenderer.invoke('workspace:reorderWorkflowStages', input),
  removeWorkflowStage: (input) => ipcRenderer.invoke('workspace:removeWorkflowStage', input),
  addWorkflowAction: (input) => ipcRenderer.invoke('workspace:addWorkflowAction', input),
  updateWorkflowAction: (input) => ipcRenderer.invoke('workspace:updateWorkflowAction', input),
  reorderWorkflowActions: (input) => ipcRenderer.invoke('workspace:reorderWorkflowActions', input),
  removeWorkflowAction: (input) => ipcRenderer.invoke('workspace:removeWorkflowAction', input),
  updateReleaseAction: (input) => ipcRenderer.invoke('workspace:updateReleaseAction', input),
  reorderReleaseActions: (input) => ipcRenderer.invoke('workspace:reorderReleaseActions', input),
  addReleaseStage: (input) => ipcRenderer.invoke('workspace:addReleaseStage', input),
  updateReleaseStage: (input) => ipcRenderer.invoke('workspace:updateReleaseStage', input),
  reorderReleaseStages: (input) => ipcRenderer.invoke('workspace:reorderReleaseStages', input),
  assignAction: (input) => ipcRenderer.invoke('workspace:assignAction', input),
  setActionExclusion: (input) => ipcRenderer.invoke('workspace:setActionExclusion', input),
  setStageExclusion: (input) => ipcRenderer.invoke('workspace:setStageExclusion', input),
  recordReleaseVerification: (input) => ipcRenderer.invoke('workspace:recordReleaseVerification', input),
  confirmRelease: (input) => ipcRenderer.invoke('workspace:confirmRelease', input),
  saveCheckpoint: (input) => ipcRenderer.invoke('workspace:saveCheckpoint', input),
};

contextBridge.exposeInMainWorld('workspace', api);
