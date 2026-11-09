import { dialog, ipcMain, type BrowserWindow } from 'electron';
import type { WorkspaceApi } from '../shared/contracts';
import { AppError, operationResult } from './domain';
import type { WorkspaceStore } from './data/database';
import { trustedSender } from './security';
import { BlueprintPreviewSession } from './blueprint/session';

// Review: every channel checks the originating window and its top-level document before touching storage.
export function registerWorkspaceIpc(window: BrowserWindow, store: WorkspaceStore): void {
  const preview = new BlueprintPreviewSession(async () => {
    const choice = await dialog.showOpenDialog(window, { title: 'Preview a ProjectsTimeline blueprint', filters: [{ name: 'Markdown blueprint', extensions: ['md'] }], properties: ['openFile', 'dontAddToRecent'] });
    return choice.canceled ? null : choice.filePaths[0] ?? null;
  }, () => store.getWorkflowLibrary().flatMap(({ template }) => template.builtInKey ? [{ key: template.builtInKey, version: template.version }] : []));
  window.once('closed', () => preview.cancel());
  const operations = {
    prepareKnowledgeFormation: (input: unknown) => preview.prepareKnowledgeFormation(input, store),
    applyKnowledgeFormation: (input: unknown) => preview.applyKnowledgeFormation(input, store),
    openKnowledgeWorkspace: (input: unknown) => store.openKnowledgeWorkspace(input),
    getKnowledgeRecord: (input: unknown) => store.getKnowledgeRecord(input),
    getKnowledgeSource: (input: unknown) => store.getKnowledgeSource(input),
    chooseBlueprintPreview: (input: unknown) => preview.choose(input),
    refreshBlueprintPreview: (input: unknown) => preview.refresh(input),
    cancelBlueprintPreview: (input: unknown) => preview.cancel(input),
    listProjects: () => store.listProjects(),
    getHomeSummary: () => store.getHomeSummary(),
    createProject: (input: unknown) => store.createProject(input),
    openProject: (input: unknown) => store.openProject(input),
    addAction: (input: unknown) => store.addAction(input),
    completeAction: (input: unknown) => store.completeAction(input),
    reopenAction: (input: unknown) => store.reopenAction(input),
    createRelease: (input: unknown) => store.createRelease(input),
    getWorkflowLibrary: () => store.getWorkflowLibrary(),
    duplicateWorkflowTemplate: (input: unknown) => store.duplicateWorkflowTemplate(input),
    createWorkflowTemplate: (input: unknown) => store.createWorkflowTemplate(input),
    updateWorkflowTemplate: (input: unknown) => store.updateWorkflowTemplate(input),
    addWorkflowStage: (input: unknown) => store.addWorkflowStage(input),
    updateWorkflowStage: (input: unknown) => store.updateWorkflowStage(input),
    reorderWorkflowStages: (input: unknown) => store.reorderWorkflowStages(input),
    removeWorkflowStage: (input: unknown) => store.removeWorkflowStage(input),
    addWorkflowAction: (input: unknown) => store.addWorkflowAction(input),
    updateWorkflowAction: (input: unknown) => store.updateWorkflowAction(input),
    reorderWorkflowActions: (input: unknown) => store.reorderWorkflowActions(input),
    removeWorkflowAction: (input: unknown) => store.removeWorkflowAction(input),
    updateReleaseAction: (input: unknown) => store.updateReleaseAction(input),
    reorderReleaseActions: (input: unknown) => store.reorderReleaseActions(input),
    addReleaseStage: (input: unknown) => store.addReleaseStage(input),
    updateReleaseStage: (input: unknown) => store.updateReleaseStage(input),
    reorderReleaseStages: (input: unknown) => store.reorderReleaseStages(input),
    assignAction: (input: unknown) => store.assignAction(input),
    setActionExclusion: (input: unknown) => store.setActionExclusion(input),
    setStageExclusion: (input: unknown) => store.setStageExclusion(input),
    recordReleaseVerification: (input: unknown) => store.recordReleaseVerification(input),
    confirmRelease: (input: unknown) => store.confirmRelease(input),
    saveCheckpoint: (input: unknown) => store.saveCheckpoint(input),
  } satisfies Record<keyof WorkspaceApi, (input: unknown) => unknown>;
  for (const [name, operation] of Object.entries(operations)) {
    ipcMain.handle(`workspace:${name}`, (event, input: unknown) => operationResult<unknown>(() => {
      const frame = event.senderFrame;
      if (!trustedSender(event.sender.id, frame, window.webContents.id, window.webContents.mainFrame, frame?.url ?? '')) {
        throw new AppError('FORBIDDEN', 'This window cannot access the workspace.');
      }
      return operation(input);
    }));
  }
}
