import type { HomeProjectSummary } from '../shared/contracts';

export function ProjectHome({ projects, loading, error, stale, disabled, onOpen, onRefresh, onCreate, onPreview }: {
  projects: HomeProjectSummary[]; loading: boolean; error: string; stale: boolean; disabled: boolean;
  onOpen: (projectId: number) => void; onRefresh: () => void; onCreate: () => void;
  onPreview: () => void;
}) {
  const ready = !loading && !error && !stale;
  return <section className="project-home" aria-label="Home">
    <header className="home-header">
      <div><p className="eyebrow">Home · Development workspace</p><h1>{ready && !projects.length ? 'Start with a project' : 'Your projects'}</h1><p className="lede">Keep your projects recognizable. Leave a clear place to continue.</p></div>
      <div className="home-controls"><button id="blueprint-select" type="button" className="button button-primary" onClick={onPreview} disabled={disabled}>Preview blueprint</button><button type="button" className="button button-light" onClick={onRefresh} disabled={disabled || loading}>Refresh Home</button></div>
    </header>
    {loading ? <p className="empty-copy" role="status">Loading saved project context…</p> : error ? <div className="home-error" role="alert"><h2>Home could not be loaded</h2><p>{error}</p><p>Refresh Home to read saved data again.</p></div> : stale ? <p className="empty-copy" role="status">Refresh Home to read the latest saved project context.</p> : projects.length ? <>
      <p className="home-count">{projects.length} {projects.length === 1 ? 'project' : 'projects'} · Ordered by recorded activity</p>
      <div className="home-projects">{projects.map(({ project, checkpoint, activity, knowledge }) => <article className="home-card" key={project.id} aria-labelledby={`home-project-${project.id}`}>
        <header className="home-card-heading"><span className="home-initial" aria-hidden="true">{Array.from(project.name.trim())[0]?.toLocaleUpperCase() ?? 'P'}</span><div><h2 id={`home-project-${project.id}`}>{project.name}</h2><p className="home-created">Created <time dateTime={project.createdAt}>{new Date(project.createdAt).toLocaleString()}</time></p></div></header>
        {knowledge && <div className="home-knowledge"><p className="home-preview">{knowledge.goal}</p><p className="home-meta">Engineering knowledge · {knowledge.counts.component} components · {knowledge.counts.feature} features · {knowledge.counts.action} proposed actions · Not assessed</p></div>}
        <div className="home-checkpoint">{checkpoint ? <>
          <p className="home-meta">Latest checkpoint · <time dateTime={checkpoint.createdAt}>{new Date(checkpoint.createdAt).toLocaleString()}</time></p>
          <h3>Last accomplishment</h3><p className="home-preview">{checkpoint.accomplished}</p>
          <h3>Saved next steps</h3><p className="home-preview home-next">{checkpoint.nextSteps}</p>
        </> : <p className="empty-copy">No checkpoint yet. Open this project to leave a next step.</p>}</div>
        <div className="home-activity"><h3>Latest recorded activity</h3>{activity ? <><p className="home-preview">{activity.description}</p><time dateTime={activity.createdAt}>{new Date(activity.createdAt).toLocaleString()}</time></> : <p className="empty-copy">No checkpoint or action events recorded.</p>}</div>
        <button type="button" className="button button-primary home-open" disabled={disabled} onClick={() => onOpen(project.id)} aria-label={`Open project ${project.name}`}>Open project <span aria-hidden="true">→</span></button>
      </article>)}</div>
    </> : <div className="home-empty"><p>Create a project to begin with actions and checkpoints. A release is optional.</p><button type="button" className="button button-primary" onClick={onCreate} disabled={disabled}>Create your first project</button></div>}
  </section>;
}
