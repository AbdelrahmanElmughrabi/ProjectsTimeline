import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Checkpoint, DevelopmentAction, Project, ProjectDetail } from '../shared/contracts';

type Notice = { kind: 'success' | 'error'; text: string } | null;
type Operation = 'create' | 'open' | 'action' | 'complete' | 'checkpoint' | null;

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [accomplished, setAccomplished] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [busy, setBusy] = useState<Operation>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function loadProjects() {
    setLoading(true);
    setListError('');
    try {
      const result = await window.workspace.listProjects();
      if (!result.ok) throw new Error(result.error.message);
      setProjects(result.value);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (busy || loading) return;
    setBusy('create'); setNotice(null);
    try {
      const result = await window.workspace.createProject({ name: projectName });
      if (!result.ok) throw new Error(result.error.message);
      setProjects(current => [result.value, ...current]);
      setProjectName('');
      setNotice({ kind: 'success', text: 'Project created.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not create project.' });
    } finally { setBusy(null); }
  }

  async function openProject(project: Project) {
    if (busy || loading) return;
    setBusy('open'); setNotice(null);
    try {
      const result = await window.workspace.openProject({ projectId: project.id });
      if (!result.ok) throw new Error(result.error.message);
      setDetail(result.value);
      setActionTitle(''); setAccomplished(''); setNextSteps('');
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not open project.' });
    } finally { setBusy(null); }
  }

  async function addAction(event: FormEvent) {
    event.preventDefault();
    if (!detail || busy) return;
    setBusy('action'); setNotice(null);
    try {
      const result = await window.workspace.addAction({ projectId: detail.project.id, title: actionTitle });
      if (!result.ok) throw new Error(result.error.message);
      const action: DevelopmentAction = result.value;
      setDetail(current => current ? { ...current, actions: [...current.actions, action] } : current);
      setActionTitle(''); setNotice({ kind: 'success', text: 'Action added.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not add action.' });
    } finally { setBusy(null); }
  }

  async function completeAction(actionId: number) {
    if (!detail || busy) return;
    setBusy('complete'); setNotice(null);
    try {
      const result = await window.workspace.completeAction({ projectId: detail.project.id, actionId });
      if (!result.ok) throw new Error(result.error.message);
      setDetail(current => current ? {
        ...current, actions: current.actions.map(action => action.id === result.value.id ? result.value : action),
      } : current);
      setNotice({ kind: 'success', text: 'Action completed.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not complete action.' });
    } finally { setBusy(null); }
  }

  async function saveCheckpoint(event: FormEvent) {
    event.preventDefault();
    if (!detail || busy) return;
    setBusy('checkpoint'); setNotice(null);
    try {
      const result = await window.workspace.saveCheckpoint({
        projectId: detail.project.id, accomplished, nextSteps,
      });
      if (!result.ok) throw new Error(result.error.message);
      const checkpoint: Checkpoint = result.value;
      setDetail(current => current ? { ...current, checkpoints: [...current.checkpoints, checkpoint] } : current);
      setAccomplished(''); setNextSteps('');
      setNotice({ kind: 'success', text: 'Checkpoint saved.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save checkpoint.' });
    } finally { setBusy(null); }
  }

  const checkpoints = detail ? [...detail.checkpoints].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id) : [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">P</span><div><strong>Projects</strong><small>Timeline</small></div></div>
        <h2 className="side-heading">Your projects</h2>
        <div className="project-list" aria-label="Projects">
          {loading && <p className="side-hint">Loading projects…</p>}
          {!loading && !listError && projects.length === 0 && <p className="side-hint">Your projects will appear here.</p>}
          {projects.map(project => <button className={`project-link${detail?.project.id === project.id ? ' selected' : ''}`} key={project.id} onClick={() => void openProject(project)} disabled={busy !== null || loading} aria-label={`Open ${project.name}`} aria-current={detail?.project.id === project.id ? 'page' : undefined}>{project.name}</button>)}
        </div>
        <form className="create-form" onSubmit={createProject}>
          <label htmlFor="project-name">New project</label>
          <input id="project-name" aria-label="Project name" maxLength={120} required value={projectName} onChange={event => setProjectName(event.target.value)} disabled={busy !== null} placeholder="Project name" />
          <button className="button button-light" type="submit" disabled={busy !== null || loading}>{busy === 'create' ? 'Creating…' : 'Create project'}</button>
        </form>
        {listError && <div className="side-error" role="alert"><p>{listError}</p><button className="text-button" onClick={() => void loadProjects()} disabled={loading || busy !== null}>Retry loading projects</button></div>}
        <footer className="sidebar-footer">A clear record of progress.</footer>
      </aside>

      <main className="main-content">
        {notice && <div className={`notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</div>}
        {detail ? <>
          <header className="page-header"><p className="eyebrow">Project overview</p><h1>{detail.project.name}</h1><p className="lede">Keep a simple record of what is moving forward.</p></header>
          <section className="panel action-panel" aria-labelledby="actions-heading">
            <div className="section-title"><div><p className="eyebrow">Keep momentum</p><h2 id="actions-heading">Actions</h2></div><span className="count-pill">{detail.actions.length}</span></div>
            <form className="inline-form" onSubmit={addAction}>
              <div className="field grow"><label htmlFor="action-title">Action title</label><input id="action-title" maxLength={300} required value={actionTitle} onChange={event => setActionTitle(event.target.value)} disabled={busy !== null} placeholder="What needs to happen?" /></div>
              <button className="button button-primary" type="submit" disabled={busy !== null}>{busy === 'action' ? 'Adding…' : 'Add action'}</button>
            </form>
            {detail.actions.length ? <ul className="action-list">{detail.actions.map(action => <li key={action.id} className="action-row"><span className={`state-dot${action.completedAt ? ' done' : ''}`} aria-hidden="true"/><span className={`action-name${action.completedAt ? ' completed' : ''}`}>{action.title}</span>{action.completedAt ? <span className="done-label">Completed</span> : <button className="complete-button" onClick={() => void completeAction(action.id)} disabled={busy !== null} aria-label={`Complete ${action.title}`}>{busy === 'complete' ? 'Saving…' : 'Mark complete'}</button>}</li>)}</ul> : <p className="empty-copy">No actions yet. Add the first step above.</p>}
          </section>

          <section className="panel checkpoint-panel" aria-labelledby="checkpoint-heading">
            <div className="section-title"><div><p className="eyebrow">Capture progress</p><h2 id="checkpoint-heading">Checkpoint</h2></div></div>
            <form className="checkpoint-form" onSubmit={saveCheckpoint}>
              <div className="field"><label htmlFor="accomplished">What I accomplished</label><textarea id="accomplished" maxLength={10000} required rows={4} value={accomplished} onChange={event => setAccomplished(event.target.value)} disabled={busy !== null} placeholder="Record the progress so far…" /></div>
              <div className="field"><label htmlFor="next-steps">What to do next</label><textarea id="next-steps" maxLength={10000} required rows={4} value={nextSteps} onChange={event => setNextSteps(event.target.value)} disabled={busy !== null} placeholder="Write down the next steps…" /></div>
              <div className="form-actions"><span className="field-note">Both notes are saved together.</span><button className="button button-primary" type="submit" disabled={busy !== null}>{busy === 'checkpoint' ? 'Saving…' : 'Save checkpoint'}</button></div>
            </form>
          </section>

          <section className="history" aria-labelledby="history-heading">
            <div className="section-title"><div><p className="eyebrow">Recent notes</p><h2 id="history-heading">Checkpoint history</h2></div></div>
            {checkpoints.length ? <div className="checkpoint-list">{checkpoints.map(checkpoint => <article className="checkpoint-card" key={checkpoint.id}><time dateTime={checkpoint.createdAt}>{new Date(checkpoint.createdAt).toLocaleString()}</time><div><h3>Accomplished</h3><p>{checkpoint.accomplished}</p></div><div><h3>Next steps</h3><p>{checkpoint.nextSteps}</p></div></article>)}</div> : <p className="empty-copy">Your saved checkpoints will appear here.</p>}
          </section>
        </> : <section className="welcome">
          <div className="welcome-icon" aria-hidden="true">↗</div><p className="eyebrow">A little progress, every day</p><h1>{listError ? 'Projects are unavailable' : projects.length ? 'Choose a project' : 'Start with a project'}</h1><p>{listError ? 'Retry loading your projects from the sidebar.' : 'Select a project from the sidebar, or create one to begin tracking actions and checkpoints.'}</p>
          {!loading && !listError && projects.length === 0 && <button className="button button-primary" onClick={() => document.getElementById('project-name')?.focus()}>Create your first project</button>}
        </section>}
      </main>
    </div>
  );
}
