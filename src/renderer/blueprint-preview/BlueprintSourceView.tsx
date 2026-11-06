import { useEffect, useRef } from 'react';
import { Panel } from '../Panel';
import type {
  BlueprintPreviewSnapshot,
  PreviewDiagnostic,
  PreviewDocument,
  PreviewOccurrence,
  PreviewSelection,
  PreviewSourceRef,
} from '../../shared/blueprint-preview';
import { formatSourceSpan } from './BlueprintDiagnostics';

export function BlueprintSourceView({
  snapshot,
  selection,
  disabled,
  activeDocument,
  activeOccurrence,
  activeDiagnostic,
  documentsById,
  onSelect,
  onClearDetail,
}: {
  snapshot: BlueprintPreviewSnapshot;
  selection: PreviewSelection | null;
  disabled: boolean;
  activeDocument: PreviewDocument | null;
  activeOccurrence: PreviewOccurrence | null;
  activeDiagnostic: PreviewDiagnostic | null;
  documentsById: ReadonlyMap<string, PreviewDocument>;
  onSelect: (selection: PreviewSelection) => void;
  onClearDetail?: () => void;
}) {
  const highlightRef = useRef<HTMLElement | null>(null);

  // Determine the active source range within the active document
  const candidateSource: PreviewSourceRef | null =
    selection?.source ??
    activeDiagnostic?.source ??
    activeOccurrence?.metadataSource ??
    null;

  const activeSource: PreviewSourceRef | null =
    candidateSource && activeDocument && candidateSource.documentId === activeDocument.id
      ? candidateSource
      : null;

  useEffect(() => {
    if (highlightRef.current && typeof highlightRef.current.scrollIntoView === 'function') {
      highlightRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [
    activeDocument?.id,
    activeSource?.span.start.utf16Offset,
    activeSource?.span.end.utf16Offset,
  ]);

  if (!activeDocument) {
    return (
      <Panel
        id="blueprint-source-heading"
        title="Captured Markdown source"
        eyebrow="Inert source inspection"
      >
        <p className="empty-copy">
          {selection?.diagnosticId && selection.documentId === null
            ? 'Package-level diagnostic selected. Choose a document or a diagnostic with a captured document span to inspect source text.'
            : 'Select a captured document from the document list to inspect its exact Markdown source.'}
        </p>
      </Panel>
    );
  }

  if (activeDocument.status === 'unavailable' || activeDocument.text === null) {
    return (
      <Panel
        id="blueprint-source-heading"
        title={`Captured Markdown source · ${activeDocument.relativePath}`}
        eyebrow={`Document #${activeDocument.order + 1} · Unavailable`}
        accessory={<span className="bp-badge bp-badge-error">Not captured</span>}
      >
        <p className="empty-copy">
          Source unavailable (file was not read or failed containment/availability validation). No line numbers or source body are fabricated for unread documents.
        </p>
      </Panel>
    );
  }

  const text = activeDocument.text;
  const textLength = text.length;
  const hasValidSpan =
    activeSource !== null &&
    activeSource.span.start.utf16Offset >= 0 &&
    activeSource.span.end.utf16Offset >= activeSource.span.start.utf16Offset &&
    activeSource.span.end.utf16Offset <= textLength;

  const startOffset = hasValidSpan && activeSource ? activeSource.span.start.utf16Offset : 0;
  const endOffset = hasValidSpan && activeSource ? activeSource.span.end.utf16Offset : 0;

  return (
    <Panel
      id="blueprint-source-heading"
      title={`Captured Markdown source · ${activeDocument.relativePath}`}
      eyebrow={`Document #${activeDocument.order + 1} · ${activeDocument.byteLength ?? 0} UTF-8 bytes`}
      accessory={<span className="bp-badge bp-badge-valid">Captured</span>}
    >
      <div className="bp-doc-meta" style={{ padding: 0, marginBottom: 'var(--space-3)' }}>
        <span>SHA-256: <code className="bp-mono">{activeDocument.sha256 ?? 'unavailable'}</code></span>
        {activeSource && (
          <span>
            Active range: <code className="bp-mono">{formatSourceSpan(activeSource, documentsById)}</code> (UTF-8 bytes {activeSource.span.start.byteOffset}–{activeSource.span.end.byteOffset}, UTF-16 {activeSource.span.start.utf16Offset}–{activeSource.span.end.utf16Offset})
          </span>
        )}
      </div>

      {activeSource && activeSource.headingPath.length > 0 && (
        <p className="field-note" style={{ margin: '0 0 var(--space-3)' }}>
          Active heading path: <strong>{activeSource.headingPath.join(' › ')}</strong>
        </p>
      )}

      {activeDocument.headings.length > 0 && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <p className="field-note" style={{ margin: '0 0 var(--space-1)' }}>
            Document headings (authored order):
          </p>
          <ul className="bp-heading-list" style={{ padding: 0 }} aria-label={`Headings in ${activeDocument.relativePath}`}>
            {activeDocument.headings.map((heading, idx) => {
              const isSelectedHeading =
                activeSource?.span.start.byteOffset === heading.source.span.start.byteOffset &&
                activeSource?.span.end.byteOffset === heading.source.span.end.byteOffset;
              return (
                <li key={`${heading.source.span.start.byteOffset}-${idx}`}>
                  <button
                    type="button"
                    className={`bp-chip-button${isSelectedHeading ? ' bp-selected' : ''}`}
                    disabled={disabled}
                    onClick={() =>
                      onSelect({
                        snapshotId: snapshot.snapshotId,
                        documentId: activeDocument.id,
                        recordKey: selection?.recordKey ?? null,
                        diagnosticId: null,
                        source: heading.source,
                      })
                    }
                  >
                    <span className="bp-mono">H{heading.depth}</span> {heading.text}{' '}
                    <span className="bp-mono">({heading.source.span.start.line}:{heading.source.span.start.column})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeSource && onClearDetail && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <button
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={onClearDetail}
          >
            Clear source range highlight
          </button>
        </div>
      )}

      <pre
        className="bp-source-box"
        tabIndex={0}
        aria-label={`Exact captured Markdown text for ${activeDocument.relativePath}`}
      >
        {hasValidSpan && endOffset > startOffset ? (
          <>
            {text.slice(0, startOffset)}
            <mark ref={highlightRef} className="bp-source-highlight">
              {text.slice(startOffset, endOffset)}
            </mark>
            {text.slice(endOffset)}
          </>
        ) : (
          text
        )}
      </pre>
    </Panel>
  );
}
