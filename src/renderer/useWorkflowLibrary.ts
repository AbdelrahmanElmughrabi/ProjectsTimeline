import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionDefinitionInput, Result, WorkflowDetail, WorkflowTemplate } from '../shared/contracts';

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export function useWorkflowLibrary() {
  const [workflows, setWorkflows] = useState<WorkflowDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const mounted = useRef(false);
  const mutating = useRef(false);

  const refresh = useCallback(async () => {
    const token = ++request.current;
    setLoading(true);
    setError('');
    try {
      const snapshot = unwrap(await window.workspace.getWorkflowLibrary());
      if (mounted.current && token === request.current) { setWorkflows(snapshot); setStale(false); }
      return true;
    } catch (cause) {
      if (mounted.current && token === request.current) {
        setError(cause instanceof Error ? cause.message : 'Could not load workflow templates.');
        setStale(true);
      }
      return false;
    } finally {
      if (mounted.current && token === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; request.current++; };
  }, [refresh]);

  async function runMutation<T>(templateId: number | null, command: (expectedVersion: number | null) => Promise<Result<T>>): Promise<T | null> {
    if (mutating.current || loading || stale) return null;
    const template = templateId === null ? null : workflows.find(item => item.template.id === templateId)?.template;
    if (templateId !== null && !template) return null;
    mutating.current = true;
    setBusy(true);
    setError('');
    let committed = false;
    let value: T | null = null;
    try {
      value = unwrap(await command(template?.version ?? null));
      committed = true;
      if (!await refresh()) setError('Saved, but the library could not refresh. Retry loading; the save will not be repeated.');
    } catch (cause) {
      const message = committed
        ? 'Saved, but the library could not refresh. Retry loading; the save will not be repeated.'
        : cause instanceof Error ? cause.message : 'Could not save the workflow change.';
      if (!committed && !await refresh()) setError(`${message} The library could not refresh; retry loading before another edit.`);
      else setError(message);
    } finally {
      mutating.current = false;
      setBusy(false);
    }
    return committed ? value : null;
  }

  const createTemplate = (name: string, description: string) => runMutation<WorkflowTemplate>(null, () => window.workspace.createWorkflowTemplate({ name, description }));
  const duplicate = (templateId: number, name: string) => runMutation(templateId, version => window.workspace.duplicateWorkflowTemplate({ templateId, expectedVersion: version!, name }));
  const updateTemplate = (templateId: number, name: string, description: string) => runMutation(templateId, version => window.workspace.updateWorkflowTemplate({ templateId, expectedVersion: version!, name, description })).then(Boolean);
  const addStage = (templateId: number, name: string) => runMutation(templateId, version => window.workspace.addWorkflowStage({ templateId, expectedVersion: version!, name })).then(Boolean);
  const updateStage = (templateId: number, stageId: number, name: string) => runMutation(templateId, version => window.workspace.updateWorkflowStage({ templateId, expectedVersion: version!, stageId, name })).then(Boolean);
  const reorderStages = (templateId: number, stageIds: number[]) => runMutation(templateId, version => window.workspace.reorderWorkflowStages({ templateId, expectedVersion: version!, stageIds })).then(Boolean);
  const removeStage = (templateId: number, stageId: number) => runMutation(templateId, version => window.workspace.removeWorkflowStage({ templateId, expectedVersion: version!, stageId })).then(Boolean);
  const addAction = (templateId: number, stageId: number, title: string) => runMutation(templateId, version => window.workspace.addWorkflowAction({ templateId, expectedVersion: version!, stageId, title })).then(Boolean);
  const updateAction = (templateId: number, actionId: number, stageId: number, definition: ActionDefinitionInput) => runMutation(templateId, version => window.workspace.updateWorkflowAction({ templateId, expectedVersion: version!, actionId, stageId, ...definition })).then(Boolean);
  const reorderActions = (templateId: number, stageId: number, actionIds: number[]) => runMutation(templateId, version => window.workspace.reorderWorkflowActions({ templateId, expectedVersion: version!, stageId, actionIds })).then(Boolean);
  const removeAction = (templateId: number, actionId: number) => runMutation(templateId, version => window.workspace.removeWorkflowAction({ templateId, expectedVersion: version!, actionId })).then(Boolean);

  return { workflows, loading, busy, stale, error, refresh, createTemplate, duplicate, updateTemplate, addStage, updateStage, reorderStages, removeStage, addAction, updateAction, reorderActions, removeAction };
}
