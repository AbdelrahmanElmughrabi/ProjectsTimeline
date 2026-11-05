export interface Project {
  id: number;
  name: string;
  createdAt: string;
}

export interface DevelopmentAction {
  id: number;
  projectId: number;
  title: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Checkpoint {
  id: number;
  projectId: number;
  accomplished: string;
  nextSteps: string;
  createdAt: string;
}

export interface ProjectDetail {
  project: Project;
  actions: DevelopmentAction[];
  checkpoints: Checkpoint[];
}

export type ErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'STORAGE' | 'FORBIDDEN';
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ErrorCode; message: string } };

export interface WorkspaceApi {
  listProjects(): Promise<Result<Project[]>>;
  createProject(input: { name: string }): Promise<Result<Project>>;
  openProject(input: { projectId: number }): Promise<Result<ProjectDetail>>;
  addAction(input: { projectId: number; title: string }): Promise<Result<DevelopmentAction>>;
  completeAction(input: { projectId: number; actionId: number }): Promise<Result<DevelopmentAction>>;
  saveCheckpoint(input: {
    projectId: number;
    accomplished: string;
    nextSteps: string;
  }): Promise<Result<Checkpoint>>;
}

declare global {
  interface Window {
    workspace: WorkspaceApi;
  }
}
