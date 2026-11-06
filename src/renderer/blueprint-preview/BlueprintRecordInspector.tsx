import { Panel } from '../Panel';
import type {
  BlueprintPreviewSnapshot,
  PreviewDiagnostic,
  PreviewDocument,
  PreviewOccurrence,
  PreviewRecord,
  PreviewRelationship,
  PreviewSelection,
  PreviewStageAssignment,
  PreviewValidation,
  PreviewWorkflowResolution,
} from '../../shared/blueprint-preview';
import { formatSourceSpan, severityBadgeClass, severityLabel } from './BlueprintDiagnostics';

export function validationLabel(validation: PreviewValidation): string {
  switch (validation) {
    case 'valid':
      return 'Valid';
    case 'needs-review':
      return 'Needs review';
    case 'invalid':
      return 'Invalid';
  }
}

export function validationBadgeClass(validation: PreviewValidation): string {
  switch (validation) {
    case 'valid':
      return 'bp-badge bp-badge-valid';
    case 'needs-review':
      return 'bp-badge bp-badge-review';
    case 'invalid':
      return 'bp-badge bp-badge-invalid';
  }
}

export function recordRoleBadge(record: PreviewRecord): { label: string; className: string } {
  switch (record.kind) {
    case 'project':
      return { label: 'Project manifest', className: 'bp-badge bp-badge-accent' };
    case 'component':
      return { label: 'Permanent component', className: 'bp-badge' };
    case 'feature':
      return { label: 'Permanent feature', className: 'bp-badge' };
    case 'requirement':
      return { label: `Requirement · ${record.type}`, className: 'bp-badge bp-badge-accent' };
    case 'scope':
      return { label: 'Development scope (proposal)', className: 'bp-badge bp-badge-accent' };
    case 'action':
      return { label: `Proposed action (uncommitted · ${record.action_type})`, className: 'bp-badge bp-badge-accent' };
    case 'decision':
      return { label: 'Proposed decision (not accepted)', className: 'bp-badge bp-badge-accent' };
    case 'check':
      return { label: `Planned check (not executed · ${record.method ?? 'unspecified'})`, className: 'bp-badge bp-badge-accent' };
  }
}

export function workflowStatusLabel(resolution: PreviewWorkflowResolution | undefined): {
  label: string;
  badgeClass: string;
  explanation: string;
} {
  if (!resolution) {
    return {
      label: 'No workflow',
      badgeClass: 'bp-badge',
      explanation: 'No workflow stage structure declared for this scope.',
    };
  }
  switch (resolution.status) {
    case 'none':
      return {
        label: 'No workflow',
        badgeClass: 'bp-badge',
        explanation: 'This scope organizes work without stage columns.',
      };
    case 'inline':
      return {
        label: `Inline stages (${resolution.stages.length})`,
        badgeClass: 'bp-badge bp-badge-valid',
        explanation: 'Explicit inline stage array in authored order.',
      };
    case 'unresolved':
      return {
        label: 'Needs review · Unresolved workflow',
        badgeClass: 'bp-badge bp-badge-resolution',
        explanation: 'Referenced development workflow template key/version is unavailable in the local library. No stages are fabricated.',
      };
    case 'incompatible':
      return {
        label: 'Needs review · Incompatible release workflow',
        badgeClass: 'bp-badge bp-badge-resolution',
        explanation: 'Current library templates are release-only with mandatory protected closing confirmation and cannot be transferred to a development scope.',
      };
  }
}

export function stageAssignmentBadge(assignment: PreviewStageAssignment | undefined): {
  label: string;
  badgeClass: string;
} {
  if (!assignment) {
    return { label: 'Unscoped', badgeClass: 'bp-badge' };
  }
  switch (assignment.status) {
    case 'unscoped':
      return { label: 'Unscoped', badgeClass: 'bp-badge' };
    case 'unassigned':
      return { label: 'Unassigned to stage', badgeClass: 'bp-badge' };
    case 'resolved':
      return {
        label: `Stage: ${assignment.stageTitle ?? assignment.stageKey ?? 'resolved'} (${assignment.stageKey})`,
        badgeClass: 'bp-badge bp-badge-valid',
      };
    case 'unresolved-workflow':
      return {
        label: `Stage pending workflow review (${assignment.stageKey ?? 'none'})`,
        badgeClass: 'bp-badge bp-badge-resolution',
      };
    case 'invalid':
      return {
        label: `Invalid stage target (${assignment.stageKey ?? 'unknown'})`,
        badgeClass: 'bp-badge bp-badge-error',
      };
  }
}

export function relationshipStatusBadge(status: PreviewRelationship['status']): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'resolved':
      return { label: 'Resolved', badgeClass: 'bp-badge bp-badge-valid' };
    case 'missing':
      return { label: 'Missing target', badgeClass: 'bp-badge bp-badge-error' };
    case 'wrong-kind':
      return { label: 'Wrong target kind', badgeClass: 'bp-badge bp-badge-error' };
    case 'wrong-project':
      return { label: 'Cross-project target', badgeClass: 'bp-badge bp-badge-error' };
    case 'ambiguous':
      return { label: 'Ambiguous (duplicate IDs)', badgeClass: 'bp-badge bp-badge-error' };
  }
}

export function BlueprintRecordInspector({
  snapshot,
  selection,
  disabled,
  occurrence,
  documentsById,
  occurrencesByKey,
  diagnosticsById,
  workflowsByScopeKey,
  assignmentsByActionKey,
  outboundByFromKey,
  inboundByTargetKey,
  inboundUnresolvedByTargetId,
  onSelect,
  onClearDetail,
}: {
  snapshot: BlueprintPreviewSnapshot;
  selection: PreviewSelection | null;
  disabled: boolean;
  occurrence: PreviewOccurrence | null;
  documentsById: ReadonlyMap<string, PreviewDocument>;
  occurrencesByKey: ReadonlyMap<string, PreviewOccurrence>;
  diagnosticsById: ReadonlyMap<string, PreviewDiagnostic>;
  workflowsByScopeKey: ReadonlyMap<string, PreviewWorkflowResolution>;
  assignmentsByActionKey: ReadonlyMap<string, PreviewStageAssignment>;
  outboundByFromKey: ReadonlyMap<string, readonly PreviewRelationship[]>;
  inboundByTargetKey: ReadonlyMap<string, readonly PreviewRelationship[]>;
  inboundUnresolvedByTargetId: ReadonlyMap<string, readonly PreviewRelationship[]>;
  onSelect: (selection: PreviewSelection) => void;
  onClearDetail: () => void;
}) {
  if (!occurrence) {
    const selectedDiag = selection?.diagnosticId ? diagnosticsById.get(selection.diagnosticId) ?? null : null;
    return (
      <Panel
        id="blueprint-inspector-heading"
        title="Selected-record inspector"
        eyebrow="Connected engineering context"
      >
        {selectedDiag ? (
          <div>
            <div className="bp-inspector-toolbar">
              <div className="bp-record-badges">
                <span className={severityBadgeClass(selectedDiag.severity)}>
                  {severityLabel(selectedDiag.severity)}
                </span>
                <span className="bp-badge bp-mono">{selectedDiag.code}</span>
              </div>
              <button
                type="button"
                className="text-button"
                disabled={disabled}
                onClick={onClearDetail}
              >
                ← Back to outline
              </button>
            </div>
            <p style={{ margin: '0 0 var(--space-2)' }}>{selectedDiag.message}</p>
            <p className="field-note" style={{ margin: 0 }}>
              Location: <code className="bp-mono">{formatSourceSpan(selectedDiag.source, documentsById)}</code>
            </p>
          </div>
        ) : (
          <p className="empty-copy">
            Select any project, component, feature, requirement, scope, proposed action, decision, planned check, or invalid record occurrence from the outline to inspect its fields, relationships, narrative, and exact captured source span.
          </p>
        )}
      </Panel>
    );
  }

  const recordDiagnostics = occurrence.diagnosticIds
    .map((id) => diagnosticsById.get(id))
    .filter((d): d is PreviewDiagnostic => d !== undefined);

  const outbound = outboundByFromKey.get(occurrence.key) ?? [];
  const inboundResolved = inboundByTargetKey.get(occurrence.key) ?? [];
  const declaredId = occurrence.state === 'record' ? occurrence.record.id : occurrence.declaredId;
  const inboundById =
    declaredId !== null
      ? (inboundUnresolvedByTargetId.get(declaredId) ?? []).filter(
          (rel) => !inboundResolved.some((r) => r.id === rel.id),
        )
      : [];
  const allInbound = [...inboundResolved, ...inboundById];

  const isInvalidRecord = occurrence.state === 'invalid-record';
  const title =
    occurrence.state === 'record'
      ? occurrence.record.title
      : occurrence.declaredId
        ? `Invalid occurrence (${occurrence.declaredId})`
        : `Invalid occurrence (${occurrence.key})`;

  const eyebrow =
    occurrence.state === 'record'
      ? `${occurrence.record.kind.toUpperCase()} · ${occurrence.record.id} · Occurrence ${occurrence.key}`
      : `INVALID RECORD · ${occurrence.declaredKind ?? 'unknown kind'} · Occurrence ${occurrence.key}`;

  return (
    <Panel
      id="blueprint-inspector-heading"
      title={title}
      eyebrow={eyebrow}
      accessory={
        occurrence.state === 'record' ? (
          <span className={validationBadgeClass(occurrence.validation)}>
            {validationLabel(occurrence.validation)}
          </span>
        ) : (
          <span className="bp-badge bp-badge-invalid">Unparsed / invalid record</span>
        )
      }
    >
      <div className="bp-inspector-toolbar">
        <div className="bp-record-badges">
          {occurrence.state === 'record' ? (
            <span className={recordRoleBadge(occurrence.record).className}>
              {recordRoleBadge(occurrence.record).label}
            </span>
          ) : (
            <span className="bp-badge bp-badge-error">Malformed or schema-invalid PTB block</span>
          )}
          <button
            type="button"
            className="bp-chip-button"
            disabled={disabled}
            onClick={() =>
              onSelect({
                snapshotId: snapshot.snapshotId,
                documentId: occurrence.metadataSource.documentId,
                recordKey: occurrence.key,
                diagnosticId: null,
                source: occurrence.metadataSource,
              })
            }
          >
            Metadata span ({formatSourceSpan(occurrence.metadataSource, documentsById)})
          </button>
          <button
            type="button"
            className="bp-chip-button"
            disabled={disabled}
            onClick={() =>
              onSelect({
                snapshotId: snapshot.snapshotId,
                documentId: occurrence.narrativeSource.documentId,
                recordKey: occurrence.key,
                diagnosticId: null,
                source: occurrence.narrativeSource,
              })
            }
          >
            Narrative span ({formatSourceSpan(occurrence.narrativeSource, documentsById)})
          </button>
        </div>
        <button
          type="button"
          className="text-button"
          disabled={disabled}
          onClick={onClearDetail}
        >
          ← Back to outline
        </button>
      </div>

      {/* Metadata fields */}
      <dl className="bp-dl">
        <div className="bp-dl-row">
          <dt>Occurrence key</dt>
          <dd className="bp-mono">{occurrence.key} (presentation order #{occurrence.order + 1})</dd>
        </div>
        <div className="bp-dl-row">
          <dt>External PTB ID</dt>
          <dd className="bp-mono">
            {occurrence.state === 'record' ? occurrence.record.id : occurrence.declaredId ?? 'None / unparsed'}
          </dd>
        </div>
        <div className="bp-dl-row">
          <dt>Declared kind</dt>
          <dd className="bp-mono">
            {occurrence.state === 'record' ? occurrence.record.kind : occurrence.declaredKind ?? 'None / unparsed'}
          </dd>
        </div>
        {occurrence.state === 'record' && 'project' in occurrence.record && (
          <div className="bp-dl-row">
            <dt>Owning project ID</dt>
            <dd className="bp-mono">{occurrence.record.project}</dd>
          </div>
        )}
        {occurrence.metadataSource.headingPath.length > 0 && (
          <div className="bp-dl-row">
            <dt>Active heading path</dt>
            <dd>{occurrence.metadataSource.headingPath.join(' › ')}</dd>
          </div>
        )}

        {/* Kind-specific normalized fields */}
        {occurrence.state === 'record' && occurrence.record.kind === 'project' && (
          <>
            <div className="bp-dl-row">
              <dt>Project goal</dt>
              <dd>{occurrence.record.goal || 'Not provided'}</dd>
            </div>
            <div className="bp-dl-row">
              <dt>Declared documents</dt>
              <dd className="bp-mono">
                {occurrence.record.documents.length
                  ? occurrence.record.documents.join(', ')
                  : 'Single-file blueprint (no extra manifest documents)'}
              </dd>
            </div>
            <div className="bp-dl-row">
              <dt>Declared capabilities</dt>
              <dd className="bp-mono">
                {occurrence.record.capabilities.length
                  ? occurrence.record.capabilities.join(', ')
                  : 'None'}
              </dd>
            </div>
          </>
        )}

        {occurrence.state === 'record' && occurrence.record.kind === 'component' && (
          <div className="bp-dl-row">
            <dt>Parent component</dt>
            <dd className="bp-mono">{occurrence.record.parent ?? 'Root component (null)'}</dd>
          </div>
        )}

        {occurrence.state === 'record' && occurrence.record.kind === 'feature' && (
          <div className="bp-dl-row">
            <dt>Primary component</dt>
            <dd className="bp-mono">{occurrence.record.component ?? 'Unplaced feature (null)'}</dd>
          </div>
        )}

        {occurrence.state === 'record' && occurrence.record.kind === 'requirement' && (
          <>
            <div className="bp-dl-row">
              <dt>Requirement type</dt>
              <dd>{occurrence.record.type}</dd>
            </div>
            <div className="bp-dl-row">
              <dt>Applies to features</dt>
              <dd className="bp-mono">
                {occurrence.record.features.length
                  ? occurrence.record.features.join(', ')
                  : 'Project-wide requirement (no specific feature restriction)'}
              </dd>
            </div>
            <div className="bp-dl-row">
              <dt>Acceptance criteria</dt>
              <dd>
                {occurrence.record.acceptance.length ? (
                  <ul className="bp-Plain-list">
                    {occurrence.record.acceptance.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  'None listed (ACCEPTANCE_MISSING warning)'
                )}
              </dd>
            </div>
          </>
        )}

        {occurrence.state === 'record' && occurrence.record.kind === 'scope' && (() => {
          const wf = workflowsByScopeKey.get(occurrence.key);
          const wfInfo = workflowStatusLabel(wf);
          return (
            <>
              <div className="bp-dl-row">
                <dt>Concerns features</dt>
                <dd className="bp-mono">
                  {occurrence.record.features.length ? occurrence.record.features.join(', ') : 'None'}
                </dd>
              </div>
              <div className="bp-dl-row">
                <dt>Workflow request</dt>
                <dd>
                  {occurrence.record.workflow === null ? (
                    'None (null)'
                  ) : 'stages' in occurrence.record.workflow ? (
                    `Inline stage list (${occurrence.record.workflow.stages.length} stages)`
                  ) : (
                    <span className="bp-mono">
                      Template {occurrence.record.workflow.template_key} @ v{occurrence.record.workflow.version}
                    </span>
                  )}
                </dd>
              </div>
              <div className="bp-dl-row">
                <dt>Workflow resolution</dt>
                <dd>
                  <span className={wfInfo.badgeClass}>{wfInfo.label}</span>
                  <div className="field-note" style={{ marginTop: 'var(--space-1)' }}>
                    {wfInfo.explanation}
                  </div>
                  {wf && wf.stages.length > 0 && (
                    <ol className="bp-Plain-list" style={{ marginTop: 'var(--space-2)' }}>
                      {wf.stages.map((st) => (
                        <li key={st.key}>
                          <strong>{st.title}</strong> (<code className="bp-mono">{st.key}</code>)
                        </li>
                      ))}
                    </ol>
                  )}
                </dd>
              </div>
            </>
          );
        })()}

        {occurrence.state === 'record' && occurrence.record.kind === 'action' && (() => {
          const assign = assignmentsByActionKey.get(occurrence.key);
          const assignBadge = stageAssignmentBadge(assign);
          return (
            <>
              <div className="bp-dl-row">
                <dt>Action classification</dt>
                <dd className="bp-mono">{occurrence.record.action_type}</dd>
              </div>
              <div className="bp-dl-row">
                <dt>Stage assignment</dt>
                <dd>
                  <span className={assignBadge.badgeClass}>{assignBadge.label}</span>
                </dd>
              </div>
              <div className="bp-dl-row">
                <dt>Instructions</dt>
                <dd>{occurrence.record.instructions || 'Not provided'}</dd>
              </div>
              <div className="bp-dl-row">
                <dt>Applicability</dt>
                <dd>{occurrence.record.applicability || 'Not provided'}</dd>
              </div>
              <div className="bp-dl-row">
                <dt>Definition of done</dt>
                <dd>{occurrence.record.definition_of_done || 'Not provided'}</dd>
              </div>
              <div className="bp-dl-row">
                <dt>Evidence guidance</dt>
                <dd>{occurrence.record.evidence_guidance || 'Not provided'}</dd>
              </div>
              <div className="bp-dl-row">
                <dt>Covers rule IDs</dt>
                <dd className="bp-mono">
                  {occurrence.record.covers_rule_ids.length
                    ? occurrence.record.covers_rule_ids.join(', ')
                    : 'None'}
                </dd>
              </div>
            </>
          );
        })()}

        {occurrence.state === 'record' && occurrence.record.kind === 'decision' && (
          <>
            <div className="bp-dl-row">
              <dt>Rationale</dt>
              <dd>{occurrence.record.rationale || 'Not provided'}</dd>
            </div>
            <div className="bp-dl-row">
              <dt>Alternatives considered</dt>
              <dd>
                {occurrence.record.alternatives.length ? (
                  <ul className="bp-Plain-list">
                    {occurrence.record.alternatives.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                ) : (
                  'None listed'
                )}
              </dd>
            </div>
          </>
        )}

        {occurrence.state === 'record' && occurrence.record.kind === 'check' && (
          <>
            <div className="bp-dl-row">
              <dt>Verification method</dt>
              <dd className="bp-mono">{occurrence.record.method ?? 'Unspecified (null)'}</dd>
            </div>
            <div className="bp-dl-row">
              <dt>Instructions</dt>
              <dd>{occurrence.record.instructions || 'Not provided'}</dd>
            </div>
            <div className="bp-dl-row">
              <dt>Expected outcomes</dt>
              <dd>
                {occurrence.record.expected.length ? (
                  <ul className="bp-Plain-list">
                    {occurrence.record.expected.map((exp, i) => (
                      <li key={i}>{exp}</li>
                    ))}
                  </ul>
                ) : (
                  'None listed'
                )}
              </dd>
            </div>
          </>
        )}
      </dl>

      {/* Outbound relationships */}
      {!isInvalidRecord && (
        <div className="bp-subsection">
          <h3>Outbound relationships ({outbound.length})</h3>
          {outbound.length ? (
            <ul className="bp-record-list">
              {outbound.map((rel) => {
                const statusInfo = relationshipStatusBadge(rel.status);
                return (
                  <li key={rel.id} className="bp-doc-item">
                    <div className="bp-record-top">
                      <div>
                        <span className="bp-mono">{rel.relation}</span> →{' '}
                        <strong className="bp-mono">{rel.targetId}</strong>{' '}
                        <span className="field-note">(expects {rel.expectedKind})</span>
                      </div>
                      <span className={statusInfo.badgeClass}>{statusInfo.label}</span>
                    </div>
                    <div className="bp-diag-actions">
                      <button
                        type="button"
                        className="bp-chip-button"
                        disabled={disabled}
                        onClick={() =>
                          onSelect({
                            snapshotId: snapshot.snapshotId,
                            documentId: rel.source.documentId,
                            recordKey: occurrence.key,
                            diagnosticId: null,
                            source: rel.source,
                          })
                        }
                      >
                        Reference source ({formatSourceSpan(rel.source, documentsById)})
                      </button>
                      {rel.targetKeys.map((tKey) => {
                        const targetOcc = occurrencesByKey.get(tKey);
                        const targetLabel =
                          targetOcc?.state === 'record'
                            ? `${targetOcc.record.title} (${targetOcc.record.id} · ${tKey})`
                            : `${targetOcc?.declaredId ?? tKey} (${tKey})`;
                        return (
                          <button
                            key={tKey}
                            type="button"
                            className="bp-chip-button"
                            disabled={disabled}
                            onClick={() =>
                              onSelect({
                                snapshotId: snapshot.snapshotId,
                                documentId: targetOcc?.metadataSource.documentId ?? rel.source.documentId,
                                recordKey: tKey,
                                diagnosticId: null,
                                source: targetOcc?.metadataSource ?? null,
                              })
                            }
                          >
                            Jump to target: {targetLabel}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="field-note" style={{ margin: 0 }}>
              No outbound domain relationships declared on this record.
            </p>
          )}
        </div>
      )}

      {/* Inbound relationships */}
      <div className="bp-subsection">
        <h3>Inbound relationships ({allInbound.length})</h3>
        {allInbound.length ? (
          <ul className="bp-record-list">
            {allInbound.map((rel) => {
              const fromOcc = occurrencesByKey.get(rel.fromKey);
              const fromLabel =
                fromOcc?.state === 'record'
                  ? `${fromOcc.record.title} (${fromOcc.record.id} · ${rel.fromKey})`
                  : `${fromOcc?.declaredId ?? rel.fromKey}`;
              const statusInfo = relationshipStatusBadge(rel.status);
              return (
                <li key={rel.id} className="bp-doc-item">
                  <div className="bp-record-top">
                    <div>
                      <strong className="bp-mono">{fromLabel}</strong> —{' '}
                      <span className="bp-mono">{rel.relation}</span>
                    </div>
                    <span className={statusInfo.badgeClass}>{statusInfo.label}</span>
                  </div>
                  <div className="bp-diag-actions">
                    <button
                      type="button"
                      className="bp-chip-button"
                      disabled={disabled}
                      onClick={() =>
                        onSelect({
                          snapshotId: snapshot.snapshotId,
                          documentId: fromOcc?.metadataSource.documentId ?? rel.source.documentId,
                          recordKey: rel.fromKey,
                          diagnosticId: null,
                          source: fromOcc?.metadataSource ?? rel.source,
                        })
                      }
                    >
                      Inspect source record ({rel.fromKey})
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="field-note" style={{ margin: 0 }}>
            No inbound domain relationships reference this occurrence.
          </p>
        )}
      </div>

      {/* Captured Narrative */}
      <div className="bp-subsection">
        <h3>Captured Markdown narrative (inert text)</h3>
        {occurrence.narrativeMarkdown.trim().length > 0 ? (
          <pre
            className="bp-narrative-box"
            tabIndex={0}
            aria-label={`Captured Markdown narrative for ${occurrence.key}`}
          >
            {occurrence.narrativeMarkdown}
          </pre>
        ) : (
          <p className="field-note" style={{ margin: 0 }}>
            No narrative body following this PTB fence.
          </p>
        )}
      </div>

      {/* Associated Diagnostics */}
      <div className="bp-subsection">
        <h3>Occurrence diagnostics ({recordDiagnostics.length})</h3>
        {recordDiagnostics.length ? (
          <ul className="bp-diag-list">
            {recordDiagnostics.map((diag) => (
              <li key={diag.id} className={`bp-diag-card bp-diag-${diag.severity}`}>
                <div className="bp-diag-header">
                  <div className="bp-record-badges">
                    <span className={severityBadgeClass(diag.severity)}>{severityLabel(diag.severity)}</span>
                    <span className="bp-badge bp-mono">{diag.code}</span>
                    {diag.field && <span className="bp-badge bp-mono">Field {diag.field}</span>}
                  </div>
                  <span className="bp-mono">{formatSourceSpan(diag.source, documentsById)}</span>
                </div>
                <p className="bp-diag-message">{diag.message}</p>
                <div className="bp-diag-actions">
                  {diag.source && (
                    <button
                      type="button"
                      className="bp-chip-button"
                      disabled={disabled}
                      onClick={() =>
                        onSelect({
                          snapshotId: snapshot.snapshotId,
                          documentId: diag.source ? diag.source.documentId : null,
                          recordKey: occurrence.key,
                          diagnosticId: diag.id,
                          source: diag.source,
                        })
                      }
                    >
                      Highlight diagnostic span ({formatSourceSpan(diag.source, documentsById)})
                    </button>
                  )}
                  {diag.relatedSources.map((rel, idx) => (
                    <button
                      key={`${rel.documentId}-${rel.span.start.byteOffset}-${idx}`}
                      type="button"
                      className="bp-chip-button"
                      disabled={disabled}
                      onClick={() =>
                        onSelect({
                          snapshotId: snapshot.snapshotId,
                          documentId: rel.documentId,
                          recordKey: occurrence.key,
                          diagnosticId: diag.id,
                          source: rel,
                        })
                      }
                    >
                      Related #{idx + 1}: {formatSourceSpan(rel, documentsById)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="field-note" style={{ margin: 0 }}>
            No diagnostics attached to this occurrence.
          </p>
        )}
      </div>
    </Panel>
  );
}
