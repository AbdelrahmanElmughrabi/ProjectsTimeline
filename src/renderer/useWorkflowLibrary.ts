import { useCallback, useEffect, useRef, useState } from 'react';
import type { Result, WorkflowDetail } from '../shared/contracts';

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

  async function duplicate(templateId: number, expectedVersion: number, name: string): Promise<boolean> {
    if (mutating.current || loading || stale) return false;
    mutating.current = true;
    setBusy(true);
    setError('');
    let committed = false;
    try {
      unwrap(await window.workspace.duplicateWorkflowTemplate({ templateId, expectedVersion, name }));
      committed = true;
      setStale(true);
      if (!await refresh()) setError('Template copied, but the library could not refresh. Retry loading; the copy will not be repeated.');
      return true;
    } catch (cause) {
      setError(committed
        ? 'Template copied, but the library could not refresh. Retry loading; the copy will not be repeated.'
        : cause instanceof Error ? cause.message : 'Could not copy the template.');
      return committed;
    } finally {
      mutating.current = false;
      setBusy(false);
    }
  }

  return { workflows, loading, busy, stale, error, refresh, duplicate };
}
