import { DatabaseSync } from 'node:sqlite';
import type { ActionType, WorkflowAction, WorkflowDetail, WorkflowStage, WorkflowTemplate } from '../../shared/contracts';
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
