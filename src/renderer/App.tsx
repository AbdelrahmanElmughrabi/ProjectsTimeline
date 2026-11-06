import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useProjectWorkspace } from './useProjectWorkspace';
import { ResumePanel } from './ResumePanel';
import { Panel } from './Panel';
import { ProjectSidebar } from './ProjectSidebar';
import { WorkspaceHeader } from './WorkspaceHeader';
import { ReleaseWorkspace } from './ReleaseWorkspace';
import { WorkflowLibrary } from './WorkflowLibrary';
import { useWorkflowLibrary } from './useWorkflowLibrary';

export default function App() {
  const workspace = useProjectWorkspace();
  const library = useWorkflowLibrary();
  const { projects, detail, selectedId, loading, listError, busy, notice, stale } = workspace;
  const [projectName, setProjectName] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [accomplished, setAccomplished] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [view, setView] = useState<'project' | 'workflows'>('project');
  const disabled = busy !== null || library.busy || stale;

  useEffect(() => {
    if (detail) { setActionTitle(''); setAccomplished(''); setNextSteps(''); setSelectedReleaseId(null); }
  }, [detail?.project.id]);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (await workspace.createProject(projectName)) setProjectName('');
  }

  async function addAction(event: FormEvent) {
    event.preventDefault();
    if (await workspace.addAction(actionTitle)) setActionTitle('');
  }

  async function saveCheckpoint(event: FormEvent) {
    event.preventDefault();
    if (await workspace.saveCheckpoint(accomplished, nextSteps)) {
      setAccomplished(''); setNextSteps('');
    }
  }

  const checkpoints = detail?.checkpoints ?? [];
  const backlogActions = detail?.actions.filter(action => action.releaseId === null) ?? [];

  return (
    <div className="shell">
      <a className="skip-link" href="#workspace-main" onClick={event => { event.preventDefault(); document.getElementById('workspace-main')?.focus(); }}>Skip to workspace</a>
      <ProjectSidebar
        projects={projects} selectedId={selectedId} view={view} loading={loading} listError={listError}
        navigationDisabled={(busy !== null && busy !== 'open') || library.busy || loading}
        retryDisabled={loading || busy !== null || library.busy}
        onViewChange={setView}
        onSelect={(id) => { setView('project'); void workspace.openProject(id); }} onRetry={() => void workspace.retryLoading()}
      >
        <form className="create-form" onSubmit={createProject}>
          <label htmlFor="project-name">New project</label>
          <input id="project-name" aria-label="Project name" maxLength={120} required value={projectName} onChange={event => setProjectName(event.target.value)} disabled={disabled} placeholder="Project name" />
          <button className="button button-light" type="submit" disabled={disabled || loading}>{busy === 'create' ? 'Creating…' : 'Create project'}</button>
        </form>
      </ProjectSidebar>

      <main className="main-content" id="workspace-main" tabIndex={-1}>
        {view === 'workflows' ? <WorkflowLibrary workflows={library.workflows} loading={library.loading} busy={library.busy} stale={library.stale} error={library.error} onRetry={() => void library.refresh()} onDuplicate={library.duplicate} /> : <>
        {notice && <div className={`notice ${notice.kind}`} role={notice.kind === 'success' ? 'status' : 'alert'}>{notice.text}</div>}
        {(stale || notice?.kind === 'warning' || (selectedId !== null && !detail && busy === null)) && <div className="refresh-state"><p>Displayed information may be out of date. Reload saved data before making more changes.</p><button className="button button-primary" disabled={busy !== null} onClick={() => void workspace.retryLoading()}>Retry loading</button></div>}
        {detail ? <>
          <WorkspaceHeader name={detail.project.name} />
          <div className="workspace-grid">
            <ResumePanel resume={detail.resume} stale={stale} disabled={disabled} />
            <div className="workspace-body">
          <Panel className="action-panel" id="actions-heading" title="Actions" eyebrow="Project backlog" accessory={<span className="count-pill" aria-label={`Action count: ${backlogActions.length}`}>{backlogActions.length}</span>}>
            <form className="inline-form" onSubmit={addAction}>
              <div className="field grow"><label htmlFor="action-title">Action title</label><input id="action-title" maxLength={300} required value={actionTitle} onChange={event => setActionTitle(event.target.value)} disabled={disabled} placeholder="What needs to happen?" /></div>
              <button className="button button-primary" type="submit" disabled={disabled}>{busy === 'action' ? 'Adding…' : 'Add action'}</button>
            </form>
            {backlogActions.length ? <ul className="action-list">{backlogActions.map(action => <li key={action.id} className="action-row"><span className={`state-dot${action.completedAt ? ' done' : ''}`} aria-hidden="true"/><span className={`action-name${action.completedAt ? ' completed' : ''}`}>{action.title}</span>{action.completedAt ? <span className="done-label">Completed</span> : <button className="complete-button" onClick={() => void workspace.completeAction(action.id)} disabled={disabled} aria-label={`Complete ${action.title}`}>{busy === 'complete' ? 'Saving…' : 'Mark complete'}</button>}</li>)}</ul> : <p className="empty-copy">No actions yet. Add the first step above.</p>}
          </Panel>

          <ReleaseWorkspace detail={detail} workflows={library.workflows} workflowsStale={library.stale} selectedReleaseId={selectedReleaseId} onSelectRelease={setSelectedReleaseId} disabled={disabled} stale={stale} busy={busy}
            createRelease={workspace.createRelease} assignAction={workspace.assignAction} setActionExclusion={workspace.setActionExclusion} setStageExclusion={workspace.setStageExclusion}
            completeAction={workspace.completeAction} reopenAction={workspace.reopenAction} recordReleaseVerification={workspace.recordReleaseVerification} confirmRelease={workspace.confirmRelease} />

          <Panel className="checkpoint-panel" id="checkpoint-heading" title="Checkpoint" eyebrow="Leave a clear next step">
            <form className="checkpoint-form" onSubmit={saveCheckpoint}>
              <div className="field"><label htmlFor="accomplished">What I accomplished</label><textarea id="accomplished" maxLength={10000} required rows={4} value={accomplished} onChange={event => setAccomplished(event.target.value)} disabled={disabled} placeholder="Record the progress so far…" /></div>
              <div className="field"><label htmlFor="next-steps">What to do next</label><textarea id="next-steps" maxLength={10000} required rows={4} value={nextSteps} onChange={event => setNextSteps(event.target.value)} disabled={disabled} placeholder="Write down the next steps…" /></div>
              <div className="form-actions"><span className="field-note">Both notes are saved together.</span><button className="button button-primary" type="submit" disabled={disabled}>{busy === 'checkpoint' ? 'Saving…' : 'Save checkpoint'}</button></div>
            </form>
          </Panel>

          <Panel className="history" id="history-heading" title="Checkpoint history" eyebrow="Development memory">
            {checkpoints.length ? <div className="checkpoint-list">{checkpoints.map(checkpoint => <article className="checkpoint-card" key={checkpoint.id}><time dateTime={checkpoint.createdAt}>{new Date(checkpoint.createdAt).toLocaleString()}</time><div><h3>Accomplished</h3><p>{checkpoint.accomplished}</p></div><div><h3>Next steps</h3><p>{checkpoint.nextSteps}</p></div></article>)}</div> : <p className="empty-copy">Your saved checkpoints will appear here.</p>}
          </Panel>
          <details className="event-history"><summary>Action audit history ({detail.actionEvents.length})</summary>{detail.actionEvents.length ? <ol>{detail.actionEvents.map(event => <li key={event.id}><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time><span>{event.actionId !== null && <strong>{detail.actions.find(action => action.id === event.actionId)?.title}: </strong>}{event.description}</span></li>)}</ol> : <p className="empty-copy">No action events recorded.</p>}</details>
            </div>
          </div>
        </> : <section className="welcome">
          <div className="welcome-icon" aria-hidden="true">↗</div><p className="eyebrow">A little progress, every day</p><h1>{busy === 'open' ? 'Loading project…' : selectedId !== null ? 'Project could not be loaded' : listError ? 'Projects are unavailable' : projects.length ? 'Choose a project' : 'Start with a project'}</h1><p>{listError ? 'Retry loading your projects from the sidebar.' : 'Select a project from the sidebar, or create one to begin tracking actions and checkpoints.'}</p>
          {!loading && !listError && projects.length === 0 && <button className="button button-primary" onClick={() => document.getElementById('project-name')?.focus()}>Create your first project</button>}
        </section>}
        </>}
      </main>
    </div>
  );
}
