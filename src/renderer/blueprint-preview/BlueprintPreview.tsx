import { useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Panel } from '../Panel';
import type {
  BlueprintPreviewProps,
  BlueprintPreviewSnapshot,
  PreviewDiagnostic,
  PreviewDocument,
  PreviewOccurrence,
  PreviewRelationship,
  PreviewStageAssignment,
  PreviewWorkflowResolution,
} from '../../shared/blueprint-preview';
import { BlueprintDiagnostics } from './BlueprintDiagnostics';
import {
  BlueprintRecordInspector,
  validationBadgeClass,
  validationLabel,
} from './BlueprintRecordInspector';
import { BlueprintRecordList } from './BlueprintRecordList';
import { BlueprintSourceView } from './BlueprintSourceView';
import './blueprint-preview.css';

function activeSnapshotFromState(
  state: BlueprintPreviewProps['state'],
): BlueprintPreviewSnapshot | null {
  switch (state.phase) {
    case 'ready':
    case 'stale':
      return state.snapshot;
    case 'loading':
      return state.previous;
    case 'idle':
    case 'error':
    case 'expired':
    case 'cancelling':
      return null;
  }
}

export function BlueprintPreview({
  state,
  selection,
  onChoose,
  onRefresh,
  onCancel,
  onSelect,
}: BlueprintPreviewProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef<{ opener: HTMLElement | null; fallback: HTMLElement | null } | null>(null);
  const snapshot = activeSnapshotFromState(state);

  const isLoading = state.phase === 'loading';
  const isCancelling = state.phase === 'cancelling';
  const controlsDisabled = isLoading || isCancelling;

  // AG-UI-002: When Choose/Refresh buttons become disabled during loading/cancelling,
  // Chromium drops focus to document.body. Move focus to Cancel preview (or the header)
  // so keyboard reachability is preserved while loading.
  useEffect(() => {
    if (!controlsDisabled) return;
    if (typeof document === 'undefined') return;
    const active = document.activeElement;
    const droppedOrDisabled =
      !active ||
      active === document.body ||
      active === document.documentElement ||
      (rootRef.current?.contains(active) &&
        active instanceof HTMLButtonElement &&
        active.disabled);
    if (droppedOrDisabled) {
      if (!isCancelling && cancelButtonRef.current) {
        cancelButtonRef.current.focus();
      } else {
        headerRef.current?.focus();
      }
    }
  }, [controlsDisabled, isCancelling]);

  // Build O(1) lookup maps for the current snapshot
  const maps = useMemo(() => {
    const documentsById = new Map<string, PreviewDocument>();
    const occurrencesByKey = new Map<string, PreviewOccurrence>();
    const diagnosticsById = new Map<string, PreviewDiagnostic>();
    const workflowsByScopeKey = new Map<string, PreviewWorkflowResolution>();
    const assignmentsByActionKey = new Map<string, PreviewStageAssignment>();
    const outboundByFromKey = new Map<string, PreviewRelationship[]>();
    const inboundByTargetKey = new Map<string, PreviewRelationship[]>();
    const inboundUnresolvedByTargetId = new Map<string, PreviewRelationship[]>();

    if (snapshot) {
      for (const doc of snapshot.documents) {
        documentsById.set(doc.id, doc);
      }
      for (const occ of snapshot.records) {
        occurrencesByKey.set(occ.key, occ);
      }
      for (const diag of snapshot.diagnostics) {
        diagnosticsById.set(diag.id, diag);
      }
      for (const wf of snapshot.workflows) {
        workflowsByScopeKey.set(wf.scopeKey, wf);
      }
      for (const assign of snapshot.assignments) {
        assignmentsByActionKey.set(assign.actionKey, assign);
      }
      for (const rel of snapshot.relationships) {
        const outList = outboundByFromKey.get(rel.fromKey) ?? [];
        outList.push(rel);
        outboundByFromKey.set(rel.fromKey, outList);

        for (const tKey of rel.targetKeys) {
          const inList = inboundByTargetKey.get(tKey) ?? [];
          inList.push(rel);
          inboundByTargetKey.set(tKey, inList);
        }
        const byIdList = inboundUnresolvedByTargetId.get(rel.targetId) ?? [];
        byIdList.push(rel);
        inboundUnresolvedByTargetId.set(rel.targetId, byIdList);
      }
    }

    return {
      documentsById,
      occurrencesByKey,
      diagnosticsById,
      workflowsByScopeKey,
      assignmentsByActionKey,
      outboundByFromKey,
      inboundByTargetKey,
      inboundUnresolvedByTargetId,
    };
  }, [snapshot]);

  // Resolve project occurrence when projectKey is non-null
  const projectOccurrence =
    snapshot && snapshot.projectKey
      ? maps.occurrencesByKey.get(snapshot.projectKey) ?? null
      : null;
  const projectRecord =
    projectOccurrence && projectOccurrence.state === 'record' && projectOccurrence.record.kind === 'project'
      ? projectOccurrence.record
      : null;

  // Resolve active selection against current snapshot
  const validSelection =
    snapshot && selection && selection.snapshotId === snapshot.snapshotId ? selection : null;

  const activeOccurrence =
    validSelection?.recordKey ? maps.occurrencesByKey.get(validSelection.recordKey) ?? null : null;

  const activeDiagnostic =
    validSelection?.diagnosticId ? maps.diagnosticsById.get(validSelection.diagnosticId) ?? null : null;

  const activeDocument: PreviewDocument | null = useMemo(() => {
    if (!snapshot) return null;
    if (validSelection) {
      if (validSelection.documentId !== null) {
        return maps.documentsById.get(validSelection.documentId) ?? null;
      }
      // When selection.documentId === null (e.g. package-level diagnostic), do not invent a document
      return null;
    }
    return snapshot.documents[0] ?? null;
  }, [snapshot, validSelection, maps.documentsById]);

  // Inspector controls disappear when details close; focus after React commits.
  useEffect(() => {
    const pending = restoreFocus.current;
    if (!pending) return;
    restoreFocus.current = null;
    const target = pending.opener?.isConnected ? pending.opener : pending.fallback?.isConnected ? pending.fallback : headerRef.current;
    target?.focus();
  }, [selection]);

  function clearDetailSelection() {
    if (!snapshot) return;
    const preserveDocId =
      validSelection?.documentId !== undefined
        ? validSelection.documentId
        : snapshot.documents[0]?.id ?? null;
    restoreFocus.current = {
      opener: lastTriggerRef.current,
      fallback: rootRef.current?.querySelector<HTMLElement>('.bp-record-button[aria-current="true"]') ?? headerRef.current,
    };
    onSelect({
      snapshotId: snapshot.snapshotId,
      documentId: preserveDocId,
      recordKey: null,
      diagnosticId: null,
      source: null,
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (
      event.key === 'Escape' &&
      snapshot &&
      validSelection &&
      (validSelection.recordKey !== null ||
        validSelection.diagnosticId !== null ||
        validSelection.source !== null)
    ) {
      event.stopPropagation();
      clearDetailSelection();
    }
  }

  return (
    <section
      ref={rootRef}
      className="blueprint-preview"
      aria-label="Blueprint Preview"
      onKeyDown={handleKeyDown}
    >
      {/* Top Header */}
      <header ref={headerRef} className="bp-header" tabIndex={-1}>
        <div className="bp-header-copy">
          <p className="eyebrow">
            Blueprint preview · Read-only PTB v0.2 inspection ({snapshot?.contractVersion ?? 'v2-preview-1'})
          </p>
          <h1>
            {projectRecord
              ? projectRecord.title
              : snapshot
                ? 'Blueprint package (no unique valid project record)'
                : 'Inspect a Project Tracking Blueprint'}
          </h1>
          <p className="lede">
            {projectRecord
              ? projectRecord.goal || 'Captured PTB v0.2 project manifest. Preview only — nothing is imported or saved to the workspace.'
              : 'Select a Markdown (.md) Project Tracking Blueprint file to inspect its engineering structure, captured source spans, and validation diagnostics without creating or modifying workspace data.'}
          </p>
        </div>

        <div className="bp-header-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={onChoose}
            disabled={controlsDisabled}
          >
            {isLoading && state.operation === 'choose'
              ? 'Selecting blueprint…'
              : snapshot
                ? 'Select another blueprint'
                : 'Select blueprint'}
          </button>

          {(snapshot || (isLoading && state.operation === 'refresh')) && (
            <button
              type="button"
              className="button button-light"
              onClick={onRefresh}
              disabled={controlsDisabled || !snapshot}
            >
              {isLoading && state.operation === 'refresh' ? 'Refreshing preview…' : 'Refresh preview'}
            </button>
          )}

          {state.phase !== 'idle' && (
            <button
              ref={cancelButtonRef}
              type="button"
              className="button"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling preview…' : 'Cancel preview'}
            </button>
          )}
        </div>
      </header>

      {/* Phase Banners */}
      {state.phase === 'idle' && (
        <div className="bp-banner bp-banner-info" role="status">
          <div className="bp-banner-body">
            <h2>Ready to inspect a local blueprint</h2>
            <p>
              Choose a root Markdown blueprint file (single-file or multi-document manifest) to inspect its components, features, requirements, development scopes, proposed actions, decisions, planned checks, and diagnostics.
            </p>
            <p>
              Preview is strictly read-only: no projects, actions, requirements, checkpoints, or release records are created or altered.
            </p>
          </div>
          <button type="button" className="button button-primary" onClick={onChoose}>
            Select blueprint
          </button>
        </div>
      )}

      {state.phase === 'loading' && (
        <div className="bp-banner bp-banner-info" role="status" aria-live="polite">
          <div className="bp-banner-body">
            <h2>
              {state.operation === 'choose'
                ? 'Selecting and reading blueprint…'
                : 'Refreshing blueprint preview…'}
            </h2>
            <p>
              {state.previous
                ? 'Previous captured snapshot remains visible below while the updated blueprint is read. Native chooser cancellation preserves the prior capture.'
                : 'Reading and validating Markdown source and PTB 0.2 records.'}
            </p>
          </div>
          <button type="button" className="button" onClick={onCancel}>
            Cancel preview
          </button>
        </div>
      )}

      {state.phase === 'stale' && (
        <div className="bp-banner bp-banner-warning" role="status">
          <div className="bp-banner-body">
            <h2>Captured snapshot is retired / stale</h2>
            <p>{state.message}</p>
            <p>
              The previously captured snapshot is displayed below for reference only and is no longer current. Refresh preview to read the selected blueprint again, or select another blueprint file.
            </p>
          </div>
          <div className="bp-header-actions">
            <button type="button" className="button button-primary" onClick={onRefresh}>
              Refresh preview
            </button>
            <button type="button" className="button button-light" onClick={onChoose}>
              Select another blueprint
            </button>
            <button type="button" className="button" onClick={onCancel}>
              Cancel preview
            </button>
          </div>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="bp-banner bp-banner-error" role="alert">
          <div className="bp-banner-body">
            <h2>Blueprint preview could not be captured</h2>
            <p>{state.message}</p>
            <p>
              No active snapshot is loaded and nothing was written to your workspace database. Select a blueprint file again or cancel preview to return Home.
            </p>
          </div>
          <div className="bp-header-actions">
            <button type="button" className="button button-primary" onClick={onChoose}>
              Select blueprint again
            </button>
            <button type="button" className="button" onClick={onCancel}>
              Cancel preview
            </button>
          </div>
        </div>
      )}

      {state.phase === 'expired' && (
        <div className="bp-banner bp-banner-warning" role="alert">
          <div className="bp-banner-body">
            <h2>Preview session expired</h2>
            <p>{state.message}</p>
            <p>
              The active preview session is no longer available. Select a blueprint file to start a fresh capture, or cancel preview.
            </p>
          </div>
          <div className="bp-header-actions">
            <button type="button" className="button button-primary" onClick={onChoose}>
              Select blueprint again
            </button>
            <button type="button" className="button" onClick={onCancel}>
              Cancel preview
            </button>
          </div>
        </div>
      )}

      {state.phase === 'cancelling' && (
        <div className="bp-banner bp-banner-info" role="status" aria-live="polite">
          <div className="bp-banner-body">
            <h2>Closing blueprint preview…</h2>
            <p>
              Discarding temporary preview state and returning to Home.
            </p>
          </div>
        </div>
      )}

      {/* Snapshot Summary Strip & Main Workspace */}
      {snapshot && (
        <>
          <section className="bp-summary-strip" aria-label="Snapshot metadata summary">
            <div className="bp-summary-cell">
              <span className="bp-summary-label">Validation status</span>
              <div>
                <span className={validationBadgeClass(snapshot.validation)}>
                  {validationLabel(snapshot.validation)}
                </span>
                {state.phase === 'stale' && (
                  <span className="bp-badge bp-badge-warning" style={{ marginLeft: 'var(--space-1)' }}>
                    Retired / Stale
                  </span>
                )}
              </div>
            </div>

            <div className="bp-summary-cell">
              <span className="bp-summary-label">Captured at (preview time)</span>
              <strong className="bp-summary-value">
                <time dateTime={snapshot.capturedAt}>
                  {new Date(snapshot.capturedAt).toLocaleString()}
                </time>
              </strong>
            </div>

            <div className="bp-summary-cell">
              <span className="bp-summary-label">Project identity</span>
              <strong className="bp-summary-value bp-mono">
                {projectRecord ? projectRecord.id : 'null (no unique valid project)'}
              </strong>
            </div>

            <div className="bp-summary-cell">
              <span className="bp-summary-label">Occurrences & unparsed</span>
              <strong className="bp-summary-value">
                {snapshot.counts.occurrences} total · {snapshot.counts.unparsed} unparsed / invalid
              </strong>
            </div>

            <div className="bp-summary-cell">
              <span className="bp-summary-label">Diagnostics</span>
              <strong className="bp-summary-value">
                {snapshot.counts.errors} error{snapshot.counts.errors === 1 ? '' : 's'} ·{' '}
                {snapshot.counts.resolutions} Needs review ·{' '}
                {snapshot.counts.warnings} warning{snapshot.counts.warnings === 1 ? '' : 's'}
              </strong>
            </div>

            <div className="bp-summary-cell">
              <span className="bp-summary-label">Source semantic SHA-256</span>
              <strong className="bp-summary-value bp-mono" title={snapshot.semanticSha256 ?? undefined}>
                {snapshot.semanticSha256
                  ? `${snapshot.semanticSha256.slice(0, 16)}…`
                  : 'null (blocked / invalid graph)'}
              </strong>
            </div>
          </section>

          <div className="bp-workspace">
            {/* Left Column: Engineering Outline + Captured Documents + Diagnostics */}
            <div className="bp-column">
              <BlueprintRecordList
                snapshot={snapshot}
                selection={validSelection}
                disabled={controlsDisabled}
                documentsById={maps.documentsById}
                occurrencesByKey={maps.occurrencesByKey}
                workflowsByScopeKey={maps.workflowsByScopeKey}
                assignmentsByActionKey={maps.assignmentsByActionKey}
                onSelect={onSelect}
                onRememberTrigger={(el) => {
                  lastTriggerRef.current = el;
                }}
              />

              <Panel
                id="blueprint-documents-heading"
                title="Captured documents"
                eyebrow={`Entry first, then manifest order (${snapshot.documents.length} file${snapshot.documents.length === 1 ? '' : 's'})`}
                accessory={
                  <span className="count-pill" aria-label={`Document count: ${snapshot.documents.length}`}>
                    {snapshot.documents.length}
                  </span>
                }
              >
                {snapshot.documents.length ? (
                  <ul className="bp-doc-list" aria-label="Blueprint documents">
                    {snapshot.documents.map((doc) => {
                      const isDocSelected = activeDocument?.id === doc.id;
                      return (
                        <li
                          key={doc.id}
                          className={`bp-doc-item${isDocSelected ? ' bp-selected' : ''}`}
                        >
                          <button
                            type="button"
                            className="bp-doc-button"
                            disabled={controlsDisabled}
                            aria-current={isDocSelected ? 'true' : undefined}
                            onClick={(event) => {
                              lastTriggerRef.current = event.currentTarget;
                              onSelect({
                                snapshotId: snapshot.snapshotId,
                                documentId: doc.id,
                                recordKey: null,
                                diagnosticId: null,
                                source: null,
                              });
                            }}
                          >
                            <span className="bp-doc-path">
                              {doc.order + 1}. {doc.relativePath}
                            </span>
                            <div className="bp-record-badges">
                              <span
                                className={
                                  doc.status === 'captured'
                                    ? 'bp-badge bp-badge-valid'
                                    : 'bp-badge bp-badge-error'
                                }
                              >
                                {doc.status === 'captured' ? 'Captured' : 'Unavailable'}
                              </span>
                            </div>
                          </button>

                          <div className="bp-doc-meta">
                            <span>
                              Size:{' '}
                              {doc.byteLength !== null ? `${doc.byteLength} bytes` : 'unavailable'}
                            </span>
                            <span>·</span>
                            <span className="bp-mono">
                              SHA-256: {doc.sha256 ? `${doc.sha256.slice(0, 12)}…` : 'unavailable'}
                            </span>
                            <span>·</span>
                            <span>{doc.headings.length} heading{doc.headings.length === 1 ? '' : 's'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="empty-copy">No documents recorded in this snapshot.</p>
                )}
              </Panel>

              <BlueprintDiagnostics
                snapshot={snapshot}
                selection={validSelection}
                disabled={controlsDisabled}
                documentsById={maps.documentsById}
                occurrencesByKey={maps.occurrencesByKey}
                onSelect={onSelect}
                onRememberTrigger={(el) => {
                  lastTriggerRef.current = el;
                }}
              />
            </div>

            {/* Right Column: Connected Selected-Record Inspector + Captured Markdown Source View */}
            <div className="bp-column">
              <BlueprintRecordInspector
                snapshot={snapshot}
                selection={validSelection}
                disabled={controlsDisabled}
                occurrence={activeOccurrence}
                documentsById={maps.documentsById}
                occurrencesByKey={maps.occurrencesByKey}
                diagnosticsById={maps.diagnosticsById}
                workflowsByScopeKey={maps.workflowsByScopeKey}
                assignmentsByActionKey={maps.assignmentsByActionKey}
                outboundByFromKey={maps.outboundByFromKey}
                inboundByTargetKey={maps.inboundByTargetKey}
                inboundUnresolvedByTargetId={maps.inboundUnresolvedByTargetId}
                onSelect={onSelect}
                onClearDetail={clearDetailSelection}
                onRememberTrigger={(el) => {
                  lastTriggerRef.current = el;
                }}
              />

              <BlueprintSourceView
                snapshot={snapshot}
                selection={validSelection}
                disabled={controlsDisabled}
                activeDocument={activeDocument}
                activeOccurrence={activeOccurrence}
                activeDiagnostic={activeDiagnostic}
                documentsById={maps.documentsById}
                onSelect={onSelect}
                onClearDetail={clearDetailSelection}
                onRememberTrigger={(el) => {
                  lastTriggerRef.current = el;
                }}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
