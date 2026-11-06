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
  releaseId: number | null;
  stageId: number | null;
  exclusionReason: string | null;
  kind: 'work' | 'release-confirmation';
}

export type ProgressInput = Readonly<{
  releaseId: number;
  stages: readonly Readonly<{ id: number; included: boolean }>[];
  actions: readonly Readonly<{
    id: number; stageId: number | null; committed: boolean; applicable: boolean;
    completed: boolean; kind: 'work' | 'release-confirmation';
  }>[];
}>;

export interface ReleaseProgress {
  releaseId: number;
  state: 'needs-scope-review' | 'in-progress' | 'confirmed';
  percent: number | null;
  currentStageId: number | null;
  stages: { stageId: number; completedActions: number; totalActions: number; percent: number | null }[];
  emptyStageIds: number[];
  unassignedActionIds: number[];
}

export interface ProjectRelease {
  id: number; projectId: number; name: string; createdAt: string;
  scopeRevision: number; policyVersion: number; confirmedAt: string | null;
  confirmedVerificationId: number | null;
}

export interface ReleaseStage {
  id: number; releaseId: number; key: string; name: string; position: number;
  exclusionReason: string | null;
}

export interface ReleaseVerification {
  id: number; releaseId: number; scopeRevision: number;
  artifactIdentity: string; evidenceReference: string; summary: string;
  outcome: 'passed' | 'failed'; createdAt: string;
}

export interface ActionEvent {
  id: number; projectId: number; releaseId: number | null; actionId: number | null;
  description: string; createdAt: string;
}

export interface ReleaseWorkspace {
  release: ProjectRelease;
  stages: ReleaseStage[];
  progress: ReleaseProgress;
  verifications: ReleaseVerification[];
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
  resume: Checkpoint | null;
  releases: ReleaseWorkspace[];
  actionEvents: ActionEvent[];
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
  reopenAction(input: { projectId: number; actionId: number }): Promise<Result<DevelopmentAction>>;
  createRelease(input: { projectId: number; name: string }): Promise<Result<ProjectRelease>>;
  assignAction(input: { projectId: number; actionId: number; releaseId: number; stageId: number | null }): Promise<Result<DevelopmentAction>>;
  setActionExclusion(input: { projectId: number; actionId: number; reason: string | null }): Promise<Result<DevelopmentAction>>;
  setStageExclusion(input: { projectId: number; releaseId: number; stageId: number; reason: string | null }): Promise<Result<ReleaseStage>>;
  recordReleaseVerification(input: {
    projectId: number; releaseId: number; artifactIdentity: string;
    evidenceReference: string; summary: string; outcome: 'passed' | 'failed';
  }): Promise<Result<ReleaseVerification>>;
  confirmRelease(input: { projectId: number; releaseId: number; verificationId: number }): Promise<Result<ProjectRelease>>;
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
