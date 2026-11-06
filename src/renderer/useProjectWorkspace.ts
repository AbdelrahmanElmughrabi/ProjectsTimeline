import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionDefinitionInput, Project, ProjectDetail, Result } from '../shared/contracts';

type Operation = 'create' | 'open' | 'action' | 'complete' | 'checkpoint' | 'release' | 'refresh' | null;
type Notice = { kind: 'success' | 'error' | 'warning'; text: string } | null;

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export function useProjectWorkspace() {
  const api = window.workspace;
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState<Operation>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [stale, setStale] = useState(false);
  const mounted = useRef(false);
  const selected = useRef<number | null>(null);
  const request = useRef(0);
  const listRequest = useRef(0);
  const listLoading = useRef(true);
  const operation = useRef<Operation>(null);

  function setOperation(value: Operation) {
    operation.current = value;
    setBusy(value);
  }

  function current(token: number, projectId: number | null): boolean {
    return mounted.current && request.current === token && selected.current === projectId;
  }

  const loadProjects = useCallback(async (): Promise<boolean> => {
    const token = ++listRequest.current;
    listLoading.current = true;
    setLoading(true);
    setListError('');
    try {
      const rows = unwrap(await api.listProjects());
      if (!mounted.current || token !== listRequest.current) return false;
      setProjects(rows);
      return true;
    } catch (error) {
      if (mounted.current && token === listRequest.current) {
        setListError(error instanceof Error ? error.message : 'Could not load projects.');
      }
      return false;
    } finally {
      if (mounted.current && token === listRequest.current) {
        listLoading.current = false;
        setLoading(false);
      }
    }
  }, [api]);

  useEffect(() => {
    mounted.current = true;
    void loadProjects();
    return () => {
      mounted.current = false;
      request.current++;
      listRequest.current++;
    };
  }, [loadProjects]);

  async function readProject(projectId: number, token: number): Promise<boolean> {
    const snapshot = unwrap(await api.openProject({ projectId }));
    if (!current(token, projectId)) return false;
    setDetail(snapshot);
    setStale(false);
    return true;
  }

  async function openProject(projectId: number): Promise<void> {
    // A new selection may supersede an earlier read, but cannot interrupt a write/refresh.
    if ((operation.current !== null && operation.current !== 'open') || listLoading.current) return;
    selected.current = projectId;
    setSelectedId(projectId);
    const token = ++request.current;
    setDetail(null);
    setStale(false);
    setNotice(null);
    setOperation('open');
    try {
      await readProject(projectId, token);
    } catch (error) {
      if (current(token, projectId)) setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not open project.' });
    } finally {
      if (current(token, projectId)) setOperation(null);
    }
  }

  // Review: commit acknowledgement and subsequent read have separate failure semantics.
  async function execute(name: Exclude<Operation, 'open' | 'refresh' | null>, command: () => Promise<Result<unknown>>, message: string): Promise<boolean> {
    if (operation.current !== null || listLoading.current || stale) return false;
    const projectId = selected.current;
    if (name !== 'create' && (!detail || detail.project.id !== projectId)) return false;
    const token = ++request.current;
    setOperation(name);
    setNotice(null);
    let committed = false;
    try {
      unwrap(await command());
      committed = true;
      if (!current(token, projectId)) return true;
      setStale(projectId !== null);
      setNotice({ kind: 'success', text: 'Saved. Refreshing workspace…' });
      if (name === 'create' && !await loadProjects()) throw new Error('Could not load the project list.');
      if (projectId !== null) await readProject(projectId, token);
      if (current(token, projectId)) setNotice({ kind: 'success', text: message });
    } catch (error) {
      if (current(token, projectId)) {
        if (committed) {
          setStale(projectId !== null);
          setNotice({ kind: 'warning', text: 'Saved, but could not refresh. Retry loading to read the saved data; the save will not be repeated.' });
        } else {
          setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not confirm the save.' });
        }
      }
    } finally {
      if (current(token, projectId)) setOperation(null);
    }
    return committed;
  }

  async function retryLoading(): Promise<void> {
    if (operation.current !== null || listLoading.current) return;
    const projectId = selected.current;
    const token = ++request.current;
    setOperation('refresh');
    setNotice(null);
    try {
      if (listError && !await loadProjects()) throw new Error('Could not load the project list.');
      if (projectId !== null) await readProject(projectId, token);
      if (current(token, projectId)) setNotice({ kind: 'success', text: projectId === null ? 'Projects loaded.' : 'Workspace refreshed.' });
    } catch {
      if (current(token, projectId)) {
        setStale(projectId !== null);
        setNotice({ kind: 'error', text: 'Saved data could not be reloaded. No save was repeated; you can retry loading.' });
      }
    } finally {
      if (current(token, projectId)) setOperation(null);
    }
  }

  return {
    projects, detail, selectedId, loading, listError, busy, notice, stale,
    openProject, retryLoading,
    createProject: (name: string) => execute('create', () => api.createProject({ name }), 'Project created.'),
    addAction: (title: string) => execute('action', () => api.addAction({ projectId: selected.current!, title }), 'Action added.'),
    completeAction: (actionId: number) => execute('complete', () => api.completeAction({ projectId: selected.current!, actionId }), 'Action completed.'),
    reopenAction: (actionId: number) => execute('release', () => api.reopenAction({ projectId: selected.current!, actionId }), 'Action reopened.'),
    createRelease: (name: string, templateId?: number, templateVersion?: number) => execute('release', () => api.createRelease({ projectId: selected.current!, name, ...(templateId !== undefined && templateVersion !== undefined ? { templateId, templateVersion } : {}) }), 'Release created.'),
    updateReleaseAction: (actionId: number, definition: ActionDefinitionInput) => execute('release', () => api.updateReleaseAction({ projectId: selected.current!, actionId, ...definition }), 'Release action details saved.'),
    reorderReleaseActions: (releaseId: number, stageId: number, actionIds: number[]) => execute('release', () => api.reorderReleaseActions({ projectId: selected.current!, releaseId, stageId, actionIds }), 'Release action order saved.'),
    addReleaseStage: (releaseId: number, name: string) => execute('release', () => api.addReleaseStage({ projectId: selected.current!, releaseId, name }), 'Release stage added.'),
    updateReleaseStage: (releaseId: number, stageId: number, name: string) => execute('release', () => api.updateReleaseStage({ projectId: selected.current!, releaseId, stageId, name }), 'Release stage renamed.'),
    reorderReleaseStages: (releaseId: number, stageIds: number[]) => execute('release', () => api.reorderReleaseStages({ projectId: selected.current!, releaseId, stageIds }), 'Release stage order saved.'),
    assignAction: (actionId: number, releaseId: number, stageId: number | null) => execute('release', () => api.assignAction({ projectId: selected.current!, actionId, releaseId, stageId }), 'Action scope saved.'),
    setActionExclusion: (actionId: number, reason: string | null) => execute('release', () => api.setActionExclusion({ projectId: selected.current!, actionId, reason }), reason ? 'Action exclusion saved.' : 'Action restored to scope.'),
    setStageExclusion: (releaseId: number, stageId: number, reason: string | null) => execute('release', () => api.setStageExclusion({ projectId: selected.current!, releaseId, stageId, reason }), reason ? 'Stage exclusion saved.' : 'Stage restored to scope.'),
    recordReleaseVerification: (releaseId: number, artifactIdentity: string, evidenceReference: string, summary: string, outcome: 'passed' | 'failed') => execute('release', () => api.recordReleaseVerification({ projectId: selected.current!, releaseId, artifactIdentity, evidenceReference, summary, outcome }), 'Manual verification recorded.'),
    confirmRelease: (releaseId: number, verificationId: number) => execute('release', () => api.confirmRelease({ projectId: selected.current!, releaseId, verificationId }), 'Release confirmed.'),
    saveCheckpoint: (accomplished: string, nextSteps: string) => execute('checkpoint', () => api.saveCheckpoint({ projectId: selected.current!, accomplished, nextSteps }), 'Checkpoint saved.'),
  };
}
