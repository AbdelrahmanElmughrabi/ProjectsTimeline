import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ActionDefinitionInput, ActionType, WorkflowAction, WorkflowDetail, WorkflowStage } from '../shared/contracts';
import { Panel } from './Panel';

const actionTypes: ActionType[] = ['requirement', 'implementation', 'verification', 'decision', 'research', 'documentation'];
const idFor = (prefix: string, id: number) => `${prefix}-${id}`;

function StageDetails({ workflow }: { workflow: WorkflowDetail }) {
  return <div className="workflow-stages">
    <p className="field-note">The app adds protected final confirmation inside the closing stage. The default workflow has seven stages.</p>
    {workflow.stages.slice().sort((a, b) => a.position - b.position).map(stage => {
      const actions = workflow.actions.filter(action => action.stageId === stage.id).sort((a, b) => a.position - b.position);
      return <section className="workflow-stage" key={stage.id}>
        <div className="workflow-stage-heading"><span>Stage {stage.position + 1}</span><h3>{stage.name}</h3>{stage.protectedClosing && <span className="read-only-badge">Protected closing</span>}</div>
        {actions.length ? <ul className="workflow-actions">{actions.map(action => <li key={action.id}>
          <h4>{action.title}</h4><p>{action.instructions}</p>
          <dl>{[
            ['Applicability', action.applicability], ['Definition of done', action.definitionOfDone],
            ['Evidence guidance', action.evidenceGuidance], ['Classification', action.actionType],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </li>)}</ul> : <p className="empty-copy">No starter actions in this stage.</p>}
      </section>;
    })}
  </div>;
}

function ActionDefinitionFields({ action, stages, disabled, onSave, onCancel }: {
  action: WorkflowAction; stages: WorkflowStage[]; disabled: boolean;
  onSave: (definition: ActionDefinitionInput, stageId: number) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(action.title);
  const [instructions, setInstructions] = useState(action.instructions);
  const [applicability, setApplicability] = useState(action.applicability);
  const [definitionOfDone, setDefinitionOfDone] = useState(action.definitionOfDone);
  const [evidenceGuidance, setEvidenceGuidance] = useState(action.evidenceGuidance);
  const [actionType, setActionType] = useState<ActionType>(action.actionType);
  const [stageId, setStageId] = useState(action.stageId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onSave({ title, instructions, applicability, definitionOfDone, evidenceGuidance, actionType }, stageId)) onCancel();
  }

  return <form className="workflow-action-editor" onSubmit={submit}>
    <div className="field"><label htmlFor={idFor('workflow-action-title', action.id)}>Action title</label><input id={idFor('workflow-action-title', action.id)} maxLength={300} required value={title} onChange={event => setTitle(event.target.value)} disabled={disabled} /></div>
    <div className="field"><label htmlFor={idFor('workflow-action-instructions', action.id)}>Instructions</label><textarea id={idFor('workflow-action-instructions', action.id)} maxLength={10000} rows={3} value={instructions} onChange={event => setInstructions(event.target.value)} disabled={disabled} /></div>
    <div className="field"><label htmlFor={idFor('workflow-action-applicability', action.id)}>Applicability</label><textarea id={idFor('workflow-action-applicability', action.id)} maxLength={2000} rows={2} value={applicability} onChange={event => setApplicability(event.target.value)} disabled={disabled} /></div>
    <div className="field"><label htmlFor={idFor('workflow-action-dod', action.id)}>Definition of done</label><textarea id={idFor('workflow-action-dod', action.id)} maxLength={10000} rows={2} value={definitionOfDone} onChange={event => setDefinitionOfDone(event.target.value)} disabled={disabled} /></div>
    <div className="field"><label htmlFor={idFor('workflow-action-evidence', action.id)}>Evidence guidance</label><textarea id={idFor('workflow-action-evidence', action.id)} maxLength={2000} rows={2} value={evidenceGuidance} onChange={event => setEvidenceGuidance(event.target.value)} disabled={disabled} /></div>
    <div className="field"><label htmlFor={idFor('workflow-action-classification', action.id)}>Classification</label><select id={idFor('workflow-action-classification', action.id)} value={actionType} onChange={event => setActionType(event.target.value as ActionType)} disabled={disabled}>{actionTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
    <div className="field"><label htmlFor={idFor('workflow-action-stage', action.id)}>Stage</label><select id={idFor('workflow-action-stage', action.id)} value={stageId} onChange={event => setStageId(Number(event.target.value))} disabled={disabled}>{stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></div>
    <div className="form-actions"><button className="button button-primary" type="submit" disabled={disabled || !title.trim()}>Save action</button><button className="button" type="button" onClick={onCancel} disabled={disabled}>Cancel</button></div>
  </form>;
}

function EditableWorkflow({ workflow, busy, onUpdateTemplate, onAddStage, onUpdateStage, onReorderStages, onRemoveStage, onAddAction, onUpdateAction, onReorderActions, onRemoveAction }: {
  workflow: WorkflowDetail; busy: boolean;
  onUpdateTemplate: (name: string, description: string) => Promise<boolean>;
  onAddStage: (name: string) => Promise<boolean>;
  onUpdateStage: (stageId: number, name: string) => Promise<boolean>;
  onReorderStages: (stageIds: number[]) => Promise<boolean>;
  onRemoveStage: (stageId: number) => Promise<boolean>;
  onAddAction: (stageId: number, title: string) => Promise<boolean>;
  onUpdateAction: (actionId: number, stageId: number, definition: ActionDefinitionInput) => Promise<boolean>;
  onReorderActions: (stageId: number, actionIds: number[]) => Promise<boolean>;
  onRemoveAction: (actionId: number) => Promise<boolean>;
}) {
  const templateId = workflow.template.id;
  const [name, setName] = useState(workflow.template.name);
  const [description, setDescription] = useState(workflow.template.description);
  const [newStage, setNewStage] = useState('');
  const [stageNames, setStageNames] = useState<Record<number, string>>(() => Object.fromEntries(workflow.stages.map(stage => [stage.id, stage.name])));
  const [newActionTitles, setNewActionTitles] = useState<Record<number, string>>({});
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const stages = workflow.stages.slice().sort((a, b) => a.position - b.position);

  async function saveStage(event: FormEvent) {
    event.preventDefault();
    if (await onAddStage(newStage)) setNewStage('');
  }

  async function saveAction(event: FormEvent, stageId: number) {
    event.preventDefault();
    const title = newActionTitles[stageId] ?? '';
    if (await onAddAction(stageId, title)) setNewActionTitles(current => ({ ...current, [stageId]: '' }));
  }

  async function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length || stages[index].protectedClosing || stages[target].protectedClosing) return;
    const ids = stages.map(stage => stage.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await onReorderStages(ids);
  }

  return <div className="workflow-editor">
    <form className="workflow-template-form" onSubmit={async event => { event.preventDefault(); await onUpdateTemplate(name, description); }}>
      <div className="field"><label htmlFor="workflow-name">Template name</label><input id="workflow-name" maxLength={120} required value={name} onChange={event => setName(event.target.value)} disabled={busy} /></div>
      <div className="field"><label htmlFor="workflow-description">Description</label><textarea id="workflow-description" maxLength={10000} rows={3} value={description} onChange={event => setDescription(event.target.value)} disabled={busy} /></div>
      <button className="button button-primary" type="submit" disabled={busy || !name.trim()}>Save template</button>
    </form>
    <form className="inline-form workflow-add-stage" onSubmit={saveStage}>
      <div className="field grow"><label htmlFor="workflow-new-stage">Add stage before protected closing</label><input id="workflow-new-stage" maxLength={200} required value={newStage} onChange={event => setNewStage(event.target.value)} disabled={busy} placeholder="Stage name" /></div>
      <button className="button" type="submit" disabled={busy || !newStage.trim()}>Add stage</button>
    </form>
    <div className="workflow-stages">
      {stages.map((stage, index) => {
        const actions = workflow.actions.filter(action => action.stageId === stage.id).sort((a, b) => a.position - b.position);
        async function moveAction(actionIndex: number, direction: -1 | 1) {
          const target = actionIndex + direction;
          if (target < 0 || target >= actions.length) return;
          const actionIds = actions.map(action => action.id);
          [actionIds[actionIndex], actionIds[target]] = [actionIds[target], actionIds[actionIndex]];
          await onReorderActions(stage.id, actionIds);
        }
        return <section className="workflow-stage" key={stage.id}>
          <div className="workflow-stage-heading"><span>Stage {index + 1}</span>{stage.protectedClosing ? <><h3>{stage.name}</h3><span className="read-only-badge">Protected closing · stays last</span></> : <form className="workflow-stage-rename" onSubmit={async event => { event.preventDefault(); const value = stageNames[stage.id] ?? stage.name; if (await onUpdateStage(stage.id, value)) setStageNames(current => ({ ...current, [stage.id]: value })); }}>
            <label className="sr-only" htmlFor={idFor('workflow-stage-name', stage.id)}>Stage {index + 1} name</label><input id={idFor('workflow-stage-name', stage.id)} maxLength={200} required value={stageNames[stage.id] ?? stage.name} onChange={event => setStageNames(current => ({ ...current, [stage.id]: event.target.value }))} disabled={busy} /><button className="button" type="submit" disabled={busy || !(stageNames[stage.id] ?? stage.name).trim()}>Save stage name</button>
          </form>}</div>
          {!stage.protectedClosing && <div className="workflow-stage-controls"><button className="button" type="button" aria-label={`Move ${stageNames[stage.id] ?? stage.name} up`} onClick={() => void moveStage(index, -1)} disabled={busy || index === 0 || stages[index - 1]?.protectedClosing}>Move stage up</button><button className="button" type="button" aria-label={`Move ${stageNames[stage.id] ?? stage.name} down`} onClick={() => void moveStage(index, 1)} disabled={busy || index >= stages.length - 1 || stages[index + 1]?.protectedClosing}>Move stage down</button><button className="text-button" type="button" aria-label={`Remove empty stage ${stageNames[stage.id] ?? stage.name}`} onClick={() => void onRemoveStage(stage.id)} disabled={busy || actions.length > 0}>Remove empty stage</button></div>}
          {actions.length ? <ul className="workflow-actions">{actions.map((action, actionIndex) => <li key={action.id}>
            <h4>{action.title}</h4><p>{action.instructions}</p>
            <dl>{[['Applicability', action.applicability], ['Definition of done', action.definitionOfDone], ['Evidence guidance', action.evidenceGuidance], ['Classification', action.actionType]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>
            <div className="workflow-stage-controls"><button className="button" type="button" aria-label={`Move ${action.title} up`} onClick={() => void moveAction(actionIndex, -1)} disabled={busy || actionIndex === 0}>Move action up</button><button className="button" type="button" aria-label={`Move ${action.title} down`} onClick={() => void moveAction(actionIndex, 1)} disabled={busy || actionIndex >= actions.length - 1}>Move action down</button><button className="button" type="button" aria-label={`${editingActionId === action.id ? 'Close editor for' : 'Edit'} ${action.title}`} onClick={() => setEditingActionId(editingActionId === action.id ? null : action.id)} disabled={busy}>{editingActionId === action.id ? 'Close editor' : 'Edit action'}</button><button className="text-button" type="button" aria-label={`Remove action ${action.title}`} onClick={() => void onRemoveAction(action.id)} disabled={busy}>Remove action</button></div>
            {editingActionId === action.id && <ActionDefinitionFields key={action.id} action={action} stages={stages} disabled={busy} onSave={(definition, stageId) => onUpdateAction(action.id, stageId, definition)} onCancel={() => setEditingActionId(null)} />}
          </li>)}</ul> : <p className="empty-copy">No starter actions in this stage.</p>}
          <form className="inline-form workflow-add-action" onSubmit={event => void saveAction(event, stage.id)}><div className="field grow"><label htmlFor={idFor('workflow-new-action', stage.id)}>Quick add action</label><input id={idFor('workflow-new-action', stage.id)} maxLength={300} required value={newActionTitles[stage.id] ?? ''} onChange={event => setNewActionTitles(current => ({ ...current, [stage.id]: event.target.value }))} disabled={busy} placeholder="Action title" /></div><button className="button" type="submit" disabled={busy || !(newActionTitles[stage.id] ?? '').trim()}>Add action</button></form>
        </section>;
      })}
    </div>
  </div>;
}

export function WorkflowLibrary({ workflows, loading, busy, stale, error, onRetry, createTemplate, duplicate, updateTemplate, addStage, updateStage, reorderStages, removeStage, addAction, updateAction, reorderActions, removeAction }: {
  workflows: WorkflowDetail[]; loading: boolean; busy: boolean; stale: boolean; error: string; onRetry: () => void;
  createTemplate: (name: string, description: string) => Promise<{ id: number } | null>;
  duplicate: (templateId: number, name: string) => Promise<{ id: number } | null>;
  updateTemplate: (templateId: number, name: string, description: string) => Promise<boolean>;
  addStage: (templateId: number, name: string) => Promise<boolean>;
  updateStage: (templateId: number, stageId: number, name: string) => Promise<boolean>;
  reorderStages: (templateId: number, stageIds: number[]) => Promise<boolean>;
  removeStage: (templateId: number, stageId: number) => Promise<boolean>;
  addAction: (templateId: number, stageId: number, title: string) => Promise<boolean>;
  updateAction: (templateId: number, actionId: number, stageId: number, definition: ActionDefinitionInput) => Promise<boolean>;
  reorderActions: (templateId: number, stageId: number, actionIds: number[]) => Promise<boolean>;
  removeAction: (templateId: number, actionId: number) => Promise<boolean>;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [copyName, setCopyName] = useState('');
  const selected = workflows.find(item => item.template.id === selectedId) ?? null;

  useEffect(() => {
    if (!stale && workflows.length && !workflows.some(item => item.template.id === selectedId)) setSelectedId(workflows[0].template.id);
  }, [workflows, selectedId, stale]);

  async function create(event: FormEvent) {
    event.preventDefault();
    const template = await createTemplate(newName, newDescription);
    if (template) { setNewName(''); setNewDescription(''); setSelectedId(template.id); }
  }

  async function copy(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const template = await duplicate(selected.template.id, copyName);
    if (template) { setCopyName(''); setSelectedId(template.id); }
  }

  return <>
    <header className="page-header"><p className="eyebrow">Reusable project structure</p><h1>Workflow library</h1><p className="lede">Browse saved workflows, edit your own, or make a named copy of a built-in.</p></header>
    {error && <div className="notice error" role="alert">{error}</div>}
    {(stale || loading) && <div className="refresh-state" role="status"><p>{loading ? 'Loading saved workflow templates…' : 'The workflow list could not be refreshed. Saved template details are withheld until they are current.'}</p><button className="button button-primary" onClick={onRetry} disabled={busy || loading}>Retry loading</button></div>}
    <div className="workflow-library-content" hidden={stale || (loading && !busy)}>
      <details className="workflow-create-disclosure"><summary>Create a workflow</summary>
      <Panel id="workflow-create-heading" className="workflow-create-panel" title="New workflow" eyebrow="Start with seven empty stages">
        <form className="workflow-create-form" onSubmit={create}>
          <div className="field"><label htmlFor="new-workflow-name">Workflow name</label><input id="new-workflow-name" maxLength={120} required value={newName} onChange={event => setNewName(event.target.value)} disabled={busy} placeholder="Workflow name" /></div>
          <div className="field"><label htmlFor="new-workflow-description">Description</label><textarea id="new-workflow-description" maxLength={10000} rows={2} value={newDescription} onChange={event => setNewDescription(event.target.value)} disabled={busy} placeholder="What is this workflow for?" /></div>
          <button className="button button-primary" type="submit" disabled={busy || !newName.trim()}>Create workflow</button>
        </form>
      </Panel>
      </details>
      <div className="workflow-library-layout">
        <Panel id="workflow-list-heading" className="workflow-list-panel" title="Templates" eyebrow={`${workflows.length} saved template${workflows.length === 1 ? '' : 's'}`}>
          {workflows.length ? <nav className="workflow-template-list" aria-label="Workflow templates">{workflows.map(item => <button key={item.template.id} type="button" className={`workflow-template-link${selected?.template.id === item.template.id ? ' selected' : ''}`} aria-current={selected?.template.id === item.template.id ? 'true' : undefined} onClick={() => setSelectedId(item.template.id)} disabled={busy}>
            <span className="workflow-template-title">{item.template.name}</span><span className="workflow-template-version">Version {item.template.version}{item.template.builtInKey ? ' · Built in' : ''}</span><span className="workflow-template-description">{item.template.description}</span>
          </button>)}</nav> : <p className="empty-copy">No workflow templates are available.</p>}
        </Panel>
        {selected && <Panel id="workflow-detail-heading" className="workflow-detail-panel" eyebrow={`Template · Version ${selected.template.version}`} title={selected.template.name}>
          <p className="workflow-description">{selected.template.description}</p>
          {selected.template.builtInKey ? <><span className="read-only-badge">Built in · read only</span><StageDetails workflow={selected} /></> : <EditableWorkflow key={selected.template.id} workflow={selected} busy={busy}
            onUpdateTemplate={(name, description) => updateTemplate(selected.template.id, name, description)}
            onAddStage={name => addStage(selected.template.id, name)} onUpdateStage={(stageId, name) => updateStage(selected.template.id, stageId, name)}
            onReorderStages={stageIds => reorderStages(selected.template.id, stageIds)} onRemoveStage={stageId => removeStage(selected.template.id, stageId)}
            onAddAction={(stageId, title) => addAction(selected.template.id, stageId, title)} onUpdateAction={(actionId, stageId, definition) => updateAction(selected.template.id, actionId, stageId, definition)}
            onReorderActions={(stageId, actionIds) => reorderActions(selected.template.id, stageId, actionIds)} onRemoveAction={actionId => removeAction(selected.template.id, actionId)} />}
          <form className="workflow-copy-form" onSubmit={copy}>
            <h3>Make a copy</h3><p className="field-note">The source template stays unchanged. This creates a separately saved template.</p>
            <div className="inline-form"><div className="field grow"><label htmlFor="workflow-copy-name">Name for the copy</label><input id="workflow-copy-name" maxLength={120} required value={copyName} onChange={event => setCopyName(event.target.value)} disabled={busy} placeholder="My workflow" /></div>
              <button className="button button-primary" type="submit" disabled={busy || !copyName.trim()}>{busy ? 'Copying…' : 'Duplicate template'}</button>
            </div>
          </form>
        </Panel>}
      </div>
    </div>
  </>;
}
