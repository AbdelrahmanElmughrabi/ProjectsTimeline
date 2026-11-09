import { createHash, randomUUID } from 'node:crypto';
import type { BlueprintPreviewSnapshot, PreviewRecordKind } from '../../shared/blueprint-preview';
import type { KnowledgeCounts, PreparedFormation } from '../../shared/knowledge';
import { AppError, requiredText } from '../domain';
import { parsePreviewDocument } from './parser';
import { buildPreviewSnapshot } from './graph';

export const knowledgeKinds: readonly PreviewRecordKind[] = ['project', 'component', 'feature', 'requirement', 'scope', 'action', 'decision', 'check'];
export function emptyKnowledgeCounts(): KnowledgeCounts {
  return Object.fromEntries(knowledgeKinds.map(kind => [kind, 0])) as KnowledgeCounts;
}

export function formationDigest(snapshot: BlueprintPreviewSnapshot, plan: Pick<PreparedFormation, 'operationId' | 'externalProjectId' | 'projectName'>): string {
  return createHash('sha256').update(JSON.stringify([
    'v3a1a-1', 'v2-preview-1', plan.operationId, snapshot.snapshotId, snapshot.semanticSha256,
    snapshot.documents.map(d => [d.id, d.relativePath, d.sha256, d.byteLength]),
    ['ptb', plan.externalProjectId], plan.projectName, ['new-project', 4, 'binding-absent'],
    ['all-definitions-proposed', 'no-commitments', 'no-activation', 'no-release'],
  ])).digest('hex');
}

export function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

function storageText(value: unknown): void {
  if (typeof value === 'string' && Buffer.from(value, 'utf8').toString('utf8') !== value) {
    throw new AppError('VALIDATION', 'A decoded blueprint value cannot be saved losslessly as UTF-8. Inspect the captured source and correct the invalid Unicode escape.');
  }
  if (Array.isArray(value)) value.forEach(storageText);
  else if (value && typeof value === 'object') Object.values(value).forEach(storageText);
}

// Revalidate captured bytes, never reread live files or accept a renderer graph.
export async function prepareFormation(snapshot: BlueprintPreviewSnapshot, name: unknown): Promise<{ snapshot: BlueprintPreviewSnapshot; prepared: PreparedFormation }> {
  const projectName = requiredText(name, 'Project name', 120);
  if (projectName.includes('\0')) throw new AppError('VALIDATION', 'Project name cannot contain NUL.');
  storageText(projectName);
  if (snapshot.contractVersion !== 'v2-preview-1' || snapshot.validation === 'invalid' || !snapshot.projectKey || !snapshot.semanticSha256 || snapshot.counts.errors || snapshot.counts.unparsed) {
    throw new AppError('VALIDATION', 'Resolve blocking blueprint errors before creating a knowledge project. The captured source remains available for inspection.');
  }
  if (!snapshot.documents.length || snapshot.documents.length > 50 || snapshot.records.length > 2000 || snapshot.relationships.length > 20000) throw new AppError('VALIDATION', 'Blueprint exceeds formation limits.');
  let total = 0;
  for (const d of snapshot.documents) {
    if (d.status !== 'captured' || d.text === null || d.sha256 === null || d.byteLength === null) throw new AppError('VALIDATION', 'Every declared source document must be captured before formation.');
    const bytes = Buffer.from(d.text, 'utf8');
    total += bytes.length;
    if (bytes.length > 1048576 || bytes.length !== d.byteLength || createHash('sha256').update(bytes).digest('hex') !== d.sha256) throw new AppError('VALIDATION', 'Captured source bytes do not match their recorded hash. Refresh and review the blueprint again.');
  }
  if (total > 10 * 1048576) throw new AppError('VALIDATION', 'Blueprint exceeds the total source limit.');
  const releaseWorkflowKeys = snapshot.workflows.filter(w => w.status === 'incompatible').flatMap(w => {
    const occurrence = snapshot.records.find(o => o.key === w.scopeKey);
    if (occurrence?.state !== 'record' || occurrence.record.kind !== 'scope' || !occurrence.record.workflow || !('template_key' in occurrence.record.workflow)) return [];
    return [{ key: occurrence.record.workflow.template_key, version: occurrence.record.workflow.version }];
  });
  const parsed = await Promise.all(snapshot.documents.map(d => parsePreviewDocument(d)));
  const rebuilt = buildPreviewSnapshot(parsed, [], { sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, capturedAt: snapshot.capturedAt, releaseWorkflowKeys });
  if (JSON.stringify(rebuilt) !== JSON.stringify(snapshot)) throw new AppError('VALIDATION', 'The captured blueprint is inconsistent. Refresh and review it before creating a project.');
  const counts = emptyKnowledgeCounts();
  for (const occurrence of rebuilt.records) {
    if (occurrence.state !== 'record') throw new AppError('VALIDATION', 'Invalid records cannot be formed.');
    storageText(occurrence.record);
    if (occurrence.record.title.includes('\0') || (occurrence.record.kind === 'scope' && occurrence.record.workflow && 'stages' in occurrence.record.workflow && occurrence.record.workflow.stages.some(s => s.title.includes('\0')))) {
      throw new AppError('VALIDATION', `The label for ${occurrence.record.id} contains NUL and cannot be saved. Inspect its source.`);
    }
    (counts as Record<PreviewRecordKind, number>)[occurrence.record.kind]++;
  }
  const root = rebuilt.records.find(o => o.key === rebuilt.projectKey);
  if (root?.state !== 'record' || root.record.kind !== 'project') throw new AppError('VALIDATION', 'A unique project definition is required.');
  const prepared: PreparedFormation = {
    kind: 'prepared', operationId: randomUUID(), reviewDigest: '', policyVersion: 'v3a1a-1',
    snapshotId: rebuilt.snapshotId, capturedAt: rebuilt.capturedAt, projectName, externalProjectId: root.record.id,
    documents: rebuilt.documents.map(d => ({ documentKey: d.id, relativePath: d.relativePath, sha256: d.sha256!, byteLength: d.byteLength! })),
    counts, relationshipCount: rebuilt.relationships.length, diagnostics: rebuilt.diagnostics,
  };
  prepared.reviewDigest = formationDigest(rebuilt, prepared);
  return freeze({ snapshot: rebuilt, prepared });
}

export function operationKey(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) throw new AppError('VALIDATION', 'Expected a valid formation operation ID.');
  return value;
}
export function reviewHash(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) throw new AppError('VALIDATION', 'Expected a valid review digest.');
  return value;
}
