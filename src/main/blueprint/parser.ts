import type { PreviewDocument, PreviewDiagnostic, PreviewOccurrence, PreviewRecord, PreviewRecordKind, PreviewSourceRef, PreviewSpan } from '../../shared/blueprint-preview';
import type { ActionType } from '../../shared/contracts';
import { createScanner, parseTree, ScanError, SyntaxKind, visit, type Node, type ParseError } from 'jsonc-parser';

export interface ParsedPreviewDocument {
  document: PreviewDocument;
  records: PreviewOccurrence[];
  diagnostics: PreviewDiagnostic[];
  fields: Map<string, Map<string, PreviewSourceRef>>;
}

const PREFIX: Record<PreviewRecordKind, string> = { project: 'proj', component: 'cmp', feature: 'feat', requirement: 'req', scope: 'scope', action: 'act', decision: 'dec', check: 'check' };
const KINDS = Object.keys(PREFIX) as PreviewRecordKind[];
const COMMON = ['ptb', 'kind', 'id', 'title', 'project'];
const EXTRA: Record<PreviewRecordKind, string[]> = {
  project: ['goal', 'documents', 'capabilities'], component: ['parent'], feature: ['component'], requirement: ['features', 'type', 'acceptance'],
  scope: ['features', 'workflow'], action: ['features', 'requirements', 'scope', 'stage', 'action_type', 'instructions', 'applicability', 'definition_of_done', 'evidence_guidance', 'covers_rule_ids'],
  decision: ['features', 'requirements', 'rationale', 'alternatives'], check: ['requirements', 'method', 'expected', 'instructions'],
};

/** Parse one already-captured Markdown document. This function never reads files or performs graph validation. */
export async function parsePreviewDocument(document: PreviewDocument): Promise<ParsedPreviewDocument> {
  if (document.status !== 'captured' || document.text === null) return { document, records: [], diagnostics: [], fields: new Map() };
  const original = document.text;
  const bom = original.startsWith('\uFEFF') ? 1 : 0;
  const markdown = bom ? original.slice(1) : original;
  const { fromMarkdown } = await import('mdast-util-from-markdown');
  const ast = fromMarkdown(markdown) as any;
  const roots: any[] = ast.children ?? [];
  const headingContexts = buildHeadingContexts(roots);
  const sourceLines = lineOffsets(markdown);
  const blocks = roots.filter((n) => n.type === 'code');
  const infoBlocks = blocks.filter((n) => String(n.lang ?? '').trim() === 'ptb');
  const ptbBlocks = infoBlocks.filter((n) => !String(n.meta ?? '').trim());
  const diagnostics: PreviewDiagnostic[] = [];
  const records: PreviewOccurrence[] = [];
  const fields = new Map<string, Map<string, PreviewSourceRef>>();
  const usedDiagIds = new Set<string>();
  const severities = new Map<string, PreviewDiagnostic['severity']>();
  let diagIndex = 0;
  const sourceIndex = makeSourceIndex(original);
  const point = (offset: number) => sourceIndex.point(offset);
  const ref = (start: number, end: number): PreviewSourceRef => ({ documentId: document.id, span: { start: point(start), end: point(end) }, headingPath: headingPathAt(headingContexts, start - bom) });
  const addDiagnostic = (code: PreviewDiagnostic['code'], severity: PreviewDiagnostic['severity'], message: string, source: PreviewSourceRef | null, field: string | null = null, occurrenceKey?: string) => {
    let id = `${document.id}:d${diagIndex++}`;
    while (usedDiagIds.has(id)) id += '_';
    usedDiagIds.add(id);
    severities.set(id, severity);
    diagnostics.push({ id, code, severity, message, recordKeys: occurrenceKey ? [occurrenceKey] : [], field, source, relatedSources: [] } as PreviewDiagnostic);
    return id;
  };
  for (const block of infoBlocks) if (String(block.meta ?? '').trim()) addDiagnostic('PTB_FENCE_INFO', 'warning', 'Fence info after `ptb` makes this ordinary source, not a PTB record.', ref(bom + block.position.start.offset, bom + block.position.end.offset));
  const headingNodes = roots.filter((n) => n.type === 'heading');
  document = { ...document, headings: headingNodes.map((h: any) => ({ depth: h.depth, text: plainText(h), source: ref(bom + h.position.start.offset, bom + h.position.end.offset) })) };

  for (let index = 0; index < Math.min(ptbBlocks.length, 2000); index++) {
    const block = ptbBlocks[index];
    const key = `${document.id}:b${index}`;
    const start = bom + block.position.start.offset;
    const end = bom + block.position.end.offset;
    const next = ptbBlocks[index + 1];
    const bodyEnd = next ? bom + next.position.start.offset : original.length;
    const raw = rawFenceContent(markdown, block, sourceLines);
    const close = raw.closed;
    const ids: string[] = [];
    const metadataSource = ref(start, end);
    const narrativeSource = ref(end, bodyEnd);
    const narrativeMarkdown = original.slice(end, bodyEnd);
    if (!close) ids.push(addDiagnostic('PTB_FENCE_UNCLOSED', 'error', 'The PTB code fence has no explicit closing fence.', metadataSource, null, key));

    const content = raw.content;
    const contentStart = bom + raw.contentStart;
    const jsonCheck = strictJson(content);
    const localFields = new Map<string, PreviewSourceRef>();
    fields.set(key, localFields);
    const fieldRef = (pointer: string, offset: number, length: number) => localFields.set(pointer, ref(contentStart + offset, contentStart + offset + length));
    let value: any;
    if (jsonCheck.error) {
      const code = jsonCheck.error === 'duplicate' ? 'DUPLICATE_KEY' : 'JSON_SYNTAX';
      const id = addDiagnostic(code, 'error', jsonCheck.message ?? 'Invalid PTB JSON.', ref(contentStart + jsonCheck.offset, contentStart + jsonCheck.offset + Math.max(jsonCheck.length, 1)), null, key);
      ids.push(id);
      if (jsonCheck.relatedOffset !== undefined) {
        const diag = diagnostics.find((item) => item.id === id)!;
        (diag as any).relatedSources = [ref(contentStart + jsonCheck.relatedOffset, contentStart + jsonCheck.relatedOffset + jsonCheck.relatedLength!)];
      }
    } else {
      value = jsonCheck.value;
      const tree = jsonCheck.tree;
      if (tree) collectFieldRefs(tree, [], fieldRef);
    }

    const declaredId = value && typeof value.id === 'string' ? value.id : null;
    const declaredKind = value && typeof value.kind === 'string' ? value.kind : null;
    const invalid = (code: PreviewDiagnostic['code'], message: string, field: string | null = null) => ids.push(addDiagnostic(code, 'error', message, field ? localFields.get(field) ?? metadataSource : metadataSource, field, key));
    let normalized: PreviewRecord | null = null;
    if (value && !jsonCheck.error) normalized = validateRecord(value, (code, msg, field) => { invalid(code, msg, field); });
    if (ids.some(id => severities.get(id) === 'error')) normalized = null;
    if (normalized && !close) normalized = null;
    if (normalized) {
      const known = new Set([...COMMON, ...EXTRA[normalized.kind]]);
      if (normalized.kind === 'project') known.delete('project');
      for (const name of Object.keys(value)) if (!known.has(name)) ids.push(addDiagnostic('UNKNOWN_FIELD', 'warning', `Unknown field “${name}” is retained as inert source.`, localFields.get(`/${escapePointer(name)}`) ?? metadataSource, `/${escapePointer(name)}`, key));
      if (normalized.kind === 'requirement' && normalized.acceptance.length === 0) ids.push(addDiagnostic('ACCEPTANCE_MISSING', 'warning', 'Requirement has no acceptance statements.', localFields.get('/acceptance') ?? metadataSource, '/acceptance', key));
      if (normalized.kind === 'action' && !normalized.definition_of_done.trim()) ids.push(addDiagnostic('DONE_MISSING', 'warning', 'Action has no definition of done.', localFields.get('/definition_of_done') ?? metadataSource, '/definition_of_done', key));
      if (normalized.kind === 'decision' && !normalized.rationale.trim()) ids.push(addDiagnostic('RATIONALE_MISSING', 'warning', 'Decision has no rationale.', localFields.get('/rationale') ?? metadataSource, '/rationale', key));
      if (normalized.kind === 'check' && (!normalized.requirements.length || !normalized.expected.length)) ids.push(addDiagnostic('CHECK_INCOMPLETE', 'warning', 'Check should name requirements and expected results.', metadataSource, null, key));
      if (normalized.kind === 'project') for (let i = 0; i < normalized.capabilities.length; i++) ids.push(addDiagnostic('UNKNOWN_CAPABILITY', 'warning', `Capability “${normalized.capabilities[i]}” is not in the preview registry.`, localFields.get(`/capabilities/${i}`) ?? metadataSource, `/capabilities/${i}`, key));
      if (normalized.kind === 'action') for (let i = 0; i < normalized.covers_rule_ids.length; i++) ids.push(addDiagnostic('UNKNOWN_RULE', 'warning', `Rule “${normalized.covers_rule_ids[i]}” is not in the preview registry.`, localFields.get(`/covers_rule_ids/${i}`) ?? metadataSource, `/covers_rule_ids/${i}`, key));
      records.push({ key, order: records.length, state: 'record', record: normalized, validation: ids.some(id => severities.get(id) === 'error') ? 'invalid' : ids.length ? 'needs-review' : 'valid', metadataSource, narrativeSource, narrativeMarkdown, diagnosticIds: ids });
    } else {
      records.push({ key, order: records.length, state: 'invalid-record', declaredId, declaredKind, metadataSource, narrativeSource, narrativeMarkdown, diagnosticIds: ids });
    }
  }
  if (ptbBlocks.length > 2000) {
    const overflow = ptbBlocks[2000];
    addDiagnostic('LIMIT_EXCEEDED', 'error', 'Document exceeds the 2,000-record preview limit.', overflow ? ref(bom + overflow.position.start.offset, bom + overflow.position.end.offset) : null);
  }
  return { document, records, diagnostics, fields };
}

function strictJson(text: string): { error?: string; message?: string; offset: number; length: number; relatedOffset?: number; relatedLength?: number; value?: any; tree?: Node } {
  const scanner = createScanner(text, false);
  let depth = 0;
  let token: SyntaxKind;
  while ((token = scanner.scan()) !== SyntaxKind.EOF) {
    if (scanner.getTokenError() !== ScanError.None) return { error: 'syntax', message: 'Malformed JSON string or token.', offset: scanner.getTokenOffset(), length: scanner.getTokenLength() };
    if (token === SyntaxKind.OpenBraceToken || token === SyntaxKind.OpenBracketToken) {
      depth++;
      if (depth > 16) return { error: 'syntax', message: 'JSON nesting exceeds the depth limit of 16.', offset: scanner.getTokenOffset(), length: scanner.getTokenLength() };
    } else if (token === SyntaxKind.CloseBraceToken || token === SyntaxKind.CloseBracketToken) depth--;
    else if (token === SyntaxKind.LineCommentTrivia || token === SyntaxKind.BlockCommentTrivia) return { error: 'syntax', message: 'JSON comments are not allowed.', offset: scanner.getTokenOffset(), length: scanner.getTokenLength() };
  }
  const errors: ParseError[] = [];
  const tree = parseTree(text, errors, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  if (errors.length || !tree || tree.type !== 'object') {
    const e = errors[0];
    return { error: 'syntax', message: 'PTB metadata must be one valid JSON object without comments or trailing commas.', offset: e?.offset ?? 0, length: e?.length ?? 1 };
  }
  let duplicate: { name: string; offset: number; length: number; relatedOffset: number; relatedLength: number } | undefined;
  const stacks: Map<string, { offset: number; length: number }>[] = [];
  visit(text, {
    onObjectBegin: () => { stacks.push(new Map()); },
    onObjectEnd: () => { stacks.pop(); },
    onArrayBegin: () => {}, onArrayEnd: () => {},
    onLiteralValue: () => {},
    onObjectProperty: (name, offset, length) => { const properties = stacks[stacks.length - 1]; const first = properties?.get(name); if (first) duplicate ??= { name, offset, length, relatedOffset: first.offset, relatedLength: first.length }; properties?.set(name, { offset, length }); },
  }, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  if (duplicate) return { error: 'duplicate', message: `Duplicate JSON key “${duplicate.name}”.`, offset: duplicate.offset, length: duplicate.length, relatedOffset: duplicate.relatedOffset, relatedLength: duplicate.relatedLength };
  // Parse only after scanner, syntax, depth, and duplicate-key checks. Null-prototype
  // objects keep hostile metadata keys inert while normalizing recognized own fields.
  return { offset: 0, length: 0, value: nullPrototype(JSON.parse(text)), tree };
}

function nullPrototype(value: any): any {
  if (Array.isArray(value)) return value.map(nullPrototype);
  if (value && typeof value === 'object') {
    const result = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value)) result[key] = nullPrototype(value[key]);
    return result;
  }
  return value;
}

function collectFieldRefs(node: Node, path: (string | number)[], save: (pointer: string, offset: number, length: number) => void): void {
  if (node.type === 'object') for (const prop of node.children ?? []) {
    const keyNode = prop.children?.[0]; const val = prop.children?.[1]; if (!keyNode || !val) continue;
    const key = String(keyNode.value ?? ''); const p = [...path, key]; save('/' + p.map((x) => escapePointer(String(x))).join('/'), val.offset, val.length); collectFieldRefs(val, p, save);
  } else if (node.type === 'array') for (let i = 0; i < (node.children ?? []).length; i++) { const child = node.children![i]; const p = [...path, i]; save('/' + p.map((x) => escapePointer(String(x))).join('/'), child.offset, child.length); collectFieldRefs(child, p, save); }
}

function validateRecord(v: any, error: (code: PreviewDiagnostic['code'], msg: string, field: string) => void): PreviewRecord | null {
  const fail = (field: string, msg: string) => { error('FIELD_TYPE', msg, `/${escapePointer(field)}`); return false; };
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  if (v.ptb !== '0.2') { error('FORMAT_VERSION', 'PTB version must be the string “0.2”.', '/ptb'); return null; }
  if (!KINDS.includes(v.kind)) { error('KIND_UNSUPPORTED', 'Record kind is missing or unsupported.', '/kind'); return null; }
  const kind = v.kind as PreviewRecordKind;
  const string = (name: string, required = false, max = 10000): string | undefined => {
    if (v[name] === undefined && !required) return undefined;
    if (typeof v[name] !== 'string' || (required && !v[name].trim()) || v[name].length > max) { fail(name, `${name} must be a ${required ? 'non-empty ' : ''}string of at most ${max} characters.`); return undefined; }
    return v[name];
  };
  const arr = (name: string, maxItems: number, maxLen: number, pattern?: RegExp): string[] | undefined => {
    if (v[name] === undefined) return [];
    if (!Array.isArray(v[name]) || v[name].length > maxItems || v[name].some((x: any) => typeof x !== 'string' || x.length > maxLen || !x.trim() || (pattern && !pattern.test(x)))) { fail(name, `${name} must be an array of at most ${maxItems} valid strings.`); return undefined; }
    return v[name];
  };
  const title = string('title', true, kind === 'project' ? 120 : kind === 'action' ? 300 : 200);
  const id = string('id', true, 128);
  if (id && !new RegExp(`^${PREFIX[kind]}\\.[a-z0-9][a-z0-9-]*(\\.[a-z0-9-]+)*$`).test(id)) error('ID_KIND', 'ID does not match the required lowercase prefix and format for its kind.', '/id');
  const project = kind === 'project' ? undefined : string('project', true, 128);
  if (id && kind !== 'project' && project && !/^proj\.[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*$/.test(project)) error('FIELD_TYPE', 'project must be a project ID.', '/project');
  if (!title || !id || (kind !== 'project' && !project)) return null;
  const scalarLink = (name: string): string | null => { if (v[name] === undefined) return null; const s = string(name, true, 128); if (s && !/^(cmp|feat|req|scope|act|dec|check)\.[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*$/.test(s)) fail(name, `${name} must be a PTB reference ID.`); return s ?? null; };
  const links = (name: string, max = 200) => arr(name, max, 128, /^(cmp|feat|req|scope|act|dec|check)\.[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*$/);
  const strings = (name: string, max = 50, len = 2000) => arr(name, max, len);
  const base: any = { ptb: '0.2', id, title };
  if (kind === 'project') return { ...base, kind, goal: string('goal', false, 2000) ?? '', documents: arr('documents', 49, 240) ?? [], capabilities: arr('capabilities', 100, 128, /^[a-z][a-z0-9._-]*$/) ?? [] };
  const owned = { ...base, project: project! };
  switch (kind) {
    case 'component': return { ...owned, kind, parent: scalarLink('parent') };
    case 'feature': return { ...owned, kind, component: scalarLink('component') };
    case 'requirement': { const type = v.type; if (!['functional', 'quality', 'constraint'].includes(type)) fail('type', 'Requirement type must be functional, quality, or constraint.'); return { ...owned, kind, features: links('features') ?? [], type: ['functional', 'quality', 'constraint'].includes(type) ? type : 'functional', acceptance: strings('acceptance') ?? [] } as PreviewRecord; }
    case 'scope': { let workflow: any = null; if (v.workflow !== undefined) { workflow = v.workflow; if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) { fail('workflow', 'workflow must be an object.'); workflow = null; } else if (Array.isArray(workflow.stages) && Object.keys(workflow).length === 1) { if (!workflow.stages.length || workflow.stages.length > 50) fail('workflow', 'Inline workflow must contain 1 to 50 stages.'); const stages = workflow.stages.map((s: any, i: number) => { if (!s || typeof s !== 'object' || Object.keys(s).length !== 2 || typeof s.key !== 'string' || !/^[a-z][a-z0-9._-]*$/.test(s.key) || s.key.length > 128 || typeof s.title !== 'string' || !s.title.trim() || s.title.length > 200) { error('FIELD_TYPE', `Invalid workflow stage at index ${i}.`, `/workflow/stages/${i}`); return null; } return { key: s.key, title: s.title }; }); if (new Set(stages.filter(Boolean).map((s: any) => s.key)).size !== stages.filter(Boolean).length) fail('workflow', 'Workflow stage keys must be unique.'); workflow = stages.includes(null) ? null : { stages }; } else if (typeof workflow.template_key === 'string' && /^[a-z][a-z0-9._-]*$/.test(workflow.template_key) && workflow.template_key.length <= 128 && Number.isSafeInteger(workflow.version) && workflow.version > 0 && Object.keys(workflow).length === 2) workflow = { template_key: workflow.template_key, version: workflow.version }; else { fail('workflow', 'workflow must be an inline stage plan or a template_key/version reference.'); workflow = null; } } return { ...owned, kind, features: links('features') ?? [], workflow }; }
    case 'action': { const actionTypes: ActionType[] = ['requirement', 'implementation', 'verification', 'decision', 'research', 'documentation']; const actionType = v.action_type === undefined ? 'implementation' : v.action_type; if (!actionTypes.includes(actionType)) fail('action_type', 'Unsupported action_type.'); const scope = scalarLink('scope'); const stage = string('stage', false, 128) ?? null; if (stage !== null && !/^[a-z][a-z0-9._-]*$/.test(stage)) fail('stage', 'stage must be a registry key.'); if (stage && !scope) fail('stage', 'stage requires a scope.'); return { ...owned, kind, features: links('features') ?? [], requirements: links('requirements') ?? [], scope, stage, action_type: actionTypes.includes(actionType) ? actionType : 'implementation', instructions: string('instructions', false, 10000) ?? '', applicability: string('applicability', false, 2000) ?? '', definition_of_done: string('definition_of_done', false, 10000) ?? '', evidence_guidance: string('evidence_guidance', false, 2000) ?? '', covers_rule_ids: arr('covers_rule_ids', 100, 128, /^[a-z][a-z0-9._-]*$/) ?? [] }; }
    case 'decision': return { ...owned, kind, features: links('features') ?? [], requirements: links('requirements') ?? [], rationale: string('rationale', false, 10000) ?? '', alternatives: strings('alternatives') ?? [] };
    case 'check': { const method = v.method === undefined ? null : v.method; if (method !== null && method !== 'manual' && method !== 'automated') fail('method', 'method must be manual or automated.'); if (v.method === null) fail('method', 'method must be omitted, manual, or automated.'); return { ...owned, kind, requirements: links('requirements') ?? [], method: method === 'manual' || method === 'automated' ? method : null, expected: strings('expected') ?? [], instructions: string('instructions', false, 10000) ?? '' }; }
  }
}

function makeSourceIndex(text: string) {
  const bytes = new Uint32Array(text.length + 1); const lines = new Uint32Array(text.length + 1); const columns = new Uint32Array(text.length + 1);
  let byte = 0, line = 1, column = 1;
  for (let i = 0; i < text.length;) {
    bytes[i] = byte; lines[i] = line; columns[i] = column;
    const cp = text.codePointAt(i)!; const units = cp > 0xffff ? 2 : 1; const width = cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
    if (units === 2) { bytes[i + 1] = byte; lines[i + 1] = line; columns[i + 1] = column; }
    byte += width;
    if (cp === 10) { line++; column = 1; } else column++;
    i += units;
  }
  bytes[text.length] = byte; lines[text.length] = line; columns[text.length] = column;
  return { point(offset: number) { const at = Math.max(0, Math.min(offset, text.length)); return { byteOffset: bytes[at], utf16Offset: at, line: lines[at], column: columns[at] }; } };
}
function plainText(n: any): string { if (n.type === 'text' || n.type === 'inlineCode') return n.value; if (n.type === 'break') return ' '; return (n.children ?? []).map(plainText).join(''); }
function buildHeadingContexts(roots: any[]): { offset: number; path: string[] }[] {
  const path: { depth: number; text: string }[] = [];
  const contexts: { offset: number; path: string[] }[] = [];
  for (const node of roots) if (node.type === 'heading') {
    const heading = { depth: node.depth, text: plainText(node) };
    while (path.length && path[path.length - 1].depth >= heading.depth) path.pop();
    path.push(heading);
    contexts.push({ offset: node.position.end.offset, path: path.map((item) => item.text) });
  }
  return contexts;
}
function headingPathAt(contexts: { offset: number; path: string[] }[], offset: number): string[] {
  let low = 0, high = contexts.length;
  while (low < high) { const mid = (low + high) >>> 1; if (contexts[mid].offset <= offset) low = mid + 1; else high = mid; }
  return low ? contexts[low - 1].path : [];
}
function escapePointer(s: string) { return s.replace(/~/g, '~0').replace(/\//g, '~1'); }
function rawFenceContent(markdown: string, block: any, lines: number[]): { content: string; contentStart: number; closed: boolean } {
  const openLine = block.position.start.line - 1;
  const open = markdown.slice(lines[openLine], lineEnd(markdown, lines[openLine]));
  const marker = open.match(/^ {0,3}(`{3,}|~{3,})/);
  if (!marker) return { content: '', contentStart: block.position.start.offset, closed: false };
  const token = marker[1]; const closePattern = new RegExp(`^ {0,3}${token[0]}{${token.length},}[\\t ]*$`);
  const contentStart = lineEnd(markdown, lines[openLine], true);
  const lastLine = Math.min(lines.length - 1, Math.max(openLine + 1, block.position.end.line - 1));
  for (let i = openLine + 1; i <= lastLine; i++) {
    const end = lineEnd(markdown, lines[i]);
    const body = markdown.slice(lines[i], end);
    if (closePattern.test(body)) return { content: markdown.slice(contentStart, lines[i]), contentStart, closed: true };
  }
  return { content: markdown.slice(contentStart), contentStart, closed: false };
}
function lineOffsets(text: string): number[] { const offsets = [0]; for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) offsets.push(i + 1); return offsets; }
function lineEnd(text: string, start: number, includeNewline = false): number { const nl = text.indexOf('\n', start); if (nl < 0) return text.length; const end = nl > start && text.charCodeAt(nl - 1) === 13 ? nl - 1 : nl; return includeNewline ? nl + 1 : end; }
