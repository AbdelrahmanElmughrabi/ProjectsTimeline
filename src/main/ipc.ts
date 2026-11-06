import { ipcMain, type BrowserWindow } from 'electron';
import type { WorkspaceApi } from '../shared/contracts';
import { AppError, operationResult } from './domain';
import type { WorkspaceStore } from './data/database';
import { trustedSender } from './security';

// Review: every channel checks the originating window and its top-level document before touching storage.
export function registerWorkspaceIpc(window: BrowserWindow, store: WorkspaceStore): void {
  const operations = {
    listProjects: () => store.listProjects(),
    createProject: (input: unknown) => store.createProject(input),
    openProject: (input: unknown) => store.openProject(input),
    addAction: (input: unknown) => store.addAction(input),
    completeAction: (input: unknown) => store.completeAction(input),
    reopenAction: (input: unknown) => store.reopenAction(input),
    createRelease: (input: unknown) => store.createRelease(input),
    getWorkflowLibrary: () => store.getWorkflowLibrary(),
    duplicateWorkflowTemplate: (input: unknown) => store.duplicateWorkflowTemplate(input),
    assignAction: (input: unknown) => store.assignAction(input),
    setActionExclusion: (input: unknown) => store.setActionExclusion(input),
    setStageExclusion: (input: unknown) => store.setStageExclusion(input),
    recordReleaseVerification: (input: unknown) => store.recordReleaseVerification(input),
    confirmRelease: (input: unknown) => store.confirmRelease(input),
    saveCheckpoint: (input: unknown) => store.saveCheckpoint(input),
  } satisfies Record<keyof WorkspaceApi, (input: unknown) => unknown>;
  for (const [name, operation] of Object.entries(operations)) {
    ipcMain.handle(`workspace:${name}`, (event, input: unknown) => operationResult(() => {
      const frame = event.senderFrame;
      if (!trustedSender(event.sender.id, frame, window.webContents.id, window.webContents.mainFrame, frame?.url ?? '')) {
        throw new AppError('FORBIDDEN', 'This window cannot access the workspace.');
      }
      return operation(input);
    }));
  }
}
