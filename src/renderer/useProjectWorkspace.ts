import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionDefinitionInput, HomeProjectSummary, Project, ProjectDetail, Result } from '../shared/contracts';
import type { FormationReceipt, KnowledgeWorkspace, PreparedFormation } from '../shared/knowledge';

type Operation = 'create' | 'open' | 'action' | 'complete' | 'checkpoint' | 'release' | 'refresh' | 'formation' | null;
type Notice = { kind: 'success' | 'error' | 'warning'; text: string } | null;
type UncertainSave = { kind: 'create' | 'action' | 'checkpoint'; checked: boolean };

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export function useProjectWorkspace() {
  const api = window.workspace;
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeWorkspace | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState<Operation>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [stale, setStale] = useState(false);
  const [uncertainSave, setUncertainSave] = useState<UncertainSave | null>(null);
  const [homeProjects, setHomeProjects] = useState<HomeProjectSummary[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState('');
  const [homeStale, setHomeStale] = useState(true);
  const mounted = useRef(false);
  const selected = useRef<number | null>(null);
  const request = useRef(0);
  const listRequest = useRef(0);
  const homeRequest = useRef(0);
  const listLoading = useRef(true);
  const operation = useRef<Operation>(null);
  const uncertain = useRef<UncertainSave | null>(null);

  function setUncertainty(value: UncertainSave | null) {
    uncertain.current = value;
    setUncertainSave(value);
  }

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

  const refreshHome = useCallback(async (): Promise<boolean> => {
    const token = ++homeRequest.current;
    setHomeLoading(true);
    setHomeError('');
    setHomeStale(true);
    try {
      const rows = unwrap(await api.getHomeSummary());
      if (!mounted.current || token !== homeRequest.current) return false;
      setHomeProjects(rows);
      setHomeStale(false);
      return true;
    } catch (error) {
      if (mounted.current && token === homeRequest.current) {
        setHomeError(error instanceof Error ? error.message : 'Could not load Home.');
      }
      return false;
    } finally {
      if (mounted.current && token === homeRequest.current) setHomeLoading(false);
    }
  }, [api]);

  useEffect(() => {
    mounted.current = true;
    void loadProjects();
    void refreshHome();
    return () => {
      mounted.current = false;
      request.current++;
      listRequest.current++;
      homeRequest.current++;
    };
  }, [loadProjects, refreshHome]);

  async function readProject(projectId: number, token: number): Promise<boolean> {
    const [result, graph] = await Promise.all([api.openProject({ projectId }), api.openKnowledgeWorkspace({ projectId })]);
    const snapshot = unwrap(result), knowledge = unwrap(graph);
    if (!current(token, projectId)) return false;
    setDetail(snapshot);
    setKnowledge(knowledge);
    setStale(false);
    return true;
  }

  async function openProject(projectId: number, keepSnapshot = false): Promise<boolean> {
    // A new selection may supersede an earlier read, but cannot interrupt a write/refresh.
    if ((operation.current !== null && operation.current !== 'open') || listLoading.current || uncertain.current !== null) return false;
    const preserve = keepSnapshot && selected.current === projectId && detail?.project.id === projectId;
    selected.current = projectId;
    setSelectedId(projectId);
    const token = ++request.current;
    if (!preserve) { setDetail(null); setKnowledge(null); }
    setStale(preserve);
    setNotice(null);
    setOperation('open');
    try {
      return await readProject(projectId, token);
    } catch (error) {
      if (current(token, projectId)) setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not open project.' });
      return false;
    } finally {
      if (current(token, projectId)) setOperation(null);
    }
  }

  async function formKnowledge(plan: PreparedFormation): Promise<FormationReceipt> {
    if (operation.current !== null || listLoading.current) throw new Error('Wait for the current workspace operation to finish.');
    const token = ++request.current;
    setOperation('formation');
    setNotice(null);
    let receipt: FormationReceipt | null = null;
    try {
      const response = await api.applyKnowledgeFormation({ operationId: plan.operationId, reviewDigest: plan.reviewDigest });
      if (!response.ok) throw Object.assign(new Error(response.error.message), { code: response.error.code });
      receipt = response.value.receipt;
      if (!mounted.current) return receipt;
      selected.current = receipt.project.id;
      setSelectedId(receipt.project.id); setDetail(null); setKnowledge(null); setStale(true);
      homeRequest.current++; setHomeStale(true); setHomeLoading(false);
      setNotice({ kind: 'success', text: 'Knowledge project created. Loading saved data…' });
      if (!await loadProjects()) throw new Error('Could not refresh the project list.');
      await readProject(receipt.project.id, token);
      if (current(token, receipt.project.id)) setNotice({ kind: 'success', text: 'Knowledge project created. Definitions are proposed; no operational work was committed.' });
      void refreshHome();
      return receipt;
    } catch (error) {
      if (!receipt) throw error;
      if (current(token, receipt.project.id)) {
        setStale(true);
        setNotice({ kind: 'warning', text: 'Project created, but saved data could not be loaded. Retry loading; creation will not be repeated.' });
      }
      return receipt;
    } finally {
      if (mounted.current && request.current === token) setOperation(null);
    }
  }

  // A STORAGE/transport error cannot tell us whether an append committed.
  // Only the three owner-approved ordinary create/append operations fail closed.
  async function execute(name: Exclude<Operation, 'open' | 'refresh' | null>, command: () => Promise<Result<unknown>>, message: string): Promise<boolean> {
    if (operation.current !== null || listLoading.current || stale || uncertain.current !== null) return false;
    const projectId = selected.current;
    const mayAppend = name === 'create' || name === 'action' || name === 'checkpoint';
    if (name !== 'create' && (!detail || detail.project.id !== projectId)) return false;
    const token = ++request.current;
    setOperation(name);
    setNotice(null);
    let committed = false;
    try {
      const result = await command();
      if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code });
      committed = true;
      homeRequest.current++;
      setHomeStale(true);
      setHomeLoading(false);
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
          const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined;
          if (mayAppend && code !== 'VALIDATION' && code !== 'NOT_FOUND' && code !== 'FORBIDDEN') {
            setUncertainty({ kind: name as UncertainSave['kind'], checked: false });
            setStale(projectId !== null);
            homeRequest.current++;
            setHomeStale(true);
            setHomeLoading(false);
            setNotice({ kind: 'warning', text: 'Save outcome is uncertain. The record may already be stored. Reload saved records before deciding whether to submit again.' });
          } else {
            setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not confirm the save.' });
          }
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
      const pending = uncertain.current;
      // A failed create has no listError: force the authoritative list read anyway.
      if ((pending?.kind === 'create' || listError) && !await loadProjects()) throw new Error('Could not load the project list.');
      if (projectId !== null && !await readProject(projectId, token)) return;
      if (current(token, projectId)) {
        if (pending && uncertain.current === pending) {
          setUncertainty({ ...pending, checked: true });
          setNotice({ kind: 'warning', text: 'Saved records reloaded. They may contain your entry, but matching text does not prove which submission created it. Choose how to resolve the retained draft.' });
          void refreshHome();
        } else setNotice({ kind: 'success', text: projectId === null ? 'Projects loaded.' : 'Workspace refreshed.' });
      }
    } catch {
      if (current(token, projectId)) {
        setStale(projectId !== null);
        setNotice({ kind: 'error', text: 'Saved data could not be reloaded. No save was repeated; you can retry loading.' });
      }
    } finally {
      if (current(token, projectId)) setOperation(null);
    }
  }

  function resolveUncertainSave(choice: 'discard' | 'retry'): UncertainSave['kind'] | null {
    const pending = uncertain.current;
    if (!pending?.checked || operation.current !== null) return null;
    setUncertainty(null);
    if (choice === 'retry') {
      setNotice({ kind: 'warning', text: 'You allowed another submission after reviewing saved records. It may duplicate an earlier successful write.' });
      return null;
    }
    setNotice({ kind: 'success', text: 'Draft discarded at your request. Saved records were not changed.' });
    return pending.kind;
  }

  return {
    projects, detail, knowledge, selectedId, loading, listError, busy, notice, stale, uncertainSave, resolveUncertainSave, formKnowledge,
    homeProjects, homeLoading, homeError, homeStale, refreshHome,
    openProject, returnToProject: (projectId: number) => openProject(projectId, true), retryLoading,
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
