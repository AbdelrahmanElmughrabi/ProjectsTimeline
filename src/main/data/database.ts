import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Checkpoint, DevelopmentAction, Project, ProjectDetail } from '../../shared/contracts';
import { AppError, payload, positiveId, requiredText } from '../domain';
import { selectResumeCheckpoint } from '../resume';

const projectColumns = 'id, name, created_at AS createdAt';
const actionColumns = 'id, project_id AS projectId, title, created_at AS createdAt, completed_at AS completedAt';
const checkpointColumns = 'id, project_id AS projectId, accomplished, next_steps AS nextSteps, created_at AS createdAt';

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
    const actions = this.db.prepare(`SELECT ${actionColumns} FROM actions WHERE project_id = ? ORDER BY id`).all(projectId) as unknown as DevelopmentAction[];
    const checkpoints = this.db.prepare(`SELECT ${checkpointColumns} FROM checkpoints WHERE project_id = ? ORDER BY created_at DESC, id DESC`).all(projectId) as unknown as Checkpoint[];
    return { project, actions, checkpoints, resume: selectResumeCheckpoint(checkpoints) };
  }

  addAction(input: unknown): DevelopmentAction {
    const values = payload(input, ['projectId', 'title']);
    const projectId = positiveId(values.projectId);
    const title = requiredText(values.title, 'Action title', 300);
    this.findProject(projectId);
    return this.db.prepare(`INSERT INTO actions(project_id, title, created_at) VALUES (?, ?, ?) RETURNING ${actionColumns}`)
      .get(projectId, title, new Date().toISOString()) as unknown as DevelopmentAction;
  }

  // Review: one SQL statement makes completion idempotent, including its timestamp.
  completeAction(input: unknown): DevelopmentAction {
    const values = payload(input, ['projectId', 'actionId']);
    const projectId = positiveId(values.projectId);
    const actionId = positiveId(values.actionId);
    const action = this.db.prepare(`UPDATE actions SET completed_at = COALESCE(completed_at, ?)
      WHERE id = ? AND project_id = ? RETURNING ${actionColumns}`)
      .get(new Date().toISOString(), actionId, projectId) as unknown as DevelopmentAction | undefined;
    if (!action) throw new AppError('NOT_FOUND', 'Action was not found in this project.');
    return action;
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
}
