import { Panel } from '../Panel';
import type {
  BlueprintPreviewSnapshot,
  PreviewDiagnostic,
  PreviewDocument,
  PreviewOccurrence,
  PreviewSelection,
  PreviewSourceRef,
} from '../../shared/blueprint-preview';

export function formatSourceSpan(
  source: PreviewSourceRef | null,
  documentsById: ReadonlyMap<string, PreviewDocument>,
): string {
  if (!source) return 'Package level (no document range)';
  const doc = documentsById.get(source.documentId);
  const path = doc ? doc.relativePath : source.documentId;
  return `${path}:${source.span.start.line}:${source.span.start.column}–${source.span.end.line}:${source.span.end.column}`;
}

export function severityLabel(severity: PreviewDiagnostic['severity']): string {
  switch (severity) {
    case 'error':
      return 'Blocking error';
    case 'resolution':
      return 'Needs review';
    case 'warning':
      return 'Warning';
  }
}

export function severityBadgeClass(severity: PreviewDiagnostic['severity']): string {
  switch (severity) {
    case 'error':
      return 'bp-badge bp-badge-error';
    case 'resolution':
      return 'bp-badge bp-badge-resolution';
    case 'warning':
      return 'bp-badge bp-badge-warning';
  }
}

function occurrenceContainsSource(occ: PreviewOccurrence, source: PreviewSourceRef): boolean {
  const inMetadata =
    occ.metadataSource.documentId === source.documentId &&
    occ.metadataSource.span.start.byteOffset <= source.span.start.byteOffset &&
    source.span.end.byteOffset <= occ.metadataSource.span.end.byteOffset;
  const inNarrative =
    occ.narrativeSource.documentId === source.documentId &&
    occ.narrativeSource.span.start.byteOffset <= source.span.start.byteOffset &&
    source.span.end.byteOffset <= occ.narrativeSource.span.end.byteOffset;
  return inMetadata || inNarrative;
}

export function resolveDiagnosticRecordKeyForSource(
  diag: PreviewDiagnostic,
  source: PreviewSourceRef | null,
  occurrencesByKey: ReadonlyMap<string, PreviewOccurrence>,
): string | null {
  if (!source) return null;
  for (const key of diag.recordKeys) {
    const occ = occurrencesByKey.get(key);
    if (occ && occurrenceContainsSource(occ, source)) {
      return key;
    }
  }
  return null;
}

export function resolveDiagnosticSourceForRecord(
  diag: PreviewDiagnostic,
  occ: PreviewOccurrence,
): PreviewSourceRef | null {
  if (diag.source && occurrenceContainsSource(occ, diag.source)) {
    return diag.source;
  }
  for (const rel of diag.relatedSources) {
    if (occurrenceContainsSource(occ, rel)) {
      return rel;
    }
  }
  return null;
}

export function BlueprintDiagnostics({
  snapshot,
  selection,
  disabled,
  documentsById,
  occurrencesByKey,
  onSelect,
  onRememberTrigger,
}: {
  snapshot: BlueprintPreviewSnapshot;
  selection: PreviewSelection | null;
  disabled: boolean;
  documentsById: ReadonlyMap<string, PreviewDocument>;
  occurrencesByKey: ReadonlyMap<string, PreviewOccurrence>;
  onSelect: (selection: PreviewSelection) => void;
  onRememberTrigger?: (element: HTMLElement | null) => void;
}) {
  const { diagnostics, counts } = snapshot;

  function selectDiagnosticPrimary(diag: PreviewDiagnostic, trigger: HTMLElement) {
    onRememberTrigger?.(trigger);
    if (diag.source) {
      const matchingKey = resolveDiagnosticRecordKeyForSource(diag, diag.source, occurrencesByKey);
      onSelect({
        snapshotId: snapshot.snapshotId,
        documentId: diag.source.documentId,
        recordKey: matchingKey,
        diagnosticId: diag.id,
        source: diag.source,
      });
    } else {
      // AG-Q-02 resolution: package-level diagnostic with source: null uses documentId: null, source: null, recordKey: null
      onSelect({
        snapshotId: snapshot.snapshotId,
        documentId: null,
        recordKey: null,
        diagnosticId: diag.id,
        source: null,
      });
    }
  }

  function selectRelatedSource(diag: PreviewDiagnostic, related: PreviewSourceRef, trigger: HTMLElement) {
    onRememberTrigger?.(trigger);
    const matchingKey = resolveDiagnosticRecordKeyForSource(diag, related, occurrencesByKey);
    onSelect({
      snapshotId: snapshot.snapshotId,
      documentId: related.documentId,
      recordKey: matchingKey,
      diagnosticId: diag.id,
      source: related,
    });
  }

  function selectDiagnosticRecord(diag: PreviewDiagnostic, recordKey: string, trigger: HTMLElement) {
    onRememberTrigger?.(trigger);
    const occ = occurrencesByKey.get(recordKey);
    if (!occ) return;
    const matchedDiagSource = resolveDiagnosticSourceForRecord(diag, occ);
    if (matchedDiagSource) {
      onSelect({
        snapshotId: snapshot.snapshotId,
        documentId: occ.metadataSource.documentId,
        recordKey,
        diagnosticId: diag.id,
        source: matchedDiagSource,
      });
    } else {
      onSelect({
        snapshotId: snapshot.snapshotId,
        documentId: occ.metadataSource.documentId,
        recordKey,
        diagnosticId: null,
        source: occ.metadataSource,
      });
    }
  }

  return (
    <Panel
      id="blueprint-diagnostics-heading"
      title="Diagnostics & review notes"
      eyebrow={`${counts.errors} error${counts.errors === 1 ? '' : 's'} · ${counts.resolutions} Needs review · ${counts.warnings} warning${counts.warnings === 1 ? '' : 's'}`}
      accessory={
        <span className="count-pill" aria-label={`Diagnostic count: ${diagnostics.length}`}>
          {diagnostics.length}
        </span>
      }
    >
      <p className="bp-panel-subnote">
        Ordered by severity (blocking errors → Needs review → warnings), then document and byte offset. Unresolved or incompatible release-only workflow references appear as Needs review.
      </p>
      {diagnostics.length ? (
        <ol className="bp-diag-list" aria-label="Blueprint diagnostics">
          {diagnostics.map((diag) => {
            const isSelected = selection?.diagnosticId === diag.id;
            return (
              <li
                key={diag.id}
                className={`bp-diag-card bp-diag-${diag.severity}${isSelected ? ' bp-selected' : ''}`}
              >
                <div className="bp-diag-header">
                  <div className="bp-record-badges">
                    <span className={severityBadgeClass(diag.severity)}>{severityLabel(diag.severity)}</span>
                    <span className="bp-badge bp-mono">{diag.code}</span>
                    {diag.field && <span className="bp-badge bp-mono">Field {diag.field}</span>}
                  </div>
                  <span className="bp-mono">{formatSourceSpan(diag.source, documentsById)}</span>
                </div>
                <p className="bp-diag-message">{diag.message}</p>
                {diag.source && diag.source.headingPath.length > 0 && (
                  <p className="field-note" style={{ margin: 0 }}>
                    Heading context: {diag.source.headingPath.join(' › ')}
                  </p>
                )}
                <div className="bp-diag-actions">
                  <button
                    type="button"
                    className={`bp-chip-button${isSelected && (!selection?.source || selection.source === diag.source) ? ' bp-selected' : ''}`}
                    disabled={disabled}
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={(event) => selectDiagnosticPrimary(diag, event.currentTarget)}
                  >
                    {diag.source
                      ? `Inspect ${formatSourceSpan(diag.source, documentsById)}`
                      : `Select package diagnostic (${diag.code})`}
                  </button>
                  {diag.recordKeys.map((recKey) => {
                    const occ = occurrencesByKey.get(recKey);
                    const recLabel =
                      occ?.state === 'record'
                        ? `${occ.record.id} (${occ.record.title})`
                        : occ?.declaredId ?? recKey;
                    const recSelected = selection?.recordKey === recKey && selection?.diagnosticId === diag.id;
                    return (
                      <button
                        key={recKey}
                        type="button"
                        className={`bp-chip-button${recSelected ? ' bp-selected' : ''}`}
                        disabled={disabled}
                        onClick={(event) => selectDiagnosticRecord(diag, recKey, event.currentTarget)}
                      >
                        Occurrence {recKey}: {recLabel}
                      </button>
                    );
                  })}
                  {diag.relatedSources.map((rel, idx) => {
                    const relLabel = formatSourceSpan(rel, documentsById);
                    const relSelected =
                      isSelected &&
                      selection?.source?.documentId === rel.documentId &&
                      selection?.source?.span.start.byteOffset === rel.span.start.byteOffset &&
                      selection?.source?.span.end.byteOffset === rel.span.end.byteOffset;
                    return (
                      <button
                        key={`${rel.documentId}-${rel.span.start.byteOffset}-${idx}`}
                        type="button"
                        className={`bp-chip-button${relSelected ? ' bp-selected' : ''}`}
                        disabled={disabled}
                        onClick={(event) => selectRelatedSource(diag, rel, event.currentTarget)}
                      >
                        Related location #{idx + 1}: {relLabel}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="empty-copy">No diagnostics reported for this captured snapshot.</p>
      )}
    </Panel>
  );
}
