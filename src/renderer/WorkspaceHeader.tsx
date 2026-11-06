export function WorkspaceHeader({ name }: { name: string }) {
  return <header className="page-header workspace-header">
    <p className="breadcrumb">Projects <span aria-hidden="true">/</span> Workspace</p>
    <div className="project-title-line"><h1 id="project-title">{name}</h1></div>
    <p className="lede">Your actions, checkpoints, and next steps.</p>
  </header>;
}
