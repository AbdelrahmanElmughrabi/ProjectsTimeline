import { DatabaseSync } from 'node:sqlite';
import type { ActionDefinitionInput, ActionType, WorkflowAction, WorkflowDetail, WorkflowStage, WorkflowTemplate } from '../../shared/contracts';
import { AppError, payload, positiveId, requiredText } from '../domain';

const templateColumns = `id, name, description, version, built_in_key AS builtInKey,
  created_at AS createdAt, updated_at AS updatedAt`;

type TemplateRow = WorkflowTemplate;
type StageRow = Omit<WorkflowStage, 'protectedClosing'> & { protectedClosing: number };

export function getWorkflowLibrary(db: DatabaseSync): WorkflowDetail[] {
  const templates = db.prepare(`SELECT ${templateColumns} FROM workflow_templates
    ORDER BY CASE WHEN built_in_key IS NULL THEN 1 ELSE 0 END, id`).all() as unknown as TemplateRow[];
  return templates.map((template) => loadWorkflowTemplate(db, template.id, template.version));
}

export function loadWorkflowTemplate(db: DatabaseSync, templateId: number, expectedVersion?: number): WorkflowDetail {
  const id = positiveId(templateId);
  if (expectedVersion !== undefined) positiveId(expectedVersion);

  const template = db.prepare(`SELECT ${templateColumns} FROM workflow_templates WHERE id = ?`).get(id) as unknown as TemplateRow | undefined;
  if (!template) throw new AppError('NOT_FOUND', 'Workflow template was not found.');
  positiveId(template.id);
  positiveId(template.version);
  if (expectedVersion !== undefined && template.version !== expectedVersion) {
    throw new AppError('VALIDATION', 'This workflow template changed. Reload it before continuing.');
  }

  const stages = (db.prepare(`SELECT id, template_id AS templateId, name, position,
      protected_closing AS protectedClosing
    FROM workflow_template_stages WHERE template_id = ? ORDER BY position, id`).all(id) as unknown as StageRow[])
    .map((stage) => ({ ...stage, protectedClosing: stage.protectedClosing === 1 }));
  const actions = db.prepare(`SELECT id, template_id AS templateId, stage_id AS stageId, position, title,
      instructions, applicability, definition_of_done AS definitionOfDone,
      evidence_guidance AS evidenceGuidance, action_type AS actionType
    FROM workflow_template_actions WHERE template_id = ? ORDER BY position, id`).all(id) as unknown as WorkflowAction[];

  const closing = stages.filter((stage) => stage.protectedClosing);
  if (closing.length !== 1 || stages.length === 0 || closing[0].id !== stages[stages.length - 1].id) {
    throw new AppError('VALIDATION', 'Workflow template must have exactly one protected closing stage in the final position.');
  }
  const stageIds = new Set<number>();
  for (const stage of stages) {
    positiveId(stage.id);
    if (stage.templateId !== id || stageIds.has(stage.id)) throw new AppError('VALIDATION', 'Workflow template contains an invalid stage relationship.');
    stageIds.add(stage.id);
  }
  for (const action of actions) {
    positiveId(action.id);
    if (action.templateId !== id || !stageIds.has(action.stageId)) {
      throw new AppError('VALIDATION', 'Workflow action references a stage outside its template.');
    }
    if (!['requirement', 'implementation', 'verification', 'decision', 'research', 'documentation'].includes(action.actionType as ActionType)) {
      throw new AppError('VALIDATION', 'Workflow template contains an invalid action type.');
    }
  }
  return { template, stages, actions };
}

export function duplicateWorkflowTemplate(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = payload(input, ['templateId', 'expectedVersion', 'name']);
  const source = loadWorkflowTemplate(db, positiveId(values.templateId), positiveId(values.expectedVersion));
  const name = requiredText(values.name, 'Template name', 120);
  const now = new Date().toISOString();

  const result = db.prepare(`INSERT INTO workflow_templates
    (name, description, version, built_in_key, created_at, updated_at)
    VALUES (?, ?, 1, NULL, ?, ?)`).run(name, source.template.description, now, now);
  const templateId = Number(result.lastInsertRowid);
  positiveId(templateId);

  const stageInsert = db.prepare(`INSERT INTO workflow_template_stages
    (template_id, name, position, protected_closing) VALUES (?, ?, ?, ?)`);
  const stageIdBySource = new Map<number, number>();
  for (const stage of source.stages) {
    const stageResult = stageInsert.run(templateId, stage.name, stage.position, stage.protectedClosing ? 1 : 0);
    stageIdBySource.set(stage.id, Number(stageResult.lastInsertRowid));
  }

  const actionInsert = db.prepare(`INSERT INTO workflow_template_actions
    (template_id, stage_id, position, title, instructions, applicability,
      definition_of_done, evidence_guidance, action_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const action of source.actions) {
    const stageId = stageIdBySource.get(action.stageId);
    if (stageId === undefined) throw new AppError('VALIDATION', 'Workflow action references a stage outside its template.');
    actionInsert.run(templateId, stageId, action.position, action.title, action.instructions,
      action.applicability, action.definitionOfDone, action.evidenceGuidance, action.actionType);
  }

  return loadWorkflowTemplate(db, templateId, 1).template;
}

const actionTypes: ActionType[] = ['requirement', 'implementation', 'verification', 'decision', 'research', 'documentation'];
const actionFields = ['title', 'instructions', 'applicability', 'definitionOfDone', 'evidenceGuidance', 'actionType'];

export function parseActionDefinition(values: Record<string, unknown>): ActionDefinitionInput {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) throw new AppError('VALIDATION', 'Expected an action definition.');
  const actionType = values.actionType;
  if (typeof actionType !== 'string' || !actionTypes.includes(actionType as ActionType)) {
    throw new AppError('VALIDATION', 'Choose a valid action type.');
  }
  const text = (key: string, label: string, maximum: number) => {
    const value = values[key];
    if (typeof value !== 'string' || value.length > maximum) throw new AppError('VALIDATION', `${label} must be text of at most ${maximum} characters.`);
    return value.trim();
  };
  return {
    title: requiredText(values.title, 'Action title', 300),
    instructions: text('instructions', 'Instructions', 10000),
    applicability: text('applicability', 'Applicability', 2000),
    definitionOfDone: text('definitionOfDone', 'Definition of done', 10000),
    evidenceGuidance: text('evidenceGuidance', 'Evidence guidance', 2000),
    actionType: actionType as ActionType,
  };
}

export function validateOrder(value: unknown, expectedIds: readonly number[]): number[] {
  if (!Array.isArray(value) || value.length !== expectedIds.length) throw new AppError('VALIDATION', 'The order must include every current item exactly once.');
  const actual = value.map(positiveId);
  const expected = new Set(expectedIds.map(positiveId));
  if (expected.size !== expectedIds.length || new Set(actual).size !== actual.length || actual.some((id) => !expected.has(id))) {
    throw new AppError('VALIDATION', 'The order must include every current item exactly once.');
  }
  return actual;
}

function exactInput(input: unknown, fields: string[]): Record<string, unknown> {
  return payload(input, fields);
}

function editableTemplate(db: DatabaseSync, values: Record<string, unknown>): WorkflowDetail {
  const detail = loadWorkflowTemplate(db, positiveId(values.templateId), positiveId(values.expectedVersion));
  if (detail.template.builtInKey !== null) throw new AppError('FORBIDDEN', 'Built-in workflow editions are read-only. Duplicate one to customize it.');
  return detail;
}

function saveEdit(db: DatabaseSync, templateId: number, changed: boolean): WorkflowDetail {
  if (changed) {
    db.prepare('UPDATE workflow_templates SET version = version + 1, updated_at = ? WHERE id = ? AND built_in_key IS NULL')
      .run(new Date().toISOString(), templateId);
  }
  const row = db.prepare('SELECT version FROM workflow_templates WHERE id = ?').get(templateId) as { version: number } | undefined;
  if (!row) throw new AppError('NOT_FOUND', 'Workflow template was not found.');
  return loadWorkflowTemplate(db, templateId, row.version);
}

function ownedStage(detail: WorkflowDetail, stageId: unknown): WorkflowStage {
  const id = positiveId(stageId);
  const stage = detail.stages.find((item) => item.id === id);
  if (!stage) throw new AppError('NOT_FOUND', 'Workflow stage was not found in this template.');
  return stage;
}

function ownedAction(detail: WorkflowDetail, actionId: unknown): WorkflowAction {
  const id = positiveId(actionId);
  const action = detail.actions.find((item) => item.id === id);
  if (!action) throw new AppError('NOT_FOUND', 'Workflow action was not found in this template.');
  return action;
}

function reorderStages(db: DatabaseSync, templateId: number, stageIds: readonly number[]): void {
  const row = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS nextOffset FROM workflow_template_stages WHERE template_id = ?').get(templateId) as unknown as { nextOffset: number };
  const offset = row.nextOffset;
  db.prepare('UPDATE workflow_template_stages SET position = position + ? WHERE template_id = ?').run(offset, templateId);
  const update = db.prepare('UPDATE workflow_template_stages SET position = ? WHERE template_id = ? AND id = ?');
  stageIds.forEach((id, position) => update.run(position, templateId, id));
}

function compactStagePositions(db: DatabaseSync, templateId: number): void {
  const stages = db.prepare('SELECT id FROM workflow_template_stages WHERE template_id = ? ORDER BY position, id').all(templateId) as unknown as { id: number }[];
  reorderStages(db, templateId, stages.map((stage) => stage.id));
}

function reorderActions(db: DatabaseSync, templateId: number, stageId: number, actionIds: readonly number[]): void {
  const row = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS nextOffset FROM workflow_template_actions WHERE template_id = ? AND stage_id = ?').get(templateId, stageId) as unknown as { nextOffset: number };
  const offset = row.nextOffset;
  db.prepare('UPDATE workflow_template_actions SET position = position + ? WHERE template_id = ? AND stage_id = ?').run(offset, templateId, stageId);
  const update = db.prepare('UPDATE workflow_template_actions SET position = ? WHERE template_id = ? AND stage_id = ? AND id = ?');
  actionIds.forEach((id, position) => update.run(position, templateId, stageId, id));
}

function compactActionPositions(db: DatabaseSync, templateId: number, stageId: number): void {
  const actions = db.prepare('SELECT id FROM workflow_template_actions WHERE template_id = ? AND stage_id = ? ORDER BY position, id').all(templateId, stageId) as unknown as { id: number }[];
  reorderActions(db, templateId, stageId, actions.map((action) => action.id));
}

export function createWorkflowTemplate(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = exactInput(input, ['name', 'description']);
  const name = requiredText(values.name, 'Template name', 120);
  if (typeof values.description !== 'string' || values.description.length > 10000) throw new AppError('VALIDATION', 'Description must be text of at most 10000 characters.');
  const description = values.description.trim();
  const seed = db.prepare(`SELECT id, version FROM workflow_templates WHERE built_in_key = ? AND version = 1`).get('seven-stage-engineering') as { id: number; version: number } | undefined;
  if (!seed) throw new AppError('STORAGE', 'The starter workflow edition is missing.');
  const starter = loadWorkflowTemplate(db, seed.id, seed.version);
  const now = new Date().toISOString();
  const result = db.prepare(`INSERT INTO workflow_templates (name, description, version, built_in_key, created_at, updated_at)
    VALUES (?, ?, 1, NULL, ?, ?)`).run(name, description, now, now);
  const templateId = Number(result.lastInsertRowid);
  const insert = db.prepare(`INSERT INTO workflow_template_stages (template_id, name, position, protected_closing) VALUES (?, ?, ?, ?)`);
  for (const stage of starter.stages) insert.run(templateId, stage.name, stage.position, stage.protectedClosing ? 1 : 0);
  return loadWorkflowTemplate(db, templateId, 1).template;
}

export function updateWorkflowTemplate(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'name', 'description']);
  const detail = editableTemplate(db, values);
  const name = requiredText(values.name, 'Template name', 120);
  if (typeof values.description !== 'string' || values.description.length > 10000) throw new AppError('VALIDATION', 'Description must be text of at most 10000 characters.');
  const description = values.description.trim();
  const changed = name !== detail.template.name || description !== detail.template.description;
  if (changed) db.prepare('UPDATE workflow_templates SET name = ?, description = ? WHERE id = ?').run(name, description, detail.template.id);
  return saveEdit(db, detail.template.id, changed).template;
}

export function addWorkflowStage(db: DatabaseSync, input: unknown): WorkflowStage {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'name']);
  const detail = editableTemplate(db, values);
  const name = requiredText(values.name, 'Stage name', 200);
  const result = db.prepare(`INSERT INTO workflow_template_stages (template_id, name, position, protected_closing)
    VALUES (?, ?, ?, 0)`).run(detail.template.id, name, detail.stages.length);
  const id = Number(result.lastInsertRowid);
  const order = detail.stages.map((stage) => stage.id);
  order.splice(order.length - 1, 0, id);
  reorderStages(db, detail.template.id, order);
  const saved = saveEdit(db, detail.template.id, true);
  return saved.stages.find((stage) => stage.id === id)!;
}

export function updateWorkflowStage(db: DatabaseSync, input: unknown): WorkflowStage {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'stageId', 'name']);
  const detail = editableTemplate(db, values);
  const stage = ownedStage(detail, values.stageId);
  const name = requiredText(values.name, 'Stage name', 200);
  const changed = name !== stage.name;
  if (changed) db.prepare('UPDATE workflow_template_stages SET name = ? WHERE id = ? AND template_id = ?').run(name, stage.id, detail.template.id);
  return saveEdit(db, detail.template.id, changed).stages.find((item) => item.id === stage.id)!;
}

export function reorderWorkflowStages(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'stageIds']);
  const detail = editableTemplate(db, values);
  const ids = validateOrder(values.stageIds, detail.stages.map((stage) => stage.id));
  if (ids[ids.length - 1] !== detail.stages[detail.stages.length - 1].id) throw new AppError('VALIDATION', 'The protected closing stage must remain last.');
  const changed = ids.some((id, index) => id !== detail.stages[index].id);
  if (changed) reorderStages(db, detail.template.id, ids);
  return saveEdit(db, detail.template.id, changed).template;
}

export function removeWorkflowStage(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'stageId']);
  const detail = editableTemplate(db, values);
  const stage = ownedStage(detail, values.stageId);
  if (stage.protectedClosing) throw new AppError('FORBIDDEN', 'The protected closing stage cannot be removed.');
  if (detail.actions.some((action) => action.stageId === stage.id)) throw new AppError('VALIDATION', 'Move or remove this stage’s actions before removing the stage.');
  db.prepare('DELETE FROM workflow_template_stages WHERE id = ? AND template_id = ?').run(stage.id, detail.template.id);
  compactStagePositions(db, detail.template.id);
  return saveEdit(db, detail.template.id, true).template;
}

export function addWorkflowAction(db: DatabaseSync, input: unknown): WorkflowAction {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'stageId', 'title']);
  const detail = editableTemplate(db, values);
  const stage = ownedStage(detail, values.stageId);
  const title = requiredText(values.title, 'Action title', 300);
  const position = detail.actions.filter((action) => action.stageId === stage.id).length;
  const result = db.prepare(`INSERT INTO workflow_template_actions
    (template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
    VALUES (?, ?, ?, ?, '', '', '', '', 'implementation')`).run(detail.template.id, stage.id, position, title);
  const id = Number(result.lastInsertRowid);
  const saved = saveEdit(db, detail.template.id, true);
  return saved.actions.find((action) => action.id === id)!;
}

export function updateWorkflowAction(db: DatabaseSync, input: unknown): WorkflowAction {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'actionId', 'stageId', ...actionFields]);
  const detail = editableTemplate(db, values);
  const action = ownedAction(detail, values.actionId);
  const stage = ownedStage(detail, values.stageId);
  const definition = parseActionDefinition(values);
  const changed = action.stageId !== stage.id || action.title !== definition.title || action.instructions !== definition.instructions
    || action.applicability !== definition.applicability || action.definitionOfDone !== definition.definitionOfDone
    || action.evidenceGuidance !== definition.evidenceGuidance || action.actionType !== definition.actionType;
  if (!changed) return saveEdit(db, detail.template.id, false).actions.find((item) => item.id === action.id)!;

  if (stage.id !== action.stageId) {
    const targetPosition = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS position FROM workflow_template_actions WHERE template_id = ? AND stage_id = ?')
      .get(detail.template.id, stage.id) as { position: number };
    db.prepare(`UPDATE workflow_template_actions SET stage_id = ?, position = ? WHERE id = ? AND template_id = ?`)
      .run(stage.id, targetPosition.position, action.id, detail.template.id);
    compactActionPositions(db, detail.template.id, action.stageId);
    compactActionPositions(db, detail.template.id, stage.id);
  }
  db.prepare(`UPDATE workflow_template_actions SET title = ?, instructions = ?, applicability = ?, definition_of_done = ?,
    evidence_guidance = ?, action_type = ? WHERE id = ? AND template_id = ?`)
    .run(definition.title, definition.instructions, definition.applicability, definition.definitionOfDone,
      definition.evidenceGuidance, definition.actionType, action.id, detail.template.id);
  return saveEdit(db, detail.template.id, true).actions.find((item) => item.id === action.id)!;
}

export function reorderWorkflowActions(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'stageId', 'actionIds']);
  const detail = editableTemplate(db, values);
  const stage = ownedStage(detail, values.stageId);
  const current = detail.actions.filter((action) => action.stageId === stage.id).map((action) => action.id);
  const ids = validateOrder(values.actionIds, current);
  const changed = ids.some((id, index) => id !== current[index]);
  if (changed) reorderActions(db, detail.template.id, stage.id, ids);
  return saveEdit(db, detail.template.id, changed).template;
}

export function removeWorkflowAction(db: DatabaseSync, input: unknown): WorkflowTemplate {
  const values = exactInput(input, ['templateId', 'expectedVersion', 'actionId']);
  const detail = editableTemplate(db, values);
  const action = ownedAction(detail, values.actionId);
  db.prepare('DELETE FROM workflow_template_actions WHERE id = ? AND template_id = ?').run(action.id, detail.template.id);
  compactActionPositions(db, detail.template.id, action.stageId);
  return saveEdit(db, detail.template.id, true).template;
}
