import { createHash } from 'node:crypto';
import type {
  BlueprintPreviewSnapshot, PreviewDiagnostic, PreviewOccurrence, PreviewRecord, PreviewRecordKind,
  PreviewRelationship, PreviewRelation, PreviewSourceRef, PreviewStageAssignment, PreviewWorkflowResolution,
} from '../../shared/blueprint-preview';
import type { ParsedPreviewDocument } from './parser';

const LIMIT_RECORDS = 2_000;
const LIMIT_LINKS = 20_000;
const codepointCompare = (a: string, b: string): number => {
  const left = Array.from(a, c => c.codePointAt(0)!); const right = Array.from(b, c => c.codePointAt(0)!);
  for (let i = 0; i < Math.min(left.length, right.length); i++) if (left[i] !== right[i]) return left[i] - right[i];
  return left.length - right.length;
};
const severityRank = { error: 0, resolution: 1, warning: 2 } as const;
type Severity = keyof typeof severityRank;
type Ctx = { sessionId: string; snapshotId: string; capturedAt: string; releaseWorkflowKeys: readonly { key: string; version: number }[] };

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort(codepointCompare).map(k => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function normalizedBody(body: string): string {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let start = 0, end = lines.length;
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return lines.slice(start, end).join('\n');
}
function graphSemantic(records: readonly PreviewOccurrence[]): string {
  const semantic = records.filter((o): o is Extract<PreviewOccurrence, { state: 'record' }> => o.state === 'record')
    .map(o => {
      const r = o.record as PreviewRecord & Record<string, unknown>;
      const data: Record<string, unknown> = { ...r };
      delete data.documents;
      for (const key of ['features', 'requirements', 'covers_rule_ids', 'capabilities']) {
        if (Array.isArray(data[key])) data[key] = [...new Set(data[key] as string[])].sort(codepointCompare);
      }
      return { record: data, narrative: normalizedBody(o.narrativeMarkdown) };
    }).sort((a, b) => codepointCompare(String(a.record.id), String(b.record.id)));
  return createHash('sha256').update(stable(semantic), 'utf8').digest('hex');
}

export function buildPreviewSnapshot(
  parsed: readonly ParsedPreviewDocument[],
  acquisitionDiagnostics: readonly PreviewDiagnostic[],
  context: Ctx,
): BlueprintPreviewSnapshot {
  const documents = parsed.map(p => p.document);
  const occurrences = parsed.flatMap(p => p.records).slice(0, LIMIT_RECORDS).map((o, order) => ({ ...o, order }));
  const diagnostics: PreviewDiagnostic[] = [...acquisitionDiagnostics, ...parsed.flatMap(p => p.diagnostics)];
  const diagnosticIds = new Set(diagnostics.map(d => d.id));
  const docOrder = new Map(documents.map((d, i) => [d.id, i]));
  const source = (key: string, pointer: string, fallback: PreviewSourceRef): PreviewSourceRef => {
    for (const p of parsed) {
      const ref = p.fields.get(key)?.get(pointer);
      if (ref) return ref;
    }
    return fallback;
  };
  const diag = (code: PreviewDiagnostic['code'], severity: Severity, message: string, keys: string[], field: string | null, at: PreviewSourceRef | null, related: PreviewSourceRef[] = []): string => {
    const sig = stable([code, keys, field, at?.documentId, at?.span.start.byteOffset, related.map(r => [r.documentId, r.span.start.byteOffset])]);
    const id = `diag:${createHash('sha256').update(sig).digest('hex').slice(0, 20)}`;
    if (!diagnosticIds.has(id)) { diagnosticIds.add(id); diagnostics.push({ id, code, severity, message, recordKeys: [...keys], field, source: at, relatedSources: related } as PreviewDiagnostic); }
    return id;
  };
  const byId = new Map<string, Extract<PreviewOccurrence, { state: 'record' }>[]>();
  for (const occurrence of occurrences) if (occurrence.state === 'record') {
    const list = byId.get(occurrence.record.id) ?? [];
    list.push(occurrence); byId.set(occurrence.record.id, list);
  }
  const valid = occurrences.filter((o): o is Extract<PreviewOccurrence, { state: 'record' }> => o.state === 'record');
  const projectOccurrences = valid.filter(o => o.record.kind === 'project');
  const projectId = projectOccurrences.length === 1 ? projectOccurrences[0].record.id : null;
  const projectKey = projectOccurrences.length === 1 ? projectOccurrences[0].key : null;
  if (!projectOccurrences.length) diag('PROJECT_MISSING', 'error', 'No schema-valid project record was found.', [], null, null);
  if (projectOccurrences.length > 1) diag('PROJECT_COUNT', 'error', 'Exactly one project record is required.', projectOccurrences.map(o => o.key), null, projectOccurrences[0].metadataSource, projectOccurrences.map(o => o.metadataSource));

  const occurrenceDiagnostics = new Map<string, string[]>();
  const attach = (keys: readonly string[], id: string) => keys.forEach(key => occurrenceDiagnostics.set(key, [...(occurrenceDiagnostics.get(key) ?? []), id]));
  for (const d of diagnostics) attach(d.recordKeys, d.id);
  const errorKeys = new Set(diagnostics.filter(d => d.severity === 'error').flatMap(d => d.recordKeys));
  const error = (code: PreviewDiagnostic['code'], message: string, keys: string[], field: string | null, at: PreviewSourceRef | null, related: PreviewSourceRef[] = []) => {
    const id = diag(code, 'error', message, keys, field, at, related); attach(keys, id);
    keys.forEach(k => errorKeys.add(k));
    return id;
  };
  if (!projectOccurrences.length) diagnostics.filter(d => d.code === 'PROJECT_MISSING').forEach(d => attach(d.recordKeys, d.id));
  if (projectOccurrences.length > 1) diagnostics.filter(d => d.code === 'PROJECT_COUNT').forEach(d => attach(d.recordKeys, d.id));
  for (const [id, group] of byId) if (group.length > 1) {
    const refs = group.map(o => o.metadataSource);
    error('DUPLICATE_ID', `Record ID “${id}” occurs more than once.`, group.map(o => o.key), '/id', refs[0], refs);
  }
  for (const o of valid) if (o.record.kind !== 'project' && projectId && o.record.project !== projectId) {
    error('PROJECT_OWNER', `Record belongs to “${o.record.project}”, not the unique project “${projectId}”.`, [o.key], '/project', source(o.key, '/project', o.metadataSource), [projectOccurrences[0].metadataSource]);
  }

  type EdgeSpec = { from: Extract<PreviewOccurrence, { state: 'record' }>; targetId: string; expected: PreviewRecordKind; relation: PreviewRelation; pointer: string };
  const specs: EdgeSpec[] = [];
  let linkLimitExceeded = false;
  const add = (o: EdgeSpec['from'], targetId: string | null, expected: PreviewRecordKind, relation: PreviewRelation, ptr: string) => {
    if (!targetId) return;
    if (specs.length >= LIMIT_LINKS) { linkLimitExceeded = true; return; }
    specs.push({ from: o, targetId, expected, relation, pointer: ptr });
  };
  for (const o of valid) {
    const r = o.record;
    if (r.kind === 'component') add(o, r.parent, 'component', 'parent-component', '/parent');
    if (r.kind === 'feature') add(o, r.component, 'component', 'primary-component', '/component');
    if (r.kind === 'requirement' || r.kind === 'scope' || r.kind === 'action' || r.kind === 'decision') {
      r.features.forEach((id, i) => add(o, id, 'feature', r.kind === 'requirement' ? 'applies-to-feature' : r.kind === 'decision' ? 'affects-feature' : 'concerns-feature', `/features/${i}`));
    }
    if (r.kind === 'action' || r.kind === 'decision') r.requirements.forEach((id, i) => add(o, id, 'requirement', r.kind === 'action' ? 'addresses-requirement' : 'affects-requirement', `/requirements/${i}`));
    if (r.kind === 'action') add(o, r.scope, 'scope', 'concerns-scope', '/scope');
    if (r.kind === 'check') r.requirements.forEach((id, i) => add(o, id, 'requirement', 'plans-to-verify', `/requirements/${i}`));
  }
  const duplicateLinks = new Map<string, EdgeSpec[]>();
  for (const e of specs) {
    const key = `${e.from.key}\0${e.relation}\0${e.targetId}`;
    duplicateLinks.set(key, [...(duplicateLinks.get(key) ?? []), e]);
  }
  for (const group of duplicateLinks.values()) if (group.length > 1) {
    const refs = group.map(e => source(e.from.key, e.pointer, e.from.metadataSource));
    error('DUPLICATE_LINK', `The link to “${group[0].targetId}” is repeated.`, [group[0].from.key], group[0].pointer, refs[0], refs);
  }
  const relationships: PreviewRelationship[] = [];
  const edgeCount = Math.min(specs.length, LIMIT_LINKS);
  if (linkLimitExceeded) error('LIMIT_EXCEEDED', 'Relationship limit exceeded; remaining links were not processed.', [], null, null);
  for (const e of specs.slice(0, edgeCount)) {
    const candidates = byId.get(e.targetId) ?? [];
    const correct = candidates.filter(o => o.record.kind === e.expected);
    let status: PreviewRelationship['status'];
    let targets: string[];
    if (!candidates.length) { status = 'missing'; targets = []; }
    else if (candidates.length > 1) { status = 'ambiguous'; targets = candidates.map(o => o.key); }
    else if (!correct.length) { status = 'wrong-kind'; targets = candidates.map(o => o.key); }
    else if (e.from.record.kind !== 'project' && correct[0].record.kind !== 'project' && correct[0].record.project !== (e.from.record as { project?: string }).project) { status = 'wrong-project'; targets = correct.map(o => o.key); }
    else { status = 'resolved'; targets = correct.map(o => o.key); }
    const at = source(e.from.key, e.pointer, e.from.metadataSource);
    relationships.push({ id: `link:${e.from.key}:${e.relation}:${e.pointer}`, fromKey: e.from.key, relation: e.relation, targetId: e.targetId, expectedKind: e.expected, status, targetKeys: targets, source: at });
    if (status !== 'resolved') {
      const related = candidates.map(o => o.metadataSource);
      error(status === 'wrong-project' ? 'PROJECT_OWNER' : 'LINK_TARGET', `Link to “${e.targetId}” is ${status}.`, [e.from.key, ...targets], e.pointer, at, related);
    }
  }

  const relationIndex = new Map<string, PreviewRelationship>();
  for (const e of relationships) { const key = `${e.fromKey}\0${e.relation}`; if (!relationIndex.has(key)) relationIndex.set(key, e); }
  const relation = (fromKey: string, kind: PreviewRelation) => relationIndex.get(`${fromKey}\0${kind}`);
  const compNodes = valid.filter(o => o.record.kind === 'component');
  const componentParent = new Map(compNodes.map(o => [o.key, relation(o.key, 'parent-component')?.status === 'resolved' ? relation(o.key, 'parent-component')?.targetKeys[0] ?? null : null]));
  const invalidStructure = new Set<string>();
  for (const o of compNodes) if ((o.record as Extract<PreviewRecord, { kind: 'component' }>).parent && relation(o.key, 'parent-component')?.status !== 'resolved') invalidStructure.add(o.key);
  const cycles = new Set<string>();
  const visited = new Set<string>();
  for (const node of compNodes) {
    const path: string[] = []; const positions = new Map<string, number>(); let current: string | null = node.key;
    while (current && !visited.has(current) && !positions.has(current)) { positions.set(current, path.length); path.push(current); current = componentParent.get(current) ?? null; }
    if (current && positions.has(current)) path.slice(positions.get(current)!).forEach(k => cycles.add(k));
    path.forEach(k => visited.add(k));
  }
  if (cycles.size) {
    const xs = compNodes.filter(o => cycles.has(o.key));
    error('COMPONENT_CYCLE', 'Component parent links contain a cycle.', xs.map(o => o.key), '/parent', xs[0].metadataSource, xs.map(o => o.metadataSource));
    xs.forEach(o => invalidStructure.add(o.key));
  }
  const depths = new Map<string, number>();
  for (const node of compNodes) {
    const chain: string[] = []; let current: string | null = node.key;
    while (current && !depths.has(current) && !cycles.has(current)) { chain.push(current); current = componentParent.get(current) ?? null; }
    if (current && cycles.has(current)) continue;
    let depth = current ? (depths.get(current) ?? 0) : -1;
    for (let i = chain.length - 1; i >= 0; i--) { depth++; depths.set(chain[i], depth); }
  }
  const tooDeep = compNodes.filter(o => (depths.get(o.key) ?? 0) >= 16);
  for (const o of tooDeep) invalidStructure.add(o.key);
  if (tooDeep.length) {
    error('COMPONENT_CYCLE', 'Component nesting exceeds the maximum depth of 16.', tooDeep.map(o => o.key), '/parent', tooDeep[0].metadataSource, tooDeep.map(o => o.metadataSource));
  }
  // Descendants of a structurally invalid component are also isolated from recursive presentation.
  let changed = true;
  while (changed) { changed = false; for (const [key, parent] of componentParent) if (parent && invalidStructure.has(parent) && !invalidStructure.has(key)) { invalidStructure.add(key); changed = true; } }

  const workflows: PreviewWorkflowResolution[] = [];
  const workflowByKey = new Map<string, PreviewWorkflowResolution>();
  for (const o of valid.filter(x => x.record.kind === 'scope')) {
    const workflow = (o.record as Extract<PreviewRecord, { kind: 'scope' }>).workflow;
    let status: PreviewWorkflowResolution['status'] = 'none';
    let stages: PreviewWorkflowResolution['stages'] = [];
    const ids: string[] = [];
    if (workflow && 'stages' in workflow) { status = 'inline'; stages = workflow.stages; }
    else if (workflow) {
      const known = context.releaseWorkflowKeys.some(w => w.key === workflow.template_key && w.version === workflow.version);
      status = known ? 'incompatible' : 'unresolved';
      const did = diag(known ? 'WORKFLOW_PURPOSE' : 'WORKFLOW_UNRESOLVED', 'resolution', known ? 'The referenced workflow is a release workflow and cannot be used for development work.' : 'The referenced development workflow edition is unavailable.', [o.key], '/workflow', source(o.key, '/workflow', o.metadataSource));
      ids.push(did); attach([o.key], did);
    }
    const resolved = { scopeKey: o.key, status, stages, diagnosticIds: ids } satisfies PreviewWorkflowResolution;
    workflows.push(resolved); workflowByKey.set(o.key, resolved);
  }
  const assignments: PreviewStageAssignment[] = [];
  for (const o of valid.filter(x => x.record.kind === 'action')) {
    const r = o.record as Extract<PreviewRecord, { kind: 'action' }>;
    const scopeEdge = relation(o.key, 'concerns-scope');
    const scopeKey = scopeEdge?.status === 'resolved' ? scopeEdge.targetKeys[0] : null;
    let status: PreviewStageAssignment['status'] = 'unassigned';
    let title: string | null = null;
    if (!r.scope) {
      status = r.stage ? 'invalid' : 'unscoped';
      if (r.stage) error('STAGE_TARGET', 'An unscoped action cannot name a stage.', [o.key], '/stage', source(o.key, '/stage', o.metadataSource));
    }
    else if (!scopeKey) status = 'invalid';
    else {
      const wf = workflowByKey.get(scopeKey)!;
      if (r.stage && wf.status === 'none') {
        status = 'invalid'; error('STAGE_TARGET', 'An action cannot name a stage when its scope has no workflow.', [o.key, scopeKey], '/stage', source(o.key, '/stage', o.metadataSource), [valid.find(x => x.key === scopeKey)!.metadataSource]);
      } else if (r.stage && (wf.status === 'unresolved' || wf.status === 'incompatible')) status = 'unresolved-workflow';
      else if (r.stage && wf.status === 'inline') {
        const stage = wf.stages.find(s => s.key === r.stage);
        if (stage) { status = 'resolved'; title = stage.title; }
        else { status = 'invalid'; error('STAGE_TARGET', `Stage “${r.stage}” is not declared by the action’s scope.`, [o.key, scopeKey], '/stage', source(o.key, '/stage', o.metadataSource), [valid.find(x => x.key === scopeKey)!.metadataSource]); }
      }
    }
    assignments.push({ actionKey: o.key, scopeKey, stageKey: r.stage, stageTitle: title, status });
  }
  const invalidOccurrences = occurrences.filter((o): o is Extract<PreviewOccurrence, { state: 'invalid-record' }> => o.state === 'invalid-record');
  const occurrenceCountExceeded = parsed.reduce((n, p) => n + p.records.length, 0) > LIMIT_RECORDS;
  if (occurrenceCountExceeded) error('LIMIT_EXCEEDED', 'Record limit exceeded; remaining occurrences were not processed.', [], null, null);
  const records = occurrences.map(o => {
    const extra = occurrenceDiagnostics.get(o.key) ?? [];
    const ownErrors = errorKeys.has(o.key);
    const validation = o.state === 'invalid-record' || ownErrors ? 'invalid' as const : extra.length ? 'needs-review' as const : o.validation;
    return o.state === 'record'
      ? { ...o, validation, diagnosticIds: [...new Set([...o.diagnosticIds, ...extra])] }
      : { ...o, diagnosticIds: [...new Set([...o.diagnosticIds, ...extra])] };
  });
  const diagnosticsSorted = diagnostics.map((d, i) => ({ d, i })).sort((a, b) => severityRank[a.d.severity] - severityRank[b.d.severity]
    || (a.d.source ? docOrder.get(a.d.source.documentId) ?? 9999 : 9999) - (b.d.source ? docOrder.get(b.d.source.documentId) ?? 9999 : 9999)
    || (a.d.source?.span.start.byteOffset ?? Number.MAX_SAFE_INTEGER) - (b.d.source?.span.start.byteOffset ?? Number.MAX_SAFE_INTEGER)
    || codepointCompare(a.d.code, b.d.code) || a.i - b.i).map(x => x.d);

  const featureNodes = valid.filter(o => o.record.kind === 'feature');
  const rows: { recordKey: string; depth: number }[] = [];
  const childItems = (parent: string) => [
    ...compNodes.filter(o => componentParent.get(o.key) === parent && !invalidStructure.has(o.key)).map(o => ({ key: o.key, order: o.order, kind: 'component' as const })),
    ...featureNodes.filter(o => relation(o.key, 'primary-component')?.status === 'resolved' && relation(o.key, 'primary-component')?.targetKeys[0] === parent && !invalidStructure.has(o.key)).map(o => ({ key: o.key, order: o.order, kind: 'feature' as const })),
  ].sort((a, b) => a.order - b.order);
  const walk = (key: string, depth: number) => { rows.push({ recordKey: key, depth }); for (const child of childItems(key)) walk(child.key, depth + 1); };
  for (const root of compNodes.filter(o => !componentParent.get(o.key) && !invalidStructure.has(o.key)).sort((a, b) => a.order - b.order)) walk(root.key, 0);
  const unplacedFeatureKeys: string[] = [];
  for (const f of featureNodes.sort((a, b) => a.order - b.order)) {
    const edge = relation(f.key, 'primary-component');
    if (!edge) unplacedFeatureKeys.push(f.key);
    else if (edge.status !== 'resolved' || invalidStructure.has(edge.targetKeys[0])) invalidStructure.add(f.key);
  }
  const hasError = diagnosticsSorted.some(d => d.severity === 'error');
  const hasReview = diagnosticsSorted.some(d => d.severity !== 'error');
  const orderByKey = new Map(occurrences.map(o => [o.key, o.order]));
  return {
    contractVersion: 'v2-preview-1', sessionId: context.sessionId, snapshotId: context.snapshotId, capturedAt: context.capturedAt,
    validation: hasError ? 'invalid' : hasReview ? 'needs-review' : 'valid', projectKey,
    semanticSha256: hasError ? null : graphSemantic(records), documents, records, relationships, workflows, assignments,
    structure: { rows, unplacedFeatureKeys, invalidStructureKeys: [...invalidStructure].sort((a, b) => (orderByKey.get(a) ?? Number.MAX_SAFE_INTEGER) - (orderByKey.get(b) ?? Number.MAX_SAFE_INTEGER)) }, diagnostics: diagnosticsSorted,
    counts: { occurrences: records.length, unparsed: invalidOccurrences.length, errors: diagnosticsSorted.filter(d => d.severity === 'error').length, resolutions: diagnosticsSorted.filter(d => d.severity === 'resolution').length, warnings: diagnosticsSorted.filter(d => d.severity === 'warning').length },
  };
}
