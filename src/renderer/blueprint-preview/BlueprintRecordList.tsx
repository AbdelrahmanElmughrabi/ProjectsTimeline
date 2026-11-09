import { Panel } from '../Panel';
import type {
  BlueprintPreviewSnapshot,
  PreviewDocument,
  PreviewOccurrence,
  PreviewSelection,
  PreviewStageAssignment,
  PreviewWorkflowResolution,
} from '../../shared/blueprint-preview';
import { formatSourceSpan } from './BlueprintDiagnostics';
import {
  recordRoleBadge,
  stageAssignmentBadge,
  validationBadgeClass,
  validationLabel,
  workflowStatusLabel,
} from './BlueprintRecordInspector';

export function BlueprintRecordList({
  snapshot,
  selection,
  disabled,
  documentsById,
  occurrencesByKey,
  workflowsByScopeKey,
  assignmentsByActionKey,
  onSelect,
  onRememberTrigger,
}: {
  snapshot: BlueprintPreviewSnapshot;
  selection: PreviewSelection | null;
  disabled: boolean;
  documentsById: ReadonlyMap<string, PreviewDocument>;
  occurrencesByKey: ReadonlyMap<string, PreviewOccurrence>;
  workflowsByScopeKey: ReadonlyMap<string, PreviewWorkflowResolution>;
  assignmentsByActionKey: ReadonlyMap<string, PreviewStageAssignment>;
  onSelect: (selection: PreviewSelection) => void;
  onRememberTrigger?: (element: HTMLElement | null) => void;
}) {
  const validRecords = snapshot.records.filter(
    (occ): occ is Extract<PreviewOccurrence, { state: 'record' }> => occ.state === 'record',
  );
  const invalidRecords = snapshot.records.filter(
    (occ): occ is Extract<PreviewOccurrence, { state: 'invalid-record' }> => occ.state === 'invalid-record',
  );

  const projectRecords = validRecords.filter((occ) => occ.record.kind === 'project');
  const requirementRecords = validRecords.filter((occ) => occ.record.kind === 'requirement');
  const scopeRecords = validRecords.filter((occ) => occ.record.kind === 'scope');
  const actionRecords = validRecords.filter((occ) => occ.record.kind === 'action');
  const decisionRecords = validRecords.filter((occ) => occ.record.kind === 'decision');
  const checkRecords = validRecords.filter((occ) => occ.record.kind === 'check');

  function selectOccurrence(occ: PreviewOccurrence, trigger: HTMLElement) {
    onRememberTrigger?.(trigger);
    onSelect({
      snapshotId: snapshot.snapshotId,
      documentId: occ.metadataSource.documentId,
      recordKey: occ.key,
      diagnosticId: null,
      source: occ.metadataSource,
    });
  }

  function renderRecordButton(
    occ: Extract<PreviewOccurrence, { state: 'record' }>,
    options?: { depth?: number; note?: string },
  ) {
    const isSelected = selection?.recordKey === occ.key;
    const role = recordRoleBadge(occ.record);
    const assign = occ.record.kind === 'action' ? assignmentsByActionKey.get(occ.key) : undefined;
    const assignInfo = assign ? stageAssignmentBadge(assign) : null;
    const wf = occ.record.kind === 'scope' ? workflowsByScopeKey.get(occ.key) : undefined;
    const wfInfo = occ.record.kind === 'scope' ? workflowStatusLabel(wf) : null;

    const indentRem = options?.depth ? Math.min(options.depth, 8) * 1.1 : 0;

    return (
      <li
        key={occ.key}
        className="bp-record-item"
        style={indentRem ? { paddingLeft: `${indentRem}rem` } : undefined}
      >
        <button
          type="button"
          className={`bp-record-button${isSelected ? ' bp-selected' : ''}`}
          disabled={disabled}
          aria-current={isSelected ? 'true' : undefined}
          onClick={(event) => selectOccurrence(occ, event.currentTarget)}
        >
          <div className="bp-record-top">
            <span className="bp-record-title">
              {occ.record.title}{' '}
              <span className="bp-mono" style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>
                ({occ.record.id})
              </span>
            </span>
            <div className="bp-record-badges">
              <span className={role.className}>{role.label}</span>
              {wfInfo && <span className={wfInfo.badgeClass}>{wfInfo.label}</span>}
              {assignInfo && <span className={assignInfo.badgeClass}>{assignInfo.label}</span>}
              <span className={validationBadgeClass(occ.validation)}>{validationLabel(occ.validation)}</span>
              {occ.diagnosticIds.length > 0 && (
                <span className="bp-badge bp-badge-warning">
                  {occ.diagnosticIds.length} diagnostic{occ.diagnosticIds.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
          <div className="bp-record-sub">
            <span className="bp-mono">Occurrence {occ.key}</span>
            <span>·</span>
            <span className="bp-mono">{formatSourceSpan(occ.metadataSource, documentsById)}</span>
            {options?.note && (
              <>
                <span>·</span>
                <span>{options.note}</span>
              </>
            )}
          </div>
        </button>

        {/* For scopes, show inline stage summary and grouped actions */}
        {occ.record.kind === 'scope' && (
          <div className="bp-scope-stages">
            {wf && wf.stages.length > 0 ? (
              <>
                <span className="field-note">
                  Authored inline stage order ({wf.stages.length} stage{wf.stages.length === 1 ? '' : 's'}):
                </span>
                <ol className="bp-stage-pill-list" aria-label={`Stages for ${occ.record.title}`}>
                  {wf.stages.map((stage, idx) => {
                    const stageActionCount = snapshot.assignments.filter(
                      (a) => a.scopeKey === occ.key && a.stageKey === stage.key && a.status === 'resolved',
                    ).length;
                    return (
                      <li key={stage.key} className="bp-badge">
                        <span>{idx + 1}. {stage.title}</span>
                        <code className="bp-mono">({stage.key})</code>
                        <span>· {stageActionCount} action{stageActionCount === 1 ? '' : 's'}</span>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : wf && (wf.status === 'unresolved' || wf.status === 'incompatible') ? (
              <span className="field-note" style={{ color: 'var(--status-warning)' }}>
                {workflowStatusLabel(wf).explanation}
              </span>
            ) : (
              <span className="field-note">No workflow stages declared on this scope.</span>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <Panel
      id="blueprint-outline-heading"
      title="Engineering outline"
      eyebrow={`${snapshot.counts.occurrences} total occurrence${snapshot.counts.occurrences === 1 ? '' : 's'} · ${snapshot.counts.unparsed} unparsed / invalid record${snapshot.counts.unparsed === 1 ? '' : 's'}`}
      accessory={
        <span className="count-pill" aria-label={`Occurrence count: ${snapshot.counts.occurrences}`}>
          {snapshot.counts.occurrences}
        </span>
      }
    >
      <p className="bp-panel-subnote">
        Authored presentation order does not imply engineering priority, execution readiness, or completion. Proposals, decisions, and planned checks remain uncommitted in V2 preview.
      </p>

      <div className="bp-outline-groups">
        {/* 1. Project */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-project">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-project">1. Project manifest</h3>
            <span className="count-pill">{projectRecords.length}</span>
          </div>
          {snapshot.projectKey === null && (
            <p className="field-note" style={{ margin: '0 0 var(--space-2)', color: 'var(--status-error)' }}>
              No unique schema-valid project record exists in this snapshot (projectKey is null).
            </p>
          )}
          {projectRecords.length ? (
            <ul className="bp-record-list">{projectRecords.map((occ) => renderRecordButton(occ))}</ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No valid project record parsed.
            </p>
          )}
        </section>

        {/* 2. Components / Features */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-structure">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-structure">2. Components & features (backend acyclic outline)</h3>
            <span className="count-pill">
              {snapshot.structure.rows.length +
                snapshot.structure.unplacedFeatureKeys.length +
                snapshot.structure.invalidStructureKeys.length}
            </span>
          </div>
          {snapshot.structure.rows.length > 0 ? (
            <ul className="bp-record-list" aria-label="Acyclic component and feature hierarchy">
              {snapshot.structure.rows.map(({ recordKey, depth }) => {
                const occ = occurrencesByKey.get(recordKey);
                if (!occ || occ.state !== 'record') return null;
                return renderRecordButton(occ, { depth, note: `Depth ${depth}` });
              })}
            </ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No acyclic component/feature hierarchy rows.
            </p>
          )}

          {snapshot.structure.unplacedFeatureKeys.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <p className="field-note" style={{ margin: '0 0 var(--space-1)' }}>
                Unplaced features (no primary component):
              </p>
              <ul className="bp-record-list">
                {snapshot.structure.unplacedFeatureKeys.map((key) => {
                  const occ = occurrencesByKey.get(key);
                  if (!occ || occ.state !== 'record') return null;
                  return renderRecordButton(occ, { note: 'Unplaced feature' });
                })}
              </ul>
            </div>
          )}

          {snapshot.structure.invalidStructureKeys.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <p className="field-note" style={{ margin: '0 0 var(--space-1)', color: 'var(--status-error)' }}>
                Invalid / cyclic / dangling structure records (flat, never recursively traversed):
              </p>
              <ul className="bp-record-list">
                {snapshot.structure.invalidStructureKeys.map((key) => {
                  const occ = occurrencesByKey.get(key);
                  if (!occ || occ.state !== 'record') return null;
                  return renderRecordButton(occ, { note: 'Invalid / cyclic structure' });
                })}
              </ul>
            </div>
          )}
        </section>

        {/* 3. Requirements */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-requirements">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-requirements">3. Requirements (functional, quality, constraint)</h3>
            <span className="count-pill">{requirementRecords.length}</span>
          </div>
          {requirementRecords.length ? (
            <ul className="bp-record-list">
              {requirementRecords.map((occ) =>
                renderRecordButton(occ, {
                  note:
                    occ.record.kind === 'requirement'
                      ? occ.record.features.length
                        ? `Features: ${occ.record.features.join(', ')}`
                        : 'Project-wide requirement'
                      : undefined,
                }),
              )}
            </ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No requirement records in this snapshot.
            </p>
          )}
        </section>

        {/* 4. Scopes */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-scopes">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-scopes">4. Development scopes & workflow stages</h3>
            <span className="count-pill">{scopeRecords.length}</span>
          </div>
          {scopeRecords.length ? (
            <ul className="bp-record-list">{scopeRecords.map((occ) => renderRecordButton(occ))}</ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No development scope records in this snapshot.
            </p>
          )}
        </section>

        {/* 5. Proposed Actions */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-actions">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-actions">5. Proposed actions (uncommitted)</h3>
            <span className="count-pill">{actionRecords.length}</span>
          </div>
          {actionRecords.length ? (
            <ul className="bp-record-list">
              {actionRecords.map((occ) =>
                renderRecordButton(occ, {
                  note:
                    occ.record.kind === 'action' && occ.record.scope
                      ? `Scope: ${occ.record.scope}`
                      : 'Unscoped',
                }),
              )}
            </ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No proposed action records in this snapshot.
            </p>
          )}
        </section>

        {/* 6. Proposed Decisions */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-decisions">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-decisions">6. Proposed decisions (not accepted)</h3>
            <span className="count-pill">{decisionRecords.length}</span>
          </div>
          {decisionRecords.length ? (
            <ul className="bp-record-list">{decisionRecords.map((occ) => renderRecordButton(occ))}</ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No decision records in this snapshot.
            </p>
          )}
        </section>

        {/* 7. Planned Checks */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-checks">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-checks">7. Planned checks (not executed)</h3>
            <span className="count-pill">{checkRecords.length}</span>
          </div>
          {checkRecords.length ? (
            <ul className="bp-record-list">{checkRecords.map((occ) => renderRecordButton(occ))}</ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              No planned check records in this snapshot.
            </p>
          )}
        </section>

        {/* 8. Unparsed / Invalid Records */}
        <section className="bp-outline-section" aria-labelledby="bp-sec-invalid">
          <div className="bp-outline-heading">
            <h3 id="bp-sec-invalid">8. Unparsed / invalid records</h3>
            <span className="count-pill">{invalidRecords.length}</span>
          </div>
          {invalidRecords.length ? (
            <ul className="bp-record-list">
              {invalidRecords.map((occ) => {
                const isSelected = selection?.recordKey === occ.key;
                return (
                  <li key={occ.key} className="bp-record-item">
                    <button
                      type="button"
                      className={`bp-record-button${isSelected ? ' bp-selected' : ''}`}
                      disabled={disabled}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={(event) => selectOccurrence(occ, event.currentTarget)}
                    >
                      <div className="bp-record-top">
                        <span className="bp-record-title">
                          {occ.declaredId ? `Invalid record (${occ.declaredId})` : `Malformed / invalid occurrence (${occ.key})`}
                        </span>
                        <div className="bp-record-badges">
                          <span className="bp-badge bp-badge-error">Unparsed / invalid record</span>
                          {occ.declaredKind && (
                            <span className="bp-badge bp-mono">Declared kind: {occ.declaredKind}</span>
                          )}
                          <span className="bp-badge bp-badge-warning">
                            {occ.diagnosticIds.length} diagnostic{occ.diagnosticIds.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                      <div className="bp-record-sub">
                        <span className="bp-mono">Occurrence {occ.key}</span>
                        <span>·</span>
                        <span className="bp-mono">{formatSourceSpan(occ.metadataSource, documentsById)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-copy" style={{ marginTop: 0 }}>
              Zero unparsed or invalid record occurrences in this snapshot.
            </p>
          )}
        </section>
      </div>
    </Panel>
  );
}
