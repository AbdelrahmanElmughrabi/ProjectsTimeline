import { createHash } from 'node:crypto';
import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import type { BlueprintPreviewSnapshot, PreviewDiagnostic, PreviewDocument, PreviewRecordKind, PreviewSourceRef } from '../../shared/blueprint-preview';
import type { FormationPreparation, FormationReceipt, KnowledgeCounts, KnowledgeLink, KnowledgeNode, KnowledgeRecord, KnowledgeSource, KnowledgeWorkspace, PreparedFormation } from '../../shared/knowledge';
import type { ActionType } from '../../shared/contracts';
import { AppError, payload, positiveId, requiredText } from '../domain';
import { emptyKnowledgeCounts, formationDigest, operationKey, reviewHash } from '../blueprint/formation';

type Row = Record<string, SQLOutputValue>;
const json = <T>(value: SQLOutputValue): T => JSON.parse(value as string) as T;
const text = (row: Row, key: string): string => row[key] as string;
const number = (row: Row, key: string): number => row[key] as number;

function project(db: DatabaseSync, id: number): void {
  if (!db.prepare('SELECT id FROM projects WHERE id=?').get(id)) throw new AppError('NOT_FOUND', 'Project was not found.');
}
function supportedImport(db: DatabaseSync, projectId: number, importId: string): Row {
  const row = db.prepare(`SELECT i.*, s.adapter_key FROM knowledge_imports i
    JOIN knowledge_source_bindings s ON s.id=i.source_binding_id WHERE i.id=? AND i.project_id=?`).get(importId, projectId);
  if (!row) throw new AppError('NOT_FOUND', 'Captured import was not found in this project.');
  if (row.adapter_key !== 'ptb' || row.parser_contract !== 'v2-preview-1' || row.format_version !== '0.2' || row.formation_policy !== 'v3a1a-1' || row.semantic_sha256 === null) {
    throw new AppError('VALIDATION', 'This captured format or formation policy is not supported by this application.');
  }
  return row;
}
function importCounts(db: DatabaseSync, importId: string): KnowledgeCounts {
  const counts = emptyKnowledgeCounts() as Record<PreviewRecordKind, number>;
  for (const row of db.prepare('SELECT kind, COUNT(*) n FROM knowledge_definitions WHERE origin_import_id=? AND revision=1 GROUP BY kind').all(importId)) counts[row.kind as PreviewRecordKind] = row.n as number;
  return counts;
}
export function receipt(db: DatabaseSync, operationId: string, digest?: string): FormationReceipt | null {
  const row = db.prepare('SELECT * FROM knowledge_imports WHERE id=?').get(operationId);
  if (!row) return null;
  if (digest !== undefined && row.review_digest !== digest) throw new AppError('VALIDATION', 'This operation ID belongs to a different reviewed formation.');
  supportedImport(db, number(row, 'project_id'), operationId);
  const root = db.prepare("SELECT id FROM knowledge_entities WHERE project_id=? AND kind='project'").get(row.project_id);
  if (!root) throw new AppError('STORAGE', 'The saved knowledge project is incomplete.');
  return {
    operationId, importId: operationId, sourceBindingId: number(row, 'source_binding_id'), reviewDigest: text(row, 'review_digest'),
    project: { id: number(row, 'project_id'), name: text(row, 'chosen_project_name'), createdAt: text(row, 'applied_at') },
    rootEntityId: number(root, 'id'), appliedAt: text(row, 'applied_at'), counts: importCounts(db, operationId),
    relationshipCount: (db.prepare('SELECT COUNT(*) n FROM knowledge_relationships WHERE origin_import_id=? AND from_revision=1').get(operationId)!.n as number),
  };
}
export function existingFormation(db: DatabaseSync, snapshot: BlueprintPreviewSnapshot): Extract<FormationPreparation, { kind: 'existing' }> | null {
  const root = snapshot.records.find(o => o.key === snapshot.projectKey);
  if (root?.state !== 'record' || root.record.kind !== 'project') return null;
  const binding = db.prepare("SELECT * FROM knowledge_source_bindings WHERE adapter_key='ptb' AND native_root_key=?").get(root.record.id);
  if (!binding) return null;
  const saved = receipt(db, text(binding, 'initial_import_id'))!;
  const docs = db.prepare('SELECT document_key,relative_path,sha256,byte_length FROM knowledge_documents WHERE import_id=? ORDER BY presentation_order').all(saved.importId);
  const tuples = docs.map(d => [d.document_key, d.relative_path, d.sha256, d.byte_length]);
  const incoming = snapshot.documents.map(d => [d.id, d.relativePath, d.sha256, d.byteLength]);
  const currentProject = db.prepare('SELECT id,name,created_at AS createdAt FROM projects WHERE id=?').get(saved.project.id)!;
  return { kind: 'existing', project: currentProject as unknown as FormationReceipt['project'], receipt: saved, captureComparison: JSON.stringify(tuples) === JSON.stringify(incoming) ? 'same' : 'different' };
}

// Caller owns BEGIN IMMEDIATE. No ordinary action, release or workflow writes here.
export function formKnowledge(db: DatabaseSync, snapshot: BlueprintPreviewSnapshot, plan: PreparedFormation): { receipt: FormationReceipt; replayed: boolean } {
  operationKey(plan.operationId); reviewHash(plan.reviewDigest);
  const known = receipt(db, plan.operationId, plan.reviewDigest);
  if (known) return { receipt: known, replayed: true };
  if (plan.snapshotId !== snapshot.snapshotId || plan.policyVersion !== 'v3a1a-1' || formationDigest(snapshot, plan) !== plan.reviewDigest || snapshot.validation === 'invalid') throw new AppError('VALIDATION', 'The reviewed formation no longer matches its capture. Prepare it again.');
  if (existingFormation(db, snapshot)) throw new AppError('VALIDATION', 'This PTB project ID is already bound. Open the existing project instead.');
  const now = new Date().toISOString();
  const projectId = Number(db.prepare('INSERT INTO projects(name,created_at) VALUES (?,?)').run(plan.projectName, now).lastInsertRowid);
  const sourceId = Number(db.prepare('INSERT INTO knowledge_source_bindings(project_id,adapter_key,native_root_key,initial_import_id) VALUES (?,?,?,?)').run(projectId, 'ptb', plan.externalProjectId, plan.operationId).lastInsertRowid);
  db.prepare(`INSERT INTO knowledge_imports(id,project_id,source_binding_id,snapshot_id,parser_contract,format_version,formation_policy,
    semantic_sha256,review_digest,chosen_project_name,captured_at,applied_at,capture_validation,diagnostics_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(plan.operationId, projectId, sourceId, snapshot.snapshotId, 'v2-preview-1', '0.2', 'v3a1a-1', snapshot.semanticSha256, plan.reviewDigest, plan.projectName, snapshot.capturedAt, now, snapshot.validation, JSON.stringify(snapshot.diagnostics));
  const putDoc = db.prepare(`INSERT INTO knowledge_documents(import_id,document_key,project_id,relative_path,presentation_order,source_utf8,byte_length,utf16_length,sha256,headings_json) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const d of snapshot.documents) {
    if (d.status !== 'captured' || d.text === null) throw new AppError('VALIDATION', 'All source documents must be captured.');
    const bytes = Buffer.from(d.text, 'utf8');
    if (bytes.length !== d.byteLength || createHash('sha256').update(bytes).digest('hex') !== d.sha256) throw new AppError('VALIDATION', 'Captured source hash does not match.');
    putDoc.run(plan.operationId, d.id, projectId, d.relativePath, d.order, bytes, bytes.length, d.text.length, d.sha256, JSON.stringify(d.headings));
  }
  const ids = new Map<string, number>();
  const kinds = new Map<string, PreviewRecordKind>();
  for (const o of snapshot.records) {
    if (o.state !== 'record') throw new AppError('VALIDATION', 'Invalid definitions cannot be saved.');
    const id = Number(db.prepare('INSERT INTO knowledge_entities(project_id,kind,created_at) VALUES (?,?,?)').run(projectId, o.record.kind, now).lastInsertRowid);
    ids.set(o.key, id);
    kinds.set(o.key, o.record.kind);
  }
  const putDefinition = db.prepare(`INSERT INTO knowledge_definitions(entity_id,revision,project_id,kind,title,narrative_markdown,source_native_id,origin_import_id,origin_document_key,origin_occurrence_key,presentation_order,metadata_ref_json,narrative_ref_json,created_at) VALUES (?,1,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const o of snapshot.records) {
    if (o.state !== 'record') continue;
    const r = o.record, id = ids.get(o.key)!;
    putDefinition.run(id, projectId, r.kind, r.title, o.narrativeMarkdown, r.id, plan.operationId, o.metadataSource.documentId, o.key, o.order, JSON.stringify(o.metadataSource), JSON.stringify(o.narrativeSource), now);
    if (r.kind === 'project') db.prepare('INSERT INTO knowledge_project_details VALUES (?,1,?,?,?,?,?)').run(id, projectId, r.kind, r.goal, JSON.stringify(r.documents), JSON.stringify(r.capabilities));
    if (r.kind === 'requirement') db.prepare('INSERT INTO knowledge_requirement_details VALUES (?,1,?,?,?,?)').run(id, projectId, r.kind, r.type, JSON.stringify(r.acceptance));
    if (r.kind === 'scope') {
      const w = r.workflow, mode = w === null ? 'none' : 'stages' in w ? 'inline' : 'reference';
      const status = snapshot.workflows.find(w => w.scopeKey === o.key)!.status;
      db.prepare('INSERT INTO knowledge_scope_plans VALUES (?,1,?,?,?,?,?,?)').run(id, projectId, r.kind, mode, status, w && 'template_key' in w ? w.template_key : null, w && 'version' in w ? w.version : null);
      if (w && 'stages' in w) w.stages.forEach((s, position) => db.prepare('INSERT INTO knowledge_stage_definitions VALUES (?,1,?,?,?,?,?)').run(id, projectId, 'scope', s.key, s.title, position));
    }
  }
  const putLink = db.prepare(`INSERT INTO knowledge_relationships(project_id,from_entity_id,from_revision,from_kind,to_entity_id,to_kind,relation,origin_import_id,origin_document_key,source_ref_json) VALUES (?,?,1,?,?,?,?,?,?,?)`);
  for (const l of snapshot.relationships) {
    if (l.status !== 'resolved' || l.targetKeys.length !== 1) throw new AppError('VALIDATION', 'Every native relationship must have one resolved target.');
    const kind = kinds.get(l.fromKey);
    if (!kind) throw new AppError('VALIDATION', 'Relationship source is invalid.');
    putLink.run(projectId, ids.get(l.fromKey)!, kind, ids.get(l.targetKeys[0])!, l.expectedKind, l.relation, plan.operationId, l.source.documentId, JSON.stringify(l.source));
  }
  for (const o of snapshot.records) {
    if (o.state !== 'record') continue;
    const r = o.record, id = ids.get(o.key)!;
    if (r.kind === 'action') db.prepare('INSERT INTO knowledge_action_details VALUES (?,1,?,?,?,?,?,?,?,?,?)').run(id, projectId, r.kind, r.action_type, r.instructions, r.applicability, r.definition_of_done, r.evidence_guidance, JSON.stringify(r.covers_rule_ids), r.stage);
    if (r.kind === 'decision') db.prepare('INSERT INTO knowledge_decision_details VALUES (?,1,?,?,?,?)').run(id, projectId, r.kind, r.rationale, JSON.stringify(r.alternatives));
    if (r.kind === 'check') db.prepare('INSERT INTO knowledge_check_details VALUES (?,1,?,?,?,?,?)').run(id, projectId, r.kind, r.method, r.instructions, JSON.stringify(r.expected));
  }
  const saved = receipt(db, plan.operationId)!;
  if (JSON.stringify(saved.counts) !== JSON.stringify(plan.counts) || saved.relationshipCount !== plan.relationshipCount || ids.size !== snapshot.records.length) throw new AppError('STORAGE', 'The saved graph does not match the reviewed counts.');
  for (const [kind, table] of Object.entries(detailTables)) {
    const n = db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE project_id=? AND revision=1`).get(projectId)!.n;
    if (n !== plan.counts[kind as PreviewRecordKind]) throw new AppError('STORAGE', 'A typed definition payload is missing.');
  }
  if (db.prepare('SELECT id FROM actions WHERE project_id=?').get(projectId) || db.prepare('PRAGMA foreign_key_check').get()) throw new AppError('STORAGE', 'Formation violated project isolation.');
  db.prepare('INSERT INTO action_events(project_id,release_id,action_id,description,before_value,after_value,created_at) VALUES (?,NULL,NULL,?,NULL,?,?)')
    .run(projectId, 'Created knowledge project from reviewed blueprint', JSON.stringify({ importId: plan.operationId, counts: saved.counts, relationshipCount: saved.relationshipCount }), now);
  return { receipt: saved, replayed: false };
}

const detailTables: Partial<Record<PreviewRecordKind, string>> = {
  project: 'knowledge_project_details', requirement: 'knowledge_requirement_details', scope: 'knowledge_scope_plans',
  action: 'knowledge_action_details', decision: 'knowledge_decision_details', check: 'knowledge_check_details',
};
const nodeColumns = `e.id AS entityId,e.project_id AS projectId,e.kind,d.revision,d.title,d.source_native_id AS externalId,d.presentation_order AS presentationOrder,
 d.origin_import_id AS importId,d.origin_occurrence_key AS occurrenceKey,i.source_binding_id AS sourceBindingId`;
const nodeJoin = `FROM knowledge_entities e JOIN knowledge_definitions d ON d.entity_id=e.id
 JOIN knowledge_imports i ON i.id=d.origin_import_id`;
function node(row: Row): KnowledgeNode {
  return { entityId: number(row, 'entityId'), externalId: text(row, 'externalId'), kind: row.kind as PreviewRecordKind,
    revision: number(row, 'revision'), title: text(row, 'title'), presentationOrder: number(row, 'presentationOrder'),
    origin: { sourceBindingId: number(row, 'sourceBindingId'), importId: text(row, 'importId'), occurrenceKey: text(row, 'occurrenceKey') } };
}
function links(db: DatabaseSync, projectId: number): KnowledgeLink[] {
  return db.prepare(`SELECT l.id AS relationshipId,l.from_entity_id AS fromEntityId,l.from_revision AS fromRevision,l.to_entity_id AS toEntityId,l.relation
    FROM knowledge_relationships l WHERE l.project_id=? AND l.from_revision=(SELECT MAX(revision) FROM knowledge_definitions WHERE entity_id=l.from_entity_id) ORDER BY l.id`).all(projectId) as unknown as KnowledgeLink[];
}
export function homeKnowledge(db: DatabaseSync): Map<number, { rootEntityId: number; goal: string; counts: KnowledgeCounts }> {
  const map = new Map<number, { rootEntityId: number; goal: string; counts: KnowledgeCounts }>();
  for (const row of db.prepare(`SELECT e.project_id,e.id,p.goal FROM knowledge_entities e JOIN knowledge_project_details p ON p.entity_id=e.id
    WHERE e.kind='project' AND p.revision=(SELECT MAX(revision) FROM knowledge_definitions WHERE entity_id=e.id)`).all()) map.set(number(row, 'project_id'), { rootEntityId: number(row, 'id'), goal: text(row, 'goal'), counts: emptyKnowledgeCounts() });
  for (const row of db.prepare('SELECT project_id,kind,COUNT(*) n FROM knowledge_entities GROUP BY project_id,kind').all()) {
    const summary = map.get(number(row, 'project_id'));
    if (summary) (summary.counts as Record<PreviewRecordKind, number>)[row.kind as PreviewRecordKind] = number(row, 'n');
  }
  return map;
}
export function openKnowledgeWorkspace(db: DatabaseSync, input: unknown): KnowledgeWorkspace | null {
  const { projectId: value } = payload(input, ['projectId']); const projectId = positiveId(value); project(db, projectId);
  const root = db.prepare(`${'SELECT ' + nodeColumns} ${nodeJoin} WHERE e.project_id=? AND e.kind='project' AND d.revision=(SELECT MAX(revision) FROM knowledge_definitions WHERE entity_id=e.id)`).get(projectId);
  if (!root) return null;
  const saved = receipt(db, text(root, 'importId'))!;
  const header = supportedImport(db, projectId, saved.importId);
  const nodes = db.prepare(`SELECT ${nodeColumns} ${nodeJoin} WHERE e.project_id=? AND d.revision=(SELECT MAX(revision) FROM knowledge_definitions WHERE entity_id=e.id) ORDER BY d.presentation_order,e.id`).all(projectId).map(node);
  const docs = db.prepare('SELECT import_id AS importId,document_key AS documentKey,relative_path AS relativePath,sha256,byte_length AS byteLength FROM knowledge_documents WHERE project_id=? ORDER BY import_id,presentation_order').all(projectId);
  return {
    project: db.prepare('SELECT id,name,created_at AS createdAt FROM projects WHERE id=?').get(projectId) as unknown as FormationReceipt['project'],
    rootEntityId: number(root, 'entityId'), goal: db.prepare('SELECT goal FROM knowledge_project_details WHERE entity_id=? AND revision=?').get(root.entityId, root.revision)!.goal as string,
    counts: saved.counts, receipt: saved, nodes, links: links(db, projectId), documents: docs as unknown as KnowledgeWorkspace['documents'],
    review: { importId: saved.importId, diagnostics: json(header.diagnostics_json), needsReviewScopeEntityIds: db.prepare("SELECT entity_id FROM knowledge_scope_plans WHERE project_id=? AND workflow_mode='reference'").all(projectId).map(r => number(r, 'entity_id')) },
  };
}
export function getKnowledgeRecord(db: DatabaseSync, input: unknown): KnowledgeRecord {
  const values = payload(input, ['projectId', 'entityId', 'revision']);
  const projectId = positiveId(values.projectId), entityId = positiveId(values.entityId);
  const revision = values.revision === undefined ? null : positiveId(values.revision);
  const row = db.prepare(`SELECT ${nodeColumns},d.narrative_markdown,d.metadata_ref_json,d.narrative_ref_json,d.origin_document_key
    ${nodeJoin} WHERE e.id=? AND e.project_id=? AND d.revision=COALESCE(?,(SELECT MAX(revision) FROM knowledge_definitions WHERE entity_id=e.id))`).get(entityId, projectId, revision);
  if (!row) throw new AppError('NOT_FOUND', 'Knowledge definition was not found in this project.');
  supportedImport(db, projectId, text(row, 'importId'));
  const base = { ...node(row), projectId, narrativeMarkdown: text(row, 'narrative_markdown'),
    metadata: { importId: text(row, 'importId'), documentKey: text(row, 'origin_document_key'), source: json<PreviewSourceRef>(row.metadata_ref_json) },
    narrative: { importId: text(row, 'importId'), documentKey: text(row, 'origin_document_key'), source: json<PreviewSourceRef>(row.narrative_ref_json) },
    relationships: links(db, projectId).filter(l => l.fromEntityId === entityId || l.toEntityId === entityId) };
  const kind = row.kind as PreviewRecordKind;
  if (kind === 'component' || kind === 'feature') return { ...base, kind };
  const detail = db.prepare(`SELECT * FROM ${detailTables[kind]} WHERE entity_id=? AND revision=?`).get(entityId, row.revision);
  if (!detail) throw new AppError('STORAGE', 'The knowledge definition payload is missing.');
  switch (kind) {
    case 'project': return { ...base, kind, goal: text(detail, 'goal'), documents: json(detail.documents_json), capabilities: json(detail.capabilities_json) };
    case 'requirement': return { ...base, kind, state: 'draft', requirementType: detail.requirement_type as 'functional' | 'quality' | 'constraint', acceptance: json(detail.acceptance_json) };
    case 'scope': return { ...base, kind, state: 'draft', workflowStatus: detail.workflow_status as 'none' | 'inline' | 'unresolved' | 'incompatible', workflow: detail.workflow_mode === 'none' ? null : detail.workflow_mode === 'inline' ? { stages: db.prepare('SELECT stage_key AS key,title FROM knowledge_stage_definitions WHERE scope_entity_id=? AND scope_revision=? ORDER BY position').all(entityId, row.revision) as unknown as { key: string; title: string }[] } : { template_key: text(detail, 'template_key'), version: number(detail, 'template_version') } };
    case 'action': return { ...base, kind, state: 'proposed', proposedStageKey: detail.proposed_stage_key as string | null, coversRuleIds: json(detail.covers_rule_ids_json), details: { title: base.title, instructions: text(detail, 'instructions'), applicability: text(detail, 'applicability'), definitionOfDone: text(detail, 'definition_of_done'), evidenceGuidance: text(detail, 'evidence_guidance'), actionType: detail.action_type as ActionType } };
    case 'decision': return { ...base, kind, state: 'proposed', rationale: text(detail, 'rationale'), alternatives: json(detail.alternatives_json) };
    case 'check': return { ...base, kind, state: 'not-run', method: detail.method as 'manual' | 'automated' | null, instructions: text(detail, 'instructions'), expected: json(detail.expected_json) };
  }
}
export function getKnowledgeSource(db: DatabaseSync, input: unknown): KnowledgeSource {
  const values = payload(input, ['projectId', 'target']); const projectId = positiveId(values.projectId);
  const raw = payload(values.target, ['kind', 'entityId', 'revision', 'part', 'relationshipId', 'importId', 'documentKey', 'diagnosticId', 'relatedIndex']);
  let importId: string, documentKey: string, selection: PreviewSourceRef | null = null;
  switch (raw.kind) {
    case 'record': {
      const target = payload(values.target, ['kind', 'entityId', 'revision', 'part']);
      if (target.part !== 'metadata' && target.part !== 'narrative') throw new AppError('VALIDATION', 'Expected a definition or narrative source target.');
      const record = getKnowledgeRecord(db, { projectId, entityId: target.entityId, revision: positiveId(target.revision) });
      const anchor = record[target.part]; importId = anchor.importId; documentKey = anchor.documentKey; selection = anchor.source; break;
    }
    case 'relationship': {
      const target = payload(values.target, ['kind', 'relationshipId']);
      const edge = db.prepare('SELECT * FROM knowledge_relationships WHERE id=? AND project_id=?').get(positiveId(target.relationshipId), projectId);
      if (!edge) throw new AppError('NOT_FOUND', 'Relationship source was not found in this project.');
      importId = text(edge, 'origin_import_id'); documentKey = text(edge, 'origin_document_key'); selection = json(edge.source_ref_json); break;
    }
    case 'diagnostic': {
      const target = payload(values.target, ['kind', 'importId', 'diagnosticId', 'relatedIndex']); importId = operationKey(target.importId);
      const header = supportedImport(db, projectId, importId);
      const diagnostic = json<PreviewDiagnostic[]>(header.diagnostics_json).find(d => d.id === requiredText(target.diagnosticId, 'Diagnostic ID', 256));
      if (!diagnostic) throw new AppError('NOT_FOUND', 'Diagnostic was not found.');
      if (target.relatedIndex !== undefined && (typeof target.relatedIndex !== 'number' || !Number.isSafeInteger(target.relatedIndex) || target.relatedIndex < 0 || target.relatedIndex >= diagnostic.relatedSources.length)) throw new AppError('VALIDATION', 'Related source index is invalid.');
      selection = target.relatedIndex === undefined ? diagnostic.source : diagnostic.relatedSources[target.relatedIndex as number];
      if (!selection) throw new AppError('VALIDATION', 'This package-level diagnostic has no captured document source.');
      documentKey = selection.documentId; break;
    }
    case 'document': {
      const target = payload(values.target, ['kind', 'importId', 'documentKey']); importId = operationKey(target.importId); documentKey = requiredText(target.documentKey, 'Document key', 128); break;
    }
    default: throw new AppError('VALIDATION', 'Expected a known stored-source target.');
  }
  supportedImport(db, projectId, importId);
  const row = db.prepare('SELECT * FROM knowledge_documents WHERE import_id=? AND document_key=? AND project_id=?').get(importId, documentKey, projectId);
  if (!row) throw new AppError('NOT_FOUND', 'Captured document was not found in this project.');
  const bytes = Buffer.from(row.source_utf8 as Uint8Array);
  if (createHash('sha256').update(bytes).digest('hex') !== row.sha256 || bytes.length !== row.byte_length) throw new AppError('STORAGE', 'Stored source failed its integrity check.');
  const content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  if (content.length !== row.utf16_length) throw new AppError('STORAGE', 'Stored source length is inconsistent.');
  if (selection) {
    const { start, end } = selection.span;
    if (selection.documentId !== documentKey || start.utf16Offset < 0 || end.utf16Offset < start.utf16Offset || end.utf16Offset > content.length ||
      Buffer.byteLength(content.slice(0, start.utf16Offset), 'utf8') !== start.byteOffset || Buffer.byteLength(content.slice(0, end.utf16Offset), 'utf8') !== end.byteOffset) throw new AppError('STORAGE', 'Stored source coordinates failed their integrity check.');
  }
  return { importId, document: { id: documentKey, relativePath: text(row, 'relative_path'), order: number(row, 'presentation_order'), status: 'captured', text: content, sha256: text(row, 'sha256'), byteLength: bytes.length, headings: json<PreviewDocument['headings']>(row.headings_json) }, selection };
}
