import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ActionDetails, ActionEvent, Checkpoint, DevelopmentAction, Project, ProjectDetail, ProjectRelease, ReleaseStage, ReleaseVerification, ReleaseWorkspace, WorkflowDetail, WorkflowTemplate } from '../../shared/contracts';
import { AppError, payload, positiveId, requiredText } from '../domain';
import { selectResumeCheckpoint } from '../resume';
import { calculateReleaseProgress } from '../progress';
import { getWorkflowLibrary, loadWorkflowTemplate, duplicateWorkflowTemplate } from './workflows';

const projectColumns = 'id, name, created_at AS createdAt';
const actionQuery = `SELECT a.id, a.project_id AS projectId, a.title, a.created_at AS createdAt,
  CASE WHEN ra.kind = 'release-confirmation' THEN r.confirmed_at ELSE a.completed_at END AS completedAt,
  ra.release_id AS releaseId, ra.stage_id AS stageId, ra.exclusion_reason AS exclusionReason,
  COALESCE(ra.kind, 'work') AS kind, ad.action_id AS detailsId, ad.instructions, ad.applicability,
  ad.definition_of_done AS definitionOfDone, ad.evidence_guidance AS evidenceGuidance, ad.action_type AS actionType, ad.position
  FROM actions a LEFT JOIN release_actions ra ON ra.action_id = a.id LEFT JOIN releases r ON r.id = ra.release_id
  LEFT JOIN action_details ad ON ad.action_id = a.id`;
const checkpointColumns = 'id, project_id AS projectId, accomplished, next_steps AS nextSteps, created_at AS createdAt';
const releaseColumns = 'id, project_id AS projectId, name, created_at AS createdAt, scope_revision AS scopeRevision, policy_version AS policyVersion, confirmed_at AS confirmedAt, confirmed_verification_id AS confirmedVerificationId, source_template_id AS sourceTemplateId, source_template_version AS sourceTemplateVersion, source_template_name AS sourceTemplateName';
const stageColumns = 'id, release_id AS releaseId, stage_key AS key, name, position, exclusion_reason AS exclusionReason';
const verificationColumns = 'id, release_id AS releaseId, scope_revision AS scopeRevision, artifact_identity AS artifactIdentity, evidence_reference AS evidenceReference, summary, outcome, created_at AS createdAt';

const defaultStages = [
  ['requirements', 'Requirements and Planning'],
  ['design', 'UX, Architecture, and Technical Design'],
  ['setup', 'Development Environment and Project Setup'],
  ['implementation', 'Implementation'],
  ['verification', 'Integrated Release Verification'],
  ['preparation', 'Release Preparation'],
  ['release_confirmation', 'Deployment/Distribution and Release Confirmation'],
] as const;

function actionFromRow(row: unknown): DevelopmentAction {
  const { detailsId, instructions, applicability, definitionOfDone, evidenceGuidance, actionType, position, ...action } = row as Omit<DevelopmentAction, 'details'> & ActionDetails & { detailsId: number | null };
  return { ...action, details: detailsId === null ? null : { instructions, applicability, definitionOfDone, evidenceGuidance, actionType, position } };
}

// Review: schema changes and their version marker commit together, after a SQLite-consistent backup.
export async function migrate(db: DatabaseSync, filename: string, directory: string): Promise<void> {
  const files = readdirSync(directory).filter((file) => file.endsWith('.sql')).sort();
  for (const [index, file] of files.entries()) {
    if (!new RegExp(`^${String(index + 1).padStart(3, '0')}_[a-z_]+\\.sql$`).test(file)) {
      throw new Error('Migration files must have consecutive versions starting at 001.');
    }
  }
  if (files.length === 0) throw new Error('No database migrations found.');
  const version = db.prepare('PRAGMA user_version').get()!.user_version as number;
  if (version > files.length) throw new Error('Database schema is newer than this application.');
  if (version === files.length) return;
  const hasTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' LIMIT 1").get();
  if (version === 0 && hasTables) throw new Error('Unversioned database contains tables; refusing to modify it.');
  if (version > 0) await backup(db, `${filename}.before-v${files.length}.${Date.now()}.bak`);

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const file of files.slice(version)) db.exec(readFileSync(join(directory, file), 'utf8'));
    if (db.prepare('PRAGMA foreign_key_check').get()) throw new Error('Migration produced invalid relationships.');
    db.exec(`PRAGMA user_version = ${files.length}`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export async function openStore(filename: string, migrationsDirectory = join(__dirname, 'migrations')): Promise<WorkspaceStore> {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename, { timeout: 1000, enableForeignKeyConstraints: true });
  try {
    db.exec('PRAGMA foreign_keys = ON');
    if (db.prepare('PRAGMA foreign_keys').get()!.foreign_keys !== 1) {
      throw new Error('Foreign key enforcement could not be enabled.');
    }
    await migrate(db, filename, migrationsDirectory);
    return new WorkspaceStore(db);
  } catch (error) {
    db.close();
    throw error;
  }
}

// shortcut: short SQLite calls run on main; move them to a worker if measured stalls affect the UI.
export class WorkspaceStore {
  constructor(private readonly db: DatabaseSync) {}

  close(): void { this.db.close(); }

  listProjects(): Project[] {
    return this.db.prepare(`SELECT ${projectColumns} FROM projects ORDER BY id DESC`).all() as unknown as Project[];
  }

  createProject(input: unknown): Project {
    const values = payload(input, ['name']);
    const name = requiredText(values.name, 'Project name', 120);
    return this.db.prepare(`INSERT INTO projects(name, created_at) VALUES (?, ?) RETURNING ${projectColumns}`)
      .get(name, new Date().toISOString()) as unknown as Project;
  }

  openProject(input: unknown): ProjectDetail {
    const values = payload(input, ['projectId']);
    const projectId = positiveId(values.projectId);
    const project = this.findProject(projectId);
    const actions = this.projectActions(projectId);
    const checkpoints = this.db.prepare(`SELECT ${checkpointColumns} FROM checkpoints WHERE project_id = ? ORDER BY created_at DESC, id DESC`).all(projectId) as unknown as Checkpoint[];
    const releases = (this.db.prepare(`SELECT ${releaseColumns} FROM releases WHERE project_id = ? ORDER BY id DESC`).all(projectId) as unknown as ProjectRelease[])
      .map(release => this.releaseWorkspace(release, actions));
    const actionEvents = this.db.prepare('SELECT id, project_id AS projectId, release_id AS releaseId, action_id AS actionId, description, created_at AS createdAt FROM action_events WHERE project_id = ? ORDER BY id DESC').all(projectId) as unknown as ActionEvent[];
    return { project, actions, checkpoints, resume: selectResumeCheckpoint(checkpoints), releases, actionEvents };
  }

  addAction(input: unknown): DevelopmentAction {
    const values = payload(input, ['projectId', 'title']);
    const projectId = positiveId(values.projectId);
    const title = requiredText(values.title, 'Action title', 300);
    return this.transaction(() => {
      this.findProject(projectId);
      const actionId = Number(this.db.prepare('INSERT INTO actions(project_id, title, created_at) VALUES (?, ?, ?)').run(projectId, title, new Date().toISOString()).lastInsertRowid);
      const action = this.findAction(projectId, actionId);
      this.event(projectId, null, actionId, 'Created backlog action', null, action);
      return action;
    });
  }

  completeAction(input: unknown): DevelopmentAction {
    return this.changeCompletion(input, true);
  }

  reopenAction(input: unknown): DevelopmentAction {
    return this.changeCompletion(input, false);
  }

  private changeCompletion(input: unknown, completed: boolean): DevelopmentAction {
    const values = payload(input, ['projectId', 'actionId']);
    const projectId = positiveId(values.projectId);
    const actionId = positiveId(values.actionId);
    return this.transaction(() => {
      const before = this.findAction(projectId, actionId);
      this.editableAction(before);
      if (Boolean(before.completedAt) === completed) return before;
      this.db.prepare('UPDATE actions SET completed_at = ? WHERE id = ?').run(completed ? new Date().toISOString() : null, actionId);
      this.bump(before.releaseId);
      const after = this.findAction(projectId, actionId);
      this.event(projectId, before.releaseId, actionId, completed ? 'Completed action' : 'Reopened action', before, after);
      return after;
    });
  }

  createRelease(input: unknown): ProjectRelease {
    const values = payload(input, ['projectId', 'name', 'templateId', 'templateVersion']);
    const projectId = positiveId(values.projectId);
    const name = requiredText(values.name, 'Release name', 120);
    return this.transaction(() => {
      this.findProject(projectId);
      const hasTemplate = values.templateId !== undefined || values.templateVersion !== undefined;
      const workflow = hasTemplate ? loadWorkflowTemplate(this.db, positiveId(values.templateId), positiveId(values.templateVersion)) : null;
      const now = new Date().toISOString();
      const releaseId = Number(this.db.prepare('INSERT INTO releases(project_id, name, created_at, source_template_id, source_template_version, source_template_name) VALUES (?, ?, ?, ?, ?, ?)')
        .run(projectId, name, now, workflow?.template.id ?? null, workflow?.template.version ?? null, workflow?.template.name ?? null).lastInsertRowid);
      const insert = this.db.prepare('INSERT INTO release_stages(release_id, stage_key, name, position) VALUES (?, ?, ?, ?)');
      const stageMap = new Map<number, number>();
      if (workflow) {
        for (const stage of workflow.stages) {
          const result = insert.run(releaseId, stage.protectedClosing ? 'release_confirmation' : `workflow_stage_${stage.id}`, stage.name, stage.position);
          stageMap.set(stage.id, Number(result.lastInsertRowid));
        }
        for (const source of workflow.actions) {
          const actionId = Number(this.db.prepare('INSERT INTO actions(project_id, title, created_at) VALUES (?, ?, ?)').run(projectId, source.title, now).lastInsertRowid);
          this.db.prepare('INSERT INTO release_actions(action_id, release_id, stage_id) VALUES (?, ?, ?)').run(actionId, releaseId, stageMap.get(source.stageId)!);
          this.db.prepare('INSERT INTO action_details(action_id, instructions, applicability, definition_of_done, evidence_guidance, action_type, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(actionId, source.instructions, source.applicability, source.definitionOfDone, source.evidenceGuidance, source.actionType, source.position);
          this.event(projectId, releaseId, actionId, `Created committed action from ${workflow.template.name} v${workflow.template.version}`, null, this.findAction(projectId, actionId));
        }
      } else defaultStages.forEach(([key, label], position) => insert.run(releaseId, key, label, position));
      const closing = this.stages(releaseId).find(stage => stage.key === 'release_confirmation')!;
      const actionId = Number(this.db.prepare('INSERT INTO actions(project_id, title, created_at) VALUES (?, ?, ?)').run(projectId, 'Confirm the released version works', now).lastInsertRowid);
      this.db.prepare("INSERT INTO release_actions(action_id, release_id, stage_id, kind) VALUES (?, ?, ?, 'release-confirmation')").run(actionId, releaseId, closing.id);
      const release = this.findRelease(projectId, releaseId);
      this.event(projectId, releaseId, actionId, `Created release “${name}” with ${workflow ? `workflow ${workflow.template.name} v${workflow.template.version}` : 'its seven-stage workflow'} and protected confirmation`, null, release);
      return release;
    });
  }

  getWorkflowLibrary(): WorkflowDetail[] { return getWorkflowLibrary(this.db); }

  duplicateWorkflowTemplate(input: unknown): WorkflowTemplate {
    return this.transaction(() => duplicateWorkflowTemplate(this.db, input));
  }

  assignAction(input: unknown): DevelopmentAction {
    const values = payload(input, ['projectId', 'actionId', 'releaseId', 'stageId']);
    const projectId = positiveId(values.projectId);
    const actionId = positiveId(values.actionId);
    const releaseId = positiveId(values.releaseId);
    const stageId = values.stageId === null ? null : positiveId(values.stageId);
    return this.transaction(() => {
      const before = this.findAction(projectId, actionId);
      this.editableAction(before);
      this.editableRelease(projectId, releaseId);
      if (before.releaseId !== null && before.releaseId !== releaseId) throw new AppError('VALIDATION', 'Committed actions stay with their release. Create a new action for another release.');
      const stage = stageId === null ? null : this.findStage(releaseId, stageId);
      if (stage?.exclusionReason && before.exclusionReason === null) throw new AppError('VALIDATION', 'Choose an included stage for applicable work.');
      if (before.releaseId === releaseId && before.stageId === stageId) return before;
      if (before.releaseId === null) this.db.prepare('INSERT INTO release_actions(action_id, release_id, stage_id) VALUES (?, ?, ?)').run(actionId, releaseId, stageId);
      else this.db.prepare('UPDATE release_actions SET stage_id = ? WHERE action_id = ?').run(stageId, actionId);
      this.bump(releaseId);
      const after = this.findAction(projectId, actionId);
      this.event(projectId, releaseId, actionId, `${before.releaseId === null ? 'Committed action' : 'Reassigned action'} to ${stage?.name ?? 'Unassigned'}`, before, after);
      return after;
    });
  }

  setActionExclusion(input: unknown): DevelopmentAction {
    const values = payload(input, ['projectId', 'actionId', 'reason']);
    const projectId = positiveId(values.projectId);
    const actionId = positiveId(values.actionId);
    const reason = values.reason === null ? null : requiredText(values.reason, 'Exclusion reason', 2000);
    return this.transaction(() => {
      const before = this.findAction(projectId, actionId);
      this.editableAction(before);
      if (before.releaseId === null) throw new AppError('VALIDATION', 'Backlog suggestions are already outside release scope.');
      if (reason === null && before.stageId !== null && this.findStage(before.releaseId, before.stageId).exclusionReason) throw new AppError('VALIDATION', 'Include the stage or reassign this action before restoring it.');
      if (before.exclusionReason === reason) return before;
      this.db.prepare('UPDATE release_actions SET exclusion_reason = ? WHERE action_id = ?').run(reason, actionId);
      this.bump(before.releaseId);
      const after = this.findAction(projectId, actionId);
      this.event(projectId, before.releaseId, actionId, reason === null ? 'Restored action to applicable scope' : `Excluded action: ${reason}`, before, after);
      return after;
    });
  }

  setStageExclusion(input: unknown): ReleaseStage {
    const values = payload(input, ['projectId', 'releaseId', 'stageId', 'reason']);
    const projectId = positiveId(values.projectId);
    const releaseId = positiveId(values.releaseId);
    const stageId = positiveId(values.stageId);
    const reason = values.reason === null ? null : requiredText(values.reason, 'Stage exclusion reason', 2000);
    return this.transaction(() => {
      this.editableRelease(projectId, releaseId);
      const before = this.findStage(releaseId, stageId);
      if (before.key === 'release_confirmation' && reason !== null) throw new AppError('FORBIDDEN', 'The final confirmation stage is required.');
      if (reason !== null && this.db.prepare('SELECT 1 FROM release_actions WHERE stage_id = ? AND exclusion_reason IS NULL LIMIT 1').get(stageId)) throw new AppError('VALIDATION', 'Reassign or explicitly exclude applicable actions before excluding their stage.');
      if (before.exclusionReason === reason) return before;
      this.db.prepare('UPDATE release_stages SET exclusion_reason = ? WHERE id = ?').run(reason, stageId);
      this.bump(releaseId);
      const after = this.findStage(releaseId, stageId);
      this.event(projectId, releaseId, null, reason === null ? `Included stage: ${before.name}` : `Excluded stage ${before.name}: ${reason}`, before, after);
      return after;
    });
  }

  recordReleaseVerification(input: unknown): ReleaseVerification {
    const values = payload(input, ['projectId', 'releaseId', 'artifactIdentity', 'evidenceReference', 'summary', 'outcome']);
    const projectId = positiveId(values.projectId);
    const releaseId = positiveId(values.releaseId);
    const artifact = requiredText(values.artifactIdentity, 'Artifact/version identity', 300);
    const evidence = requiredText(values.evidenceReference, 'Evidence reference', 2000);
    const summary = requiredText(values.summary, 'Verification summary', 10000);
    if (values.outcome !== 'passed' && values.outcome !== 'failed') throw new AppError('VALIDATION', 'Choose a passed or failed verification outcome.');
    const outcome = values.outcome;
    return this.transaction(() => {
      const release = this.editableRelease(projectId, releaseId);
      const id = Number(this.db.prepare('INSERT INTO release_verifications(release_id, scope_revision, artifact_identity, evidence_reference, summary, outcome, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(releaseId, release.scopeRevision, artifact, evidence, summary, outcome, new Date().toISOString()).lastInsertRowid);
      const verification = this.verifications(releaseId).find(row => row.id === id)!;
      this.event(projectId, releaseId, null, `Recorded ${outcome} manual verification for ${artifact}`, null, verification);
      return verification;
    });
  }

  confirmRelease(input: unknown): ProjectRelease {
    const values = payload(input, ['projectId', 'releaseId', 'verificationId']);
    const projectId = positiveId(values.projectId);
    const releaseId = positiveId(values.releaseId);
    const verificationId = positiveId(values.verificationId);
    return this.transaction(() => {
      const before = this.findRelease(projectId, releaseId);
      if (before.confirmedAt !== null) {
        if (before.confirmedVerificationId === verificationId) return before;
        throw new AppError('FORBIDDEN', 'This release is already confirmed and frozen.');
      }
      const snapshot = this.releaseWorkspace(before, this.projectActions(projectId));
      const latest = snapshot.verifications[0];
      if (!latest || latest.id !== verificationId || latest.outcome !== 'passed' || latest.scopeRevision !== before.scopeRevision) throw new AppError('VALIDATION', 'Confirmation requires the latest passed verification of this release’s current scope.');
      const work = this.projectActions(projectId).filter(action => action.releaseId === releaseId && action.exclusionReason === null && action.kind === 'work');
      if (snapshot.progress.percent === null || work.some(action => action.completedAt === null)) throw new AppError('VALIDATION', 'Resolve scope review and complete all applicable committed work before confirming.');
      this.db.prepare('UPDATE releases SET confirmed_at = ?, confirmed_verification_id = ? WHERE id = ?').run(new Date().toISOString(), verificationId, releaseId);
      const after = this.findRelease(projectId, releaseId);
      const confirmed = this.releaseWorkspace(after, this.projectActions(projectId));
      if (confirmed.progress.state !== 'confirmed') throw new AppError('VALIDATION', 'Release confirmation did not satisfy the complete scope.');
      const gate = this.projectActions(projectId).find(action => action.releaseId === releaseId && action.kind === 'release-confirmation')!;
      this.event(projectId, releaseId, gate.id, `Confirmed release using manual verification of ${latest.artifactIdentity}`, before, after);
      return after;
    });
  }

  saveCheckpoint(input: unknown): Checkpoint {
    const values = payload(input, ['projectId', 'accomplished', 'nextSteps']);
    const projectId = positiveId(values.projectId);
    const accomplished = requiredText(values.accomplished, 'What I accomplished', 10000);
    const nextSteps = requiredText(values.nextSteps, 'What to do next', 10000);
    this.findProject(projectId);
    return this.db.prepare(`INSERT INTO checkpoints(project_id, accomplished, next_steps, created_at)
      VALUES (?, ?, ?, ?) RETURNING ${checkpointColumns}`)
      .get(projectId, accomplished, nextSteps, new Date().toISOString()) as unknown as Checkpoint;
  }

  private findProject(projectId: number): Project {
    const project = this.db.prepare(`SELECT ${projectColumns} FROM projects WHERE id = ?`).get(projectId) as unknown as Project | undefined;
    if (!project) throw new AppError('NOT_FOUND', 'Project was not found.');
    return project;
  }

  private transaction<T>(operation: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const value = operation();
      this.db.exec('COMMIT');
      return value;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  private projectActions(projectId: number): DevelopmentAction[] {
    return this.db.prepare(`${actionQuery} WHERE a.project_id = ? ORDER BY a.id`).all(projectId).map(actionFromRow);
  }

  private findAction(projectId: number, actionId: number): DevelopmentAction {
    const row = this.db.prepare(`${actionQuery} WHERE a.project_id = ? AND a.id = ?`).get(projectId, actionId);
    if (!row) throw new AppError('NOT_FOUND', 'Action was not found in this project.');
    return actionFromRow(row);
  }

  private findRelease(projectId: number, releaseId: number): ProjectRelease {
    const release = this.db.prepare(`SELECT ${releaseColumns} FROM releases WHERE project_id = ? AND id = ?`).get(projectId, releaseId) as unknown as ProjectRelease | undefined;
    if (!release) throw new AppError('NOT_FOUND', 'Release was not found in this project.');
    return release;
  }

  private editableRelease(projectId: number, releaseId: number): ProjectRelease {
    const release = this.findRelease(projectId, releaseId);
    if (release.confirmedAt !== null) throw new AppError('FORBIDDEN', 'Confirmed releases are frozen. Start a new release for further work.');
    return release;
  }

  private editableAction(action: DevelopmentAction): void {
    if (action.kind === 'release-confirmation') throw new AppError('FORBIDDEN', 'Final confirmation requires a current passed verification record.');
    if (action.releaseId !== null) this.editableRelease(action.projectId, action.releaseId);
  }

  private stages(releaseId: number): ReleaseStage[] {
    return this.db.prepare(`SELECT ${stageColumns} FROM release_stages WHERE release_id = ? ORDER BY position, id`).all(releaseId) as unknown as ReleaseStage[];
  }

  private findStage(releaseId: number, stageId: number): ReleaseStage {
    const stage = this.stages(releaseId).find(row => row.id === stageId);
    if (!stage) throw new AppError('NOT_FOUND', 'Stage was not found in this release.');
    return stage;
  }

  private verifications(releaseId: number): ReleaseVerification[] {
    return this.db.prepare(`SELECT ${verificationColumns} FROM release_verifications WHERE release_id = ? ORDER BY id DESC`).all(releaseId) as unknown as ReleaseVerification[];
  }

  private releaseWorkspace(release: ProjectRelease, actions: DevelopmentAction[]): ReleaseWorkspace {
    const stages = this.stages(release.id);
    const verifications = this.verifications(release.id);
    if (release.policyVersion !== 1) throw new AppError('VALIDATION', 'Unsupported release progress policy version.');
    if (release.confirmedAt !== null && !verifications.some(row => row.id === release.confirmedVerificationId && row.outcome === 'passed' && row.scopeRevision === release.scopeRevision)) throw new AppError('VALIDATION', 'Confirmed release verification is invalid.');
    const progress = calculateReleaseProgress({
      releaseId: release.id,
      stages: stages.map(stage => ({ id: stage.id, included: stage.exclusionReason === null })),
      actions: actions.filter(action => action.releaseId === release.id || action.releaseId === null).map(action => ({
        id: action.id, stageId: action.stageId, committed: action.releaseId === release.id,
        applicable: action.exclusionReason === null, completed: action.completedAt !== null, kind: action.kind,
      })),
    });
    return { release, stages, progress, verifications };
  }

  private bump(releaseId: number | null): void {
    if (releaseId !== null) this.db.prepare('UPDATE releases SET scope_revision = scope_revision + 1 WHERE id = ?').run(releaseId);
  }

  private event(projectId: number, releaseId: number | null, actionId: number | null, description: string, before: unknown, after: unknown): void {
    this.db.prepare('INSERT INTO action_events(project_id, release_id, action_id, description, before_value, after_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(projectId, releaseId, actionId, description, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after), new Date().toISOString());
  }
}
