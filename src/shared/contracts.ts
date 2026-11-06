export interface Project {
  id: number;
  name: string;
  createdAt: string;
}

export interface HomeProjectSummary {
  project: Project;
  checkpoint: Checkpoint | null;
  activity: { id: number; source: 'checkpoint' | 'action-event'; description: string; createdAt: string } | null;
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
  details: ActionDetails | null;
}

export type ActionType = 'requirement' | 'implementation' | 'verification' | 'decision' | 'research' | 'documentation';

export interface ActionDetails {
  instructions: string;
  applicability: string;
  definitionOfDone: string;
  evidenceGuidance: string;
  actionType: ActionType;
  position: number | null;
}

export type ActionDefinitionInput = Omit<ActionDetails, 'position'> & { title: string };

export interface WorkflowTemplate {
  id: number; name: string; description: string; version: number;
  builtInKey: string | null; createdAt: string; updatedAt: string;
}

export interface WorkflowStage {
  id: number; templateId: number; name: string; position: number; protectedClosing: boolean;
}

export interface WorkflowAction extends ActionDetails {
  id: number; templateId: number; stageId: number; title: string; position: number;
}

export interface WorkflowDetail {
  template: WorkflowTemplate;
  stages: WorkflowStage[];
  actions: WorkflowAction[];
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
  sourceTemplateId: number | null; sourceTemplateVersion: number | null; sourceTemplateName: string | null;
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
  getHomeSummary(): Promise<Result<HomeProjectSummary[]>>;
  createProject(input: { name: string }): Promise<Result<Project>>;
  openProject(input: { projectId: number }): Promise<Result<ProjectDetail>>;
  addAction(input: { projectId: number; title: string }): Promise<Result<DevelopmentAction>>;
  completeAction(input: { projectId: number; actionId: number }): Promise<Result<DevelopmentAction>>;
  reopenAction(input: { projectId: number; actionId: number }): Promise<Result<DevelopmentAction>>;
  createRelease(input: { projectId: number; name: string; templateId?: number; templateVersion?: number }): Promise<Result<ProjectRelease>>;
  getWorkflowLibrary(): Promise<Result<WorkflowDetail[]>>;
  duplicateWorkflowTemplate(input: { templateId: number; expectedVersion: number; name: string }): Promise<Result<WorkflowTemplate>>;
  createWorkflowTemplate(input: { name: string; description: string }): Promise<Result<WorkflowTemplate>>;
  updateWorkflowTemplate(input: { templateId: number; expectedVersion: number; name: string; description: string }): Promise<Result<WorkflowTemplate>>;
  addWorkflowStage(input: { templateId: number; expectedVersion: number; name: string }): Promise<Result<WorkflowStage>>;
  updateWorkflowStage(input: { templateId: number; expectedVersion: number; stageId: number; name: string }): Promise<Result<WorkflowStage>>;
  reorderWorkflowStages(input: { templateId: number; expectedVersion: number; stageIds: number[] }): Promise<Result<WorkflowTemplate>>;
  removeWorkflowStage(input: { templateId: number; expectedVersion: number; stageId: number }): Promise<Result<WorkflowTemplate>>;
  addWorkflowAction(input: { templateId: number; expectedVersion: number; stageId: number; title: string }): Promise<Result<WorkflowAction>>;
  updateWorkflowAction(input: { templateId: number; expectedVersion: number; actionId: number; stageId: number } & ActionDefinitionInput): Promise<Result<WorkflowAction>>;
  reorderWorkflowActions(input: { templateId: number; expectedVersion: number; stageId: number; actionIds: number[] }): Promise<Result<WorkflowTemplate>>;
  removeWorkflowAction(input: { templateId: number; expectedVersion: number; actionId: number }): Promise<Result<WorkflowTemplate>>;
  updateReleaseAction(input: { projectId: number; actionId: number } & ActionDefinitionInput): Promise<Result<DevelopmentAction>>;
  reorderReleaseActions(input: { projectId: number; releaseId: number; stageId: number; actionIds: number[] }): Promise<Result<ProjectRelease>>;
  addReleaseStage(input: { projectId: number; releaseId: number; name: string }): Promise<Result<ReleaseStage>>;
  updateReleaseStage(input: { projectId: number; releaseId: number; stageId: number; name: string }): Promise<Result<ReleaseStage>>;
  reorderReleaseStages(input: { projectId: number; releaseId: number; stageIds: number[] }): Promise<Result<ProjectRelease>>;
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
