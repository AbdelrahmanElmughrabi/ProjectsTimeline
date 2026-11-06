import { useEffect, useRef, useState } from 'react';
import type { BlueprintPreviewSnapshot, BlueprintPreviewViewState, PreviewSelection, PreviewSourceRef } from '../shared/blueprint-preview';

function snapshotOf(state: BlueprintPreviewViewState): BlueprintPreviewSnapshot | null {
  return state.phase === 'ready' || state.phase === 'stale' ? state.snapshot : state.phase === 'loading' || state.phase === 'cancelling' ? state.previous : null;
}

export function useBlueprintPreview() {
  const [state, setState] = useState<BlueprintPreviewViewState>({ phase: 'idle' });
  const [selection, setSelection] = useState<PreviewSelection | null>(null);
  const current = useRef(state);
  const selected = useRef(selection);
  const request = useRef(0);
  const mounted = useRef(true);
  function update(next: BlueprintPreviewViewState) { current.current = next; setState(next); }
  function select(next: PreviewSelection | null) { selected.current = next; setSelection(next); }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; void window.workspace.cancelBlueprintPreview(); };
  }, []);

  function onSelect(next: PreviewSelection) {
    const state = current.current;
    if (state.phase !== 'ready' && state.phase !== 'stale') return;
    const snapshot = state.snapshot;
    if (next.snapshotId !== snapshot.snapshotId) return;
    const doc = next.documentId === null ? null : snapshot.documents.find(doc => doc.id === next.documentId);
    if (next.documentId !== null && !doc) return;
    const record = next.recordKey === null ? null : snapshot.records.find(record => record.key === next.recordKey);
    const diagnostic = next.diagnosticId === null ? null : snapshot.diagnostics.find(diag => diag.id === next.diagnosticId);
    if ((next.recordKey !== null && (!record || record.metadataSource.documentId !== next.documentId)) || (next.diagnosticId !== null && !diagnostic)) return;
    if (diagnostic) {
      const locations = [...(diagnostic.source ? [diagnostic.source] : []), ...diagnostic.relatedSources];
      if (next.documentId !== null && !locations.some(ref => ref.documentId === next.documentId)) return;
      if (next.source !== null && !locations.some(ref => JSON.stringify(ref) === JSON.stringify(next.source))) return;
      if (record && !diagnostic.recordKeys.includes(record.key)) return;
    }
    if (next.documentId === null && (next.recordKey !== null || next.source !== null || (diagnostic && diagnostic.source !== null))) return;
    if (next.source) {
      if (!doc || doc.text === null || next.source.documentId !== doc.id) return;
      const { start, end } = next.source.span;
      if (!Number.isInteger(start.utf16Offset) || !Number.isInteger(end.utf16Offset) || start.utf16Offset < 0 || end.utf16Offset < start.utf16Offset || end.utf16Offset > doc.text.length) return;
      const refs: PreviewSourceRef[] = [
        ...doc.headings.map(heading => heading.source),
        ...snapshot.records.filter(occ => occ.metadataSource.documentId === doc.id).flatMap(occ => [occ.metadataSource, occ.narrativeSource]),
        ...snapshot.relationships.filter(edge => edge.source.documentId === doc.id).map(edge => edge.source),
        ...snapshot.diagnostics.flatMap(diag => [...(diag.source ? [diag.source] : []), ...diag.relatedSources]),
      ];
      if (!refs.some(ref => JSON.stringify(ref) === JSON.stringify(next.source))) return;
    }
    select(next);
  }

  async function capture(operation: 'choose' | 'refresh'): Promise<'snapshot' | 'cancelled' | 'error'> {
    if (['loading', 'cancelling'].includes(current.current.phase)) return 'cancelled';
    const before = current.current;
    const previous = snapshotOf(before);
    if (operation === 'refresh' && !previous) return 'cancelled';
    const token = ++request.current;
    update({ phase: 'loading', operation, previous });
    try {
      const result = operation === 'choose' ? await window.workspace.chooseBlueprintPreview() : await window.workspace.refreshBlueprintPreview({ sessionId: previous!.sessionId });
      if (!mounted.current || token !== request.current) return 'cancelled';
      if (!result.ok) {
        if (result.error.code === 'NOT_FOUND') { update({ phase: 'expired', message: result.error.message }); select(null); }
        else if (operation === 'refresh' && previous) update({ phase: 'stale', snapshot: previous, message: result.error.message });
        else { update({ phase: 'error', message: result.error.message }); select(null); }
        return 'error';
      }
      if (result.value.kind === 'cancelled') { update(before); return 'cancelled'; }
      const snapshot = result.value.snapshot;
      const old = selected.current?.recordKey ? previous?.records.find(occ => occ.key === selected.current!.recordKey) : null;
      update({ phase: 'ready', snapshot });
      select(null);
      if (operation === 'refresh' && old?.state === 'record' && previous?.projectKey && snapshot.projectKey) {
        const oldProject = previous.records.find(occ => occ.key === previous.projectKey);
        const newProject = snapshot.records.find(occ => occ.key === snapshot.projectKey);
        const oldMatches = previous.records.filter(occ => occ.state === 'record' && occ.record.id === old.record.id);
        const matches = snapshot.records.filter(occ => occ.state === 'record' && occ.record.kind === old.record.kind && occ.record.id === old.record.id);
        if (oldMatches.length === 1 && matches.length === 1 && oldProject?.state === 'record' && newProject?.state === 'record' && oldProject.record.id === newProject.record.id) {
          const next = matches[0];
          select({ snapshotId: snapshot.snapshotId, documentId: next.metadataSource.documentId, recordKey: next.key, diagnosticId: null, source: next.metadataSource });
        }
      }
      return 'snapshot';
    } catch {
      if (mounted.current && token === request.current) {
        const message = 'Preview could not be loaded. Select the blueprint again or cancel.';
        update(operation === 'refresh' && previous ? { phase: 'stale', snapshot: previous, message } : { phase: 'error', message });
      }
      return 'error';
    }
  }

  async function cancel(): Promise<boolean> {
    const token = ++request.current;
    update({ phase: 'cancelling', previous: snapshotOf(current.current) });
    try {
      const result = await window.workspace.cancelBlueprintPreview();
      if (!mounted.current || token !== request.current) return false;
      if (!result.ok) { update({ phase: 'error', message: result.error.message }); return false; }
      update({ phase: 'idle' }); select(null); return true;
    } catch {
      if (mounted.current && token === request.current) update({ phase: 'error', message: 'Preview could not be closed. Try Cancel preview again.' });
      return false;
    }
  }

  return { state, selection, choose: () => capture('choose'), refresh: () => capture('refresh'), cancel, onSelect };
}
