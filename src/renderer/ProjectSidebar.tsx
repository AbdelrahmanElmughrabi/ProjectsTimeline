import type { ReactNode } from 'react';
import type { Project } from '../shared/contracts';

export function ProjectSidebar({ projects, selectedId, view, loading, listError, navigationDisabled, retryDisabled, onViewChange, onSelect, onRetry, children }: {
  projects: Project[];
  selectedId: number | null;
  view: 'home' | 'project' | 'workflows' | 'preview';
  loading: boolean;
  listError: string;
  navigationDisabled: boolean;
  retryDisabled: boolean;
  onViewChange: (view: 'home' | 'project' | 'workflows') => void;
  onSelect: (projectId: number) => void;
  onRetry: () => void;
  children: ReactNode;
}) {
  return <aside className="sidebar" aria-label="Project navigation">
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">P</span>
      <div><strong className="brand-name">ProjectsTimeline</strong><span className="brand-caption">Development workspace</span></div>
    </div>
    <nav className="sidebar-views" aria-label="Workspace views">
      <button type="button" className={`project-link${view === 'home' ? ' selected' : ''}`} aria-current={view === 'home' ? 'page' : undefined} onClick={() => onViewChange('home')} disabled={navigationDisabled}><span className="project-icon" aria-hidden="true" /><span className="project-label">Home</span></button>
      <button type="button" className={`project-link${view === 'workflows' ? ' selected' : ''}`} aria-current={view === 'workflows' ? 'page' : undefined} onClick={() => onViewChange('workflows')} disabled={navigationDisabled}><span className="project-icon" aria-hidden="true" /><span className="project-label">Workflows</span></button>
    </nav>
    <div className="sidebar-section">
      <h2 className="side-heading" id="projects-heading">Projects</h2>
      <nav className="project-list" aria-labelledby="projects-heading">
        {loading && <p className="side-hint">Loading projects…</p>}
        {!loading && !listError && projects.length === 0 && <p className="side-hint">Your projects will appear here.</p>}
        {projects.map(project => <button
          type="button"
          className={`project-link${view === 'project' && selectedId === project.id ? ' selected' : ''}`}
          key={project.id}
          onClick={() => onSelect(project.id)}
          disabled={navigationDisabled}
          aria-label={`Open ${project.name}`}
          aria-current={view === 'project' && selectedId === project.id ? 'page' : undefined}
        ><span className="project-icon" aria-hidden="true" /><span className="project-label">{project.name}</span></button>)}
      </nav>
    </div>
    {children}
    {listError && <div className="side-error" role="alert"><p>{listError}</p><button type="button" className="text-button" onClick={onRetry} disabled={retryDisabled}>Retry loading projects</button></div>}
    <footer className="sidebar-footer">Keep context.<br />Leave a place to resume.</footer>
  </aside>;
}
