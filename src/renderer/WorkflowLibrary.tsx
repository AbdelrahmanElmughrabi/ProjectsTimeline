import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { WorkflowDetail } from '../shared/contracts';
import { Panel } from './Panel';

function StageDetails({ workflow }: { workflow: WorkflowDetail }) {
  return <div className="workflow-stages">
    <p className="field-note">The app adds protected final confirmation inside the closing stage. The default workflow has seven stages.</p>
    {workflow.stages.slice().sort((a, b) => a.position - b.position).map(stage => {
      const actions = workflow.actions.filter(action => action.stageId === stage.id).sort((a, b) => a.position - b.position);
      return <section className="workflow-stage" key={stage.id}>
        <div className="workflow-stage-heading"><span>Stage {stage.position + 1}</span><h3>{stage.name}</h3>{stage.protectedClosing && <span className="read-only-badge">Protected closing</span>}</div>
        {actions.length ? <ul className="workflow-actions">{actions.map(action => <li key={action.id}>
          <h4>{action.title}</h4>
          <p>{action.instructions}</p>
          <dl>{[
            ['Applicability', action.applicability],
            ['Definition of done', action.definitionOfDone],
            ['Evidence guidance', action.evidenceGuidance],
            ['Classification', action.actionType],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </li>)}</ul> : <p className="empty-copy">No starter actions in this stage.</p>}
      </section>;
    })}
  </div>;
}

export function WorkflowLibrary({ workflows, loading, busy, stale, error, onRetry, onDuplicate }: {
  workflows: WorkflowDetail[];
  loading: boolean;
  busy: boolean;
  stale: boolean;
  error: string;
  onRetry: () => void;
  onDuplicate: (templateId: number, expectedVersion: number, name: string) => Promise<boolean>;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [copyName, setCopyName] = useState('');
  const selected = stale ? null : workflows.find(item => item.template.id === selectedId) ?? null;

  useEffect(() => {
    if (!stale && workflows.length && !workflows.some(item => item.template.id === selectedId)) setSelectedId(workflows[0].template.id);
  }, [workflows, selectedId, stale]);

  async function copy(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (await onDuplicate(selected.template.id, selected.template.version, copyName)) setCopyName('');
  }

  return <>
    <header className="page-header"><p className="eyebrow">Reusable project structure</p><h1>Workflow library</h1><p className="lede">Browse the saved starter workflows, inspect their action guidance, or make a named copy.</p></header>
    {error && <div className="notice error" role="alert">{error}</div>}
    {(stale || loading) && <div className="refresh-state" role="status"><p>{loading ? 'Loading saved workflow templates…' : 'The workflow list could not be refreshed. Saved template details are withheld until they are current.'}</p><button className="button button-primary" onClick={onRetry} disabled={busy || loading}>Retry loading</button></div>}
    {!stale && !loading && <div className="workflow-library-layout">
      <Panel id="workflow-list-heading" className="workflow-list-panel" title="Templates" eyebrow={`${workflows.length} saved template${workflows.length === 1 ? '' : 's'}`}>
        {workflows.length ? <nav className="workflow-template-list" aria-label="Workflow templates">{workflows.map(item => <button key={item.template.id} type="button" className={`workflow-template-link${selected?.template.id === item.template.id ? ' selected' : ''}`} aria-current={selected?.template.id === item.template.id ? 'true' : undefined} onClick={() => setSelectedId(item.template.id)}>
          <span className="workflow-template-title">{item.template.name}</span><span className="workflow-template-version">Version {item.template.version}{item.template.builtInKey ? ' · Built in' : ''}</span><span className="workflow-template-description">{item.template.description}</span>
        </button>)}</nav> : <p className="empty-copy">No workflow templates are available.</p>}
      </Panel>
      {selected && <Panel id="workflow-detail-heading" className="workflow-detail-panel" eyebrow={`Template · Version ${selected.template.version}`} title={selected.template.name}>
        <p className="workflow-description">{selected.template.description}</p>
        {selected.template.builtInKey && <span className="read-only-badge">Built in · read only</span>}
        <StageDetails workflow={selected} />
        <form className="workflow-copy-form" onSubmit={copy}>
          <h3>Make a copy</h3><p className="field-note">The source template stays unchanged. This creates a separately saved template.</p>
          <div className="inline-form"><div className="field grow"><label htmlFor="workflow-copy-name">Name for the copy</label><input id="workflow-copy-name" maxLength={120} required value={copyName} onChange={event => setCopyName(event.target.value)} disabled={busy} placeholder="My workflow" /></div>
            <button className="button button-primary" type="submit" disabled={busy || !copyName.trim()}>{busy ? 'Copying…' : 'Duplicate template'}</button>
          </div>
        </form>
      </Panel>}
    </div>}
  </>;
}
