import { open, realpath, stat } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import type { BigIntStats } from 'node:fs';
import type { BlueprintPreviewSnapshot, PreviewDiagnostic, PreviewDocument, PreviewErrorCode, PreviewSourceRef } from '../../shared/blueprint-preview';
import { AppError } from '../domain';
import { parsePreviewDocument, type ParsedPreviewDocument } from './parser';
import { buildPreviewSnapshot } from './graph';

const maximumFile = 1024 * 1024;
const maximumTotal = 10 * maximumFile;
const canonicalKey = (path: string) => path.normalize('NFC').toLowerCase();
const identity = (value: BigIntStats) => `${value.dev}:${value.ino}`;
const sameCapture = (a: BigIntStats, b: BigIntStats) => identity(a) === identity(b) && a.size === b.size && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs;

class SourceFailure extends Error {
  constructor(readonly code: PreviewErrorCode, message: string) { super(message); }
}

export interface BlueprintGrant {
  readonly entry: string;
  readonly rootInput: string;
  readonly root: string;
  readonly rootIdentity: string;
}

export function validDocumentPath(value: string): boolean {
  if (!value || value.length > 240 || value.includes('\\') || value.includes(':') || /[\x00-\x1f<>"|?*]/.test(value) || value.startsWith('/') || extname(value).toLowerCase() !== '.md') return false;
  return value.split('/').every(part => part !== '' && part !== '.' && part !== '..' && !/[. ]$/.test(part)
    && !/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part));
}

export async function createBlueprintGrant(entry: string): Promise<BlueprintGrant> {
  if (!isAbsolute(entry) || entry.includes('\0') || /^\\\\[?.]\\/.test(entry) || !validDocumentPath(basename(entry))) {
    throw new AppError('VALIDATION', 'Select a regular Markdown file with a supported filename.');
  }
  try {
    const rootInput = dirname(entry);
    const root = await realpath(rootInput);
    const rootStat = await stat(root, { bigint: true });
    if (!rootStat.isDirectory() || rootStat.ino === 0n) throw new Error('Unsupported file identity');
    return { entry: resolve(entry), rootInput, root, rootIdentity: identity(rootStat) };
  } catch {
    throw new AppError('VALIDATION', 'The selected folder is unavailable or cannot provide reliable file identity. Select the file again.');
  }
}

function contained(root: string, path: string): boolean {
  const tail = relative(root, path);
  return tail !== '' && tail !== '..' && !tail.startsWith(`..${sep}`) && !isAbsolute(tail);
}

async function checkRoot(grant: BlueprintGrant): Promise<void> {
  const current = await realpath(grant.rootInput);
  if (canonicalKey(current) !== canonicalKey(grant.root) || identity(await stat(current, { bigint: true })) !== grant.rootIdentity) {
    throw new SourceFailure('SOURCE_CHANGED', 'The selected folder changed during capture. Select the blueprint again.');
  }
}

async function readDocument(grant: BlueprintGrant, path: string, id: string, label: string, order: number, seenFiles: Set<string>, remaining: number, observations?: Map<string, BigIntStats>): Promise<PreviewDocument> {
  await checkRoot(grant);
  const canonical = await realpath(path);
  if (!contained(grant.root, canonical)) throw new SourceFailure('PATH_UNSAFE', 'A document resolves outside the selected blueprint folder.');
  const before = await stat(canonical, { bigint: true });
  if (!before.isFile() || before.ino === 0n) throw new SourceFailure('FILE_TYPE', 'A blueprint source must be a regular file with reliable identity.');
  if (before.size > BigInt(maximumFile) || before.size > BigInt(remaining)) throw new SourceFailure('LIMIT_EXCEEDED', 'The blueprint exceeds the 1 MiB per-file or 10 MiB package limit.');
  if (seenFiles.has(identity(before))) throw new SourceFailure('PATH_ALIAS', 'Two declared paths refer to the same physical file.');
  const handle = await open(canonical, 'r');
  try {
    const opened = await handle.stat({ bigint: true });
    if (!sameCapture(before, opened) || !opened.isFile()) throw new SourceFailure('SOURCE_CHANGED', 'The source changed while it was being opened. Refresh the preview.');
    const bound = Math.min(maximumFile, remaining);
    const bytes = Buffer.alloc(bound + 1);
    let length = 0;
    while (length < bytes.length) {
      const read = await handle.read(bytes, length, bytes.length - length, null);
      if (!read.bytesRead) break;
      length += read.bytesRead;
    }
    if (length > bound) throw new SourceFailure('LIMIT_EXCEEDED', 'The source grew beyond the allowed capture size.');
    const after = await handle.stat({ bigint: true });
    const finalPath = await realpath(path);
    const finalStat = await stat(finalPath, { bigint: true });
    await checkRoot(grant);
    if (!contained(grant.root, finalPath) || canonicalKey(finalPath) !== canonicalKey(canonical)
      || !sameCapture(opened, after) || !sameCapture(after, finalStat) || BigInt(length) !== after.size) {
      throw new SourceFailure('SOURCE_CHANGED', 'The source changed during capture. Refresh to capture it again.');
    }
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, length)); }
    catch { throw new SourceFailure('UTF8_INVALID', 'The document is not valid UTF-8. Save it as UTF-8 and refresh.'); }
    seenFiles.add(identity(after));
    observations?.set(id, after);
    return { id, relativePath: label, order, status: 'captured', text, byteLength: length, sha256: createHash('sha256').update(bytes.subarray(0, length)).digest('hex'), headings: [] };
  } finally { await handle.close(); }
}

export async function captureBlueprint(grant: BlueprintGrant, context: { sessionId: string; snapshotId: string; capturedAt: string; releaseWorkflowKeys: readonly { key: string; version: number }[] }): Promise<BlueprintPreviewSnapshot> {
  const parsed: ParsedPreviewDocument[] = [];
  const diagnostics: PreviewDiagnostic[] = [];
  const paths = new Set<string>([canonicalKey(basename(grant.entry))]);
  const files = new Set<string>();
  const observations = new Map<string, BigIntStats>();
  let total = 0;
  let records = 0;
  const report = (code: PreviewErrorCode, message: string, source: PreviewSourceRef | null, recordKeys: readonly string[] = [], field: string | null = null) => {
    diagnostics.push({ id: `acquisition:${diagnostics.length}`, code, severity: 'error', message, source, recordKeys, field, relatedSources: [] });
  };
  const load = async (path: string, label: string, order: number, source: PreviewSourceRef | null, field: string | null = null) => {
    const id = `d${order}`;
    let doc: PreviewDocument;
    try { doc = await readDocument(grant, path, id, label, order, files, maximumTotal - total, observations); }
    catch (error) {
      const failure = error instanceof SourceFailure ? error : new SourceFailure('FILE_UNAVAILABLE', 'The document could not be read. Check that it is available, then refresh.');
      report(failure.code, failure.message, source, [], field);
      parsed.push({ document: { id, relativePath: label, order, status: 'unavailable', text: null, sha256: null, byteLength: null, headings: [] }, records: [], diagnostics: [], fields: new Map() });
      return;
    }
    total += doc.byteLength!;
    const result = await parsePreviewDocument(doc);
    parsed.push(result);
    records += result.records.length;
  };
  await load(grant.entry, basename(grant.entry), 0, null);
  const entry = parsed[0];
  const projects = entry.records.filter(occ => occ.state === 'record' && occ.record.kind === 'project');
  if (projects.length === 1 && projects[0].state === 'record' && projects[0].record.kind === 'project') {
    const project = projects[0];
    const documents = project.record.kind === 'project' ? project.record.documents : [];
    for (let index = 0; index < documents.length; index++) {
      const label = documents[index];
      const source = entry.fields.get(project.key)?.get(`/documents/${index}`) ?? project.metadataSource;
      const field = `/documents/${index}`;
      if (index >= 49 || records >= 2000) { report('LIMIT_EXCEEDED', 'A package may contain at most 50 documents and 2,000 records.', source, [project.key], field); break; }
      if (!validDocumentPath(label)) { report('PATH_UNSAFE', 'A declared document path is not a safe relative Markdown path.', source, [project.key], field); continue; }
      const key = canonicalKey(label);
      if (paths.has(key)) { report('PATH_ALIAS', 'A document is declared repeatedly or has a case/Unicode-equivalent path.', source, [project.key], field); continue; }
      paths.add(key);
      await load(resolve(grant.root, ...label.split('/')), label, index + 1, source, field);
    }
  }
  // A package snapshot must not combine files changed after their individual reads.
  // Re-read identity/hash after capture; no snapshot is published from an observed change.
  for (const item of parsed) {
    if (item.document.status !== 'captured') continue;
    try {
      const path = item.document.order === 0 ? grant.entry : resolve(grant.root, ...item.document.relativePath.split('/'));
      const verified = await readDocument(grant, path, item.document.id, item.document.relativePath, item.document.order, new Set(), maximumFile);
      const latest = await stat(await realpath(path), { bigint: true });
      if (verified.sha256 !== item.document.sha256 || !sameCapture(observations.get(item.document.id)!, latest)) report('SOURCE_CHANGED', 'A captured document changed while other package documents were being read. Refresh the preview.', null);
    } catch { report('SOURCE_CHANGED', 'A captured source is no longer the same available file. Refresh the preview.', null); }
  }
  return buildPreviewSnapshot(parsed, diagnostics, context);
}
