import { useEffect, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { DevelopmentAction, ProjectDetail, ReleaseWorkspace as ReleaseData } from '../shared/contracts';
import { Panel } from './Panel';

type Props = {
  detail: ProjectDetail;
  selectedReleaseId: number | null;
  onSelectRelease: (id: number | null) => void;
  disabled: boolean;
  stale: boolean;
  busy: string | null;
  createRelease: (name: string) => Promise<boolean>;
  assignAction: (actionId: number, releaseId: number, stageId: number | null) => Promise<boolean>;
  setActionExclusion: (actionId: number, reason: string | null) => Promise<boolean>;
  setStageExclusion: (releaseId: number, stageId: number, reason: string | null) => Promise<boolean>;
  completeAction: (actionId: number) => Promise<boolean>;
  reopenAction: (actionId: number) => Promise<boolean>;
  recordReleaseVerification: (releaseId: number, artifact: string, evidence: string, summary: string, outcome: 'passed' | 'failed') => Promise<boolean>;
  confirmRelease: (releaseId: number, verificationId: number) => Promise<boolean>;
};

const fieldId = (prefix: string, id: number) => `${prefix}-${id}`;
const formatPercent = (value: number | null, confirmed = false) => {
  if (value === null) return '—';
  const fixed = value.toFixed(2);
  return `${!confirmed && Number(fixed) === 100 && value < 100 ? '<100' : fixed}%`;
};

export function ReleaseWorkspace({ detail, selectedReleaseId, onSelectRelease, disabled, stale, busy, ...commands }: Props) {
  const [releaseName, setReleaseName] = useState('');
  const [artifact, setArtifact] = useState('');
  const [evidence, setEvidence] = useState('');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState<'passed' | 'failed'>('passed');
  const [verificationId, setVerificationId] = useState('');
  const [stageChoices, setStageChoices] = useState<Record<number, string>>({});
  const [actionReasons, setActionReasons] = useState<Record<number, string>>({});
  const [stageReasons, setStageReasons] = useState<Record<number, string>>({});
  const selected = detail.releases.find(row => row.release.id === selectedReleaseId) ?? null;

  useEffect(() => {
    setReleaseName(''); setArtifact(''); setEvidence(''); setSummary(''); setVerificationId('');
    setStageChoices({}); setActionReasons({}); setStageReasons({});
  }, [detail.project.id, selectedReleaseId]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (await commands.createRelease(releaseName)) setReleaseName('');
  }

  async function record(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (await commands.recordReleaseVerification(selected.release.id, artifact, evidence, summary, outcome)) {
      setArtifact(''); setEvidence(''); setSummary(''); setOutcome('passed');
    }
  }

  async function commitBacklog(action: DevelopmentAction, stageId: number | null) {
    if (selected && await commands.assignAction(action.id, selected.release.id, stageId)) {
      setStageChoices(current => ({ ...current, [action.id]: '' }));
    }
  }

  return <Panel className="release-panel" id="releases-heading" title="Releases" eyebrow="Scoped delivery and manual verification">
    <form className="inline-form release-create" onSubmit={create}>
      <div className="field grow"><label htmlFor="release-name">New release name</label><input id="release-name" maxLength={120} required value={releaseName} onChange={e => setReleaseName(e.target.value)} disabled={disabled} placeholder="Release name" /></div>
      <button className="button button-primary" type="submit" disabled={disabled}>{busy === 'release' ? 'Saving…' : 'Create release'}</button>
    </form>
    {detail.releases.length ? <div className="field release-picker"><label htmlFor="release-select">Selected release</label><select id="release-select" value={selectedReleaseId ?? ''} disabled={disabled} onChange={e => onSelectRelease(e.target.value ? Number(e.target.value) : null)}><option value="">Choose a release</option>{detail.releases.map(item => <option key={item.release.id} value={item.release.id}>{item.release.name}{item.release.confirmedAt ? ' · Confirmed' : ''}</option>)}</select></div> : <p className="empty-copy">Create a release to define its committed scope and verification.</p>}
    {!selected && !stale && <p className="empty-copy">No release selected. Progress is not assessed; project backlog remains outside committed scope.</p>}
    {stale ? <p className="scope-review" role="status">Release data may be out of date. Refresh the workspace before reviewing progress or making changes.</p> : selected && <ReleaseDetails release={selected} detail={detail} disabled={disabled} busy={busy}
      stageChoices={stageChoices} setStageChoices={setStageChoices} actionReasons={actionReasons} setActionReasons={setActionReasons} stageReasons={stageReasons} setStageReasons={setStageReasons}
      artifact={artifact} setArtifact={setArtifact} evidence={evidence} setEvidence={setEvidence} summary={summary} setSummary={setSummary} outcome={outcome} setOutcome={setOutcome} verificationId={verificationId} setVerificationId={setVerificationId}
      commitBacklog={commitBacklog} onComplete={commands.completeAction} onReopen={commands.reopenAction} onSetActionExclusion={commands.setActionExclusion} onSetStageExclusion={commands.setStageExclusion} onRecord={record} onConfirm={commands.confirmRelease} />}
  </Panel>;
}

type DetailsProps = {
  release: ReleaseData; detail: ProjectDetail; disabled: boolean; busy: string | null;
  stageChoices: Record<number, string>; setStageChoices: Dispatch<SetStateAction<Record<number, string>>>;
  actionReasons: Record<number, string>; setActionReasons: Dispatch<SetStateAction<Record<number, string>>>;
  stageReasons: Record<number, string>; setStageReasons: Dispatch<SetStateAction<Record<number, string>>>;
  artifact: string; setArtifact: (value: string) => void; evidence: string; setEvidence: (value: string) => void; summary: string; setSummary: (value: string) => void;
  outcome: 'passed' | 'failed'; setOutcome: (value: 'passed' | 'failed') => void; verificationId: string; setVerificationId: (value: string) => void;
  commitBacklog: (action: DevelopmentAction, stageId: number | null) => Promise<void>; onComplete: (id: number) => Promise<boolean>; onReopen: (id: number) => Promise<boolean>;
  onSetActionExclusion: (id: number, reason: string | null) => Promise<boolean>; onSetStageExclusion: (releaseId: number, stageId: number, reason: string | null) => Promise<boolean>;
  onRecord: (event: FormEvent) => Promise<void>; onConfirm: (releaseId: number, verificationId: number) => Promise<boolean>;
};

function ReleaseDetails(props: DetailsProps) {
  const { release, detail, disabled, busy } = props;
  const { release: head, stages, progress, verifications } = release;
  const releaseActions = detail.actions.filter(action => action.releaseId === head.id);
  const backlog = detail.actions.filter(action => action.releaseId === null);
  const stageName = (id: number | null) => id === null ? 'Unassigned' : stages.find(stage => stage.id === id)?.name ?? 'Unknown stage';
  const currentStage = stages.find(stage => stage.id === progress.currentStageId);
  const blockers = progress.state === 'needs-scope-review';
  const latestVerification = verifications[0] ?? null;
  const currentPassed = latestVerification?.outcome === 'passed' && latestVerification.scopeRevision === head.scopeRevision ? [latestVerification] : [];
  const applicableWorkComplete = releaseActions.filter(action => action.kind === 'work')
    .every(action => action.exclusionReason !== null || action.completedAt !== null);
  const complete = progress.state !== 'needs-scope-review' && progress.percent !== null && progress.emptyStageIds.length === 0 && progress.unassignedActionIds.length === 0 && applicableWorkComplete;
  const canConfirm = !disabled && !head.confirmedAt && complete && currentPassed.length > 0 && currentPassed.some(v => String(v.id) === props.verificationId);

  return <div className="release-detail">
    <section className="release-summary" aria-label="Release progress summary">
      <div><span className="summary-label">Status</span><strong>{head.confirmedAt ? 'Confirmed' : blockers ? 'Needs scope review' : 'In progress'}</strong></div>
      <div><span className="summary-label">Weighted progress</span><strong>{formatPercent(progress.percent, Boolean(head.confirmedAt))}</strong></div>
      <div><span className="summary-label">Current stage</span><strong>{currentStage?.name ?? 'None'}</strong></div>
    </section>
    {progress.percent !== null && <progress className="stage-progress" aria-label="Release readiness" max={100} value={progress.percent} />}
    {blockers && <p className="scope-review" role="status">Needs scope review: resolve empty stages or unassigned release actions before this release can be confirmed.</p>}
    {(progress.emptyStageIds.length > 0 || progress.unassignedActionIds.length > 0) && <div className="scope-blockers">
      {progress.emptyStageIds.length > 0 && <p><strong>Empty stages:</strong> {progress.emptyStageIds.map(id => stageName(id)).join(', ')}</p>}
      {progress.unassignedActionIds.length > 0 && <p><strong>Unassigned actions:</strong> {progress.unassignedActionIds.map(id => `#${id} (${detail.actions.find(a => a.id === id)?.title ?? 'action'})`).join(', ')}</p>}
    </div>}
    {backlog.length > 0 && <section className="backlog-commit"><h3>Commit backlog actions</h3><p className="field-note">Suggestions stay in the project backlog until you commit each one to this release.</p><ul className="action-list">{backlog.map(action => <li className="action-row backlog-row" key={action.id}>
      <span className={`state-dot${action.completedAt ? ' done' : ''}`} aria-hidden="true"/><span className="action-name">{action.title}</span>
      <label className="sr-only" htmlFor={fieldId('commit-stage', action.id)}>Stage for {action.title}</label>
      <select id={fieldId('commit-stage', action.id)} value={props.stageChoices[action.id] ?? ''} disabled={disabled || Boolean(head.confirmedAt)} onChange={e => props.setStageChoices(cur => ({ ...cur, [action.id]: e.target.value }))}>
        <option value="">Choose stage</option>{stages.filter(stage => !stage.exclusionReason).map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}<option value="unassigned">Keep unassigned</option>
      </select>
      <button className="button" disabled={disabled || Boolean(head.confirmedAt) || props.stageChoices[action.id] === undefined || props.stageChoices[action.id] === ''} onClick={() => void props.commitBacklog(action, props.stageChoices[action.id] === 'unassigned' ? null : Number(props.stageChoices[action.id]))}>Commit</button>
    </li>)}</ul></section>}
    <div className="stage-grid">{stages.map(stage => {
      const row = progress.stages.find(item => item.stageId === stage.id);
      const actions = releaseActions.filter(action => action.stageId === stage.id);
      const finalStage = stage.key === 'release_confirmation';
      const canExclude = !finalStage && actions.every(action => Boolean(action.exclusionReason)) && !stage.exclusionReason && !head.confirmedAt;
      return <article className={`stage-card${stage.exclusionReason ? ' stage-excluded' : ''}`} key={stage.id}>
        <div className="stage-heading"><div><p className="eyebrow">Stage {stage.position + 1}</p><h3>{stage.name}</h3></div><strong>{stage.exclusionReason ? 'Excluded' : formatPercent(row?.percent ?? null, Boolean(head.confirmedAt))}</strong></div>
        <p className="stage-count">{row?.completedActions ?? 0} / {row?.totalActions ?? 0} applicable actions complete · {actions.length} committed action{actions.length === 1 ? '' : 's'}</p>
        {row?.percent !== null && row?.percent !== undefined && <progress className="stage-progress" aria-label={`Readiness: ${stage.name}`} max={100} value={row.percent} />}
        {stage.exclusionReason && <p className="exclusion-note">Excluded: {stage.exclusionReason}</p>}
        {actions.length ? <ul className="action-list stage-actions">{actions.map(action => <li className="action-row" key={action.id}>
          <span className={`state-dot${action.completedAt ? ' done' : ''}`} aria-hidden="true"/><span className={`action-name${action.completedAt ? ' completed' : ''}`}>{action.title}</span>
          {action.kind === 'release-confirmation' ? <span className="field-note">{action.completedAt ? 'Confirmed from recorded verification' : 'Protected: requires current passed verification and explicit confirmation below.'}</span> : <>
          {action.exclusionReason && <span className="exclusion-note">Excluded: {action.exclusionReason}</span>}
          {action.completedAt ? <button className="complete-button" onClick={() => void props.onReopen(action.id)} disabled={disabled || Boolean(head.confirmedAt)}>Reopen</button> : <button className="complete-button" onClick={() => void props.onComplete(action.id)} disabled={disabled || Boolean(head.confirmedAt)}>{busy === 'complete' ? 'Saving…' : 'Mark complete'}</button>}
          <label className="sr-only" htmlFor={fieldId('move-stage', action.id)}>Move {action.title} to stage</label><select className="stage-move-select" id={fieldId('move-stage', action.id)} value={props.stageChoices[action.id] ?? ''} disabled={disabled || Boolean(head.confirmedAt)} onChange={e => props.setStageChoices(cur => ({ ...cur, [action.id]: e.target.value }))}><option value="">Change stage</option>{stages.filter(option => option.id !== stage.id && !option.exclusionReason).map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
          <button className="button" disabled={disabled || Boolean(head.confirmedAt) || !props.stageChoices[action.id]} onClick={() => void props.commitBacklog(action, Number(props.stageChoices[action.id]))}>Move stage</button>
          {!action.exclusionReason && !head.confirmedAt && <details className="exclude-control"><summary>Exclude</summary><form onSubmit={async e => { e.preventDefault(); const reason = props.actionReasons[action.id] ?? ''; if (await props.onSetActionExclusion(action.id, reason)) props.setActionReasons(cur => ({ ...cur, [action.id]: '' })); }}>
            <label htmlFor={fieldId('action-exclusion', action.id)}>Required reason for excluding {action.title}</label><input id={fieldId('action-exclusion', action.id)} maxLength={2000} required value={props.actionReasons[action.id] ?? ''} onChange={e => props.setActionReasons(cur => ({ ...cur, [action.id]: e.target.value }))} disabled={disabled}/><button className="button" type="submit" disabled={disabled}>Save exclusion</button>
          </form></details>}
          {action.exclusionReason && !head.confirmedAt && <button className="text-button" onClick={() => void props.onSetActionExclusion(action.id, null)} disabled={disabled}>Restore to scope</button>}
          </>}
        </li>)}</ul> : <p className="empty-copy stage-empty">No committed actions in this stage.</p>}
        {!stage.exclusionReason && !head.confirmedAt && !finalStage && <details className="exclude-control stage-exclude">
          <summary>Exclude stage</summary><form onSubmit={async e => { e.preventDefault(); const reason = props.stageReasons[stage.id] ?? ''; if (await props.onSetStageExclusion(head.id, stage.id, reason)) props.setStageReasons(cur => ({ ...cur, [stage.id]: '' })); }}>
            <label htmlFor={fieldId('stage-exclusion', stage.id)}>Required reason for excluding {stage.name}</label><input id={fieldId('stage-exclusion', stage.id)} maxLength={2000} required value={props.stageReasons[stage.id] ?? ''} onChange={e => props.setStageReasons(cur => ({ ...cur, [stage.id]: e.target.value }))} disabled={disabled || !canExclude}/><button className="button" type="submit" disabled={disabled || !canExclude}>Save stage exclusion</button>
          </form>{!canExclude && <p className="field-note">A stage can be excluded only when it has no applicable committed actions.</p>}
        </details>}
        {stage.exclusionReason && !head.confirmedAt && <button className="text-button" onClick={() => void props.onSetStageExclusion(head.id, stage.id, null)} disabled={disabled}>Restore stage to scope</button>}
      </article>;
    })}</div>
    {releaseActions.some(action => action.stageId === null) && <section className="unassigned-release"><h3>Unassigned release actions</h3><p className="field-note">These actions are committed to this release but need a stage assignment.</p><ul className="action-list">{releaseActions.filter(action => action.stageId === null).map(action => <li className="action-row release-unassigned-row" key={action.id}>
      <span className={`state-dot${action.completedAt ? ' done' : ''}`} aria-hidden="true"/><span className="action-name">{action.title}</span>
      {action.completedAt ? <button className="complete-button" onClick={() => void props.onReopen(action.id)} disabled={disabled || Boolean(head.confirmedAt)}>Reopen</button> : <button className="complete-button" onClick={() => void props.onComplete(action.id)} disabled={disabled || Boolean(head.confirmedAt)}>Mark complete</button>}
      <label className="sr-only" htmlFor={fieldId('reassign-stage', action.id)}>Assign stage for {action.title}</label><select id={fieldId('reassign-stage', action.id)} value={props.stageChoices[action.id] ?? ''} disabled={disabled || Boolean(head.confirmedAt)} onChange={e => props.setStageChoices(cur => ({ ...cur, [action.id]: e.target.value }))}><option value="">Choose stage</option>{stages.filter(stage => !stage.exclusionReason).map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select>
      <button className="button" disabled={disabled || Boolean(head.confirmedAt) || !props.stageChoices[action.id]} onClick={() => void props.commitBacklog(action, Number(props.stageChoices[action.id]))}>Assign stage</button>
      {action.exclusionReason && <span className="exclusion-note">Excluded: {action.exclusionReason}</span>}
      {!action.exclusionReason && !head.confirmedAt && <details className="exclude-control"><summary>Exclude</summary><form onSubmit={async e => { e.preventDefault(); const reason = props.actionReasons[action.id] ?? ''; if (await props.onSetActionExclusion(action.id, reason)) props.setActionReasons(cur => ({ ...cur, [action.id]: '' })); }}><label htmlFor={fieldId('action-exclusion', action.id)}>Required reason for excluding {action.title}</label><input id={fieldId('action-exclusion', action.id)} maxLength={2000} required value={props.actionReasons[action.id] ?? ''} onChange={e => props.setActionReasons(cur => ({ ...cur, [action.id]: e.target.value }))} disabled={disabled}/><button className="button" type="submit" disabled={disabled}>Save exclusion</button></form></details>}
      {action.exclusionReason && !head.confirmedAt && <button className="text-button" onClick={() => void props.onSetActionExclusion(action.id, null)} disabled={disabled}>Restore to scope</button>}
    </li>)}</ul></section>}
    <details className="verification-history"><summary>Manual verification history ({verifications.length})</summary>{verifications.length ? <ol>{verifications.map(item => <li key={item.id}>
      <strong>{item.outcome === 'passed' ? 'Passed' : 'Failed'} · scope revision {item.scopeRevision}{item.scopeRevision !== head.scopeRevision ? ' · stale for current scope' : ''}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time><p><b>Artifact/version:</b> {item.artifactIdentity}</p><p><b>Evidence reference:</b> {item.evidenceReference}</p><p>{item.summary}</p>
    </li>)}</ol> : <p className="empty-copy">No manual verification has been recorded.</p>}</details>
    {!head.confirmedAt && <section className="manual-verification"><h3>Manual verification</h3><p className="field-note">Record a human verification result and its evidence reference for this exact scope revision.</p>
      <form className="checkpoint-form" onSubmit={props.onRecord}>
        <div className="field"><label htmlFor="verification-artifact">Artifact/version identity</label><input id="verification-artifact" maxLength={300} required value={props.artifact} onChange={e => props.setArtifact(e.target.value)} disabled={disabled} /></div>
        <div className="field"><label htmlFor="verification-evidence">Evidence reference</label><textarea id="verification-evidence" maxLength={2000} required rows={2} value={props.evidence} onChange={e => props.setEvidence(e.target.value)} disabled={disabled} /></div>
        <div className="field"><label htmlFor="verification-summary">Verification summary</label><textarea id="verification-summary" maxLength={10000} required rows={3} value={props.summary} onChange={e => props.setSummary(e.target.value)} disabled={disabled} /></div>
        <div className="field"><label htmlFor="verification-outcome">Verification outcome</label><select id="verification-outcome" value={props.outcome} onChange={e => props.setOutcome(e.target.value as 'passed' | 'failed')} disabled={disabled}><option value="passed">Passed</option><option value="failed">Failed</option></select></div>
        <div className="form-actions"><span className="field-note">Manual verification only; no automated proof is implied.</span><button className="button button-primary" type="submit" disabled={disabled}>{busy === 'release' ? 'Saving…' : 'Record verification'}</button></div>
      </form>
    </section>}
    {!head.confirmedAt && <section className="confirm-release"><h3>Confirm release</h3><p className="field-note">Confirmation requires complete applicable work and a passed manual verification for revision {head.scopeRevision}.</p>
      <div className="field"><label htmlFor="confirm-verification">Passed verification for this scope revision</label><select id="confirm-verification" value={props.verificationId} onChange={e => props.setVerificationId(e.target.value)} disabled={disabled || currentPassed.length === 0}><option value="">Choose verification</option>{currentPassed.map(item => <option key={item.id} value={item.id}>#{item.id} · {new Date(item.createdAt).toLocaleString()}</option>)}</select></div>
      <button className="button button-primary" onClick={() => void props.onConfirm(head.id, Number(props.verificationId))} disabled={!canConfirm}>Confirm using selected passed verification</button>
    </section>}
    {head.confirmedAt && <p className="confirmed-state" role="status">Confirmed {new Date(head.confirmedAt).toLocaleString()}. Scope and stage controls are frozen.</p>}
  </div>;
}
