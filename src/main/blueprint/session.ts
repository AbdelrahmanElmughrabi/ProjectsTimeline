import { randomUUID } from 'node:crypto';
import type { BlueprintPreviewOutcome, BlueprintPreviewSnapshot } from '../../shared/blueprint-preview';
import type { PreparedFormation } from '../../shared/knowledge';
import type { WorkspaceStore } from '../data/database';
import { AppError, payload, requiredText } from '../domain';
import { captureBlueprint, createBlueprintGrant, type BlueprintGrant } from './acquisition';
import { freeze, operationKey, prepareFormation, reviewHash } from './formation';

export class BlueprintPreviewSession {
  private generation = 0;
  private pending: number | null = null;
  private pickerOpen = false;
  private grant: { id: string; source: BlueprintGrant } | null = null;
  private snapshot: BlueprintPreviewSnapshot | null = null;
  private plan: { snapshot: BlueprintPreviewSnapshot; prepared: PreparedFormation; generation: number } | null = null;
  private preparation = 0;

  constructor(private readonly chooseFile: () => Promise<string | null>, private readonly releaseWorkflowKeys: () => readonly { key: string; version: number }[]) {}

  private begin(): number {
    if (this.pending !== null || this.pickerOpen) throw new AppError('VALIDATION', 'A blueprint capture is already running. Cancel it or wait for it to finish.');
    this.pending = ++this.generation;
    return this.generation;
  }

  async choose(input?: unknown): Promise<BlueprintPreviewOutcome> {
    if (input !== undefined) throw new AppError('VALIDATION', 'Blueprint selection accepts no paths or input.');
    const request = this.begin();
    try {
      this.pickerOpen = true;
      let entry: string | null;
      try { entry = await this.chooseFile(); } finally { this.pickerOpen = false; }
      if (request !== this.generation || entry === null) return { kind: 'cancelled' };
      this.grant = null;
      this.snapshot = null;
      this.plan = null;
      const source = await createBlueprintGrant(entry);
      if (request !== this.generation) return { kind: 'cancelled' };
      const grant = { id: randomUUID(), source };
      const snapshot = await captureBlueprint(source, { sessionId: grant.id, snapshotId: randomUUID(), capturedAt: new Date().toISOString(), releaseWorkflowKeys: this.releaseWorkflowKeys() });
      if (request !== this.generation) return { kind: 'cancelled' };
      this.grant = grant;
      this.snapshot = freeze(snapshot);
      return { kind: 'snapshot', snapshot };
    } finally { if (this.pending === request) this.pending = null; }
  }

  async refresh(input: unknown): Promise<BlueprintPreviewOutcome> {
    const { sessionId } = payload(input, ['sessionId']);
    const id = requiredText(sessionId, 'Preview session', 128);
    const grant = this.grant;
    if (!grant || grant.id !== id) throw new AppError('NOT_FOUND', 'This preview session expired. Select the blueprint again.');
    const request = this.begin();
    this.plan = null;
    this.preparation++;
    this.snapshot = null;
    try {
      const snapshot = await captureBlueprint(grant.source, { sessionId: grant.id, snapshotId: randomUUID(), capturedAt: new Date().toISOString(), releaseWorkflowKeys: this.releaseWorkflowKeys() });
      if (request === this.generation) this.snapshot = freeze(snapshot);
      return request === this.generation ? { kind: 'snapshot', snapshot } : { kind: 'cancelled' };
    } finally { if (this.pending === request) this.pending = null; }
  }

  cancel(input?: unknown): void {
    if (input !== undefined) throw new AppError('VALIDATION', 'Cancel preview accepts no input.');
    this.generation++;
    this.pending = null;
    this.grant = null;
    this.snapshot = null;
    this.plan = null;
  }

  async prepareKnowledgeFormation(input: unknown, store: WorkspaceStore) {
    const values = payload(input, ['sessionId', 'snapshotId', 'name']);
    const snapshot = this.snapshot, generation = this.generation;
    const preparation = ++this.preparation;
    this.plan = null;
    if (this.pending !== null || !snapshot || snapshot.sessionId !== values.sessionId || snapshot.snapshotId !== values.snapshotId) throw new AppError('NOT_FOUND', 'This capture expired. Refresh or select the blueprint and review it again.');
    const plan = await prepareFormation(snapshot, values.name);
    if (generation !== this.generation || preparation !== this.preparation || this.snapshot !== snapshot) throw new AppError('NOT_FOUND', 'The capture changed during preparation. Review it again.');
    const existing = store.existingKnowledgeFormation(snapshot);
    if (existing) return existing;
    this.plan = { ...plan, generation };
    return structuredClone(plan.prepared);
  }

  applyKnowledgeFormation(input: unknown, store: WorkspaceStore) {
    const values = payload(input, ['operationId', 'reviewDigest']);
    const operationId = operationKey(values.operationId), digest = reviewHash(values.reviewDigest);
    const known = store.readFormationReceipt(operationId, digest);
    if (known) return { receipt: known, replayed: true };
    const plan = this.plan;
    if (plan?.prepared.operationId === operationId && plan.prepared.reviewDigest !== digest) throw new AppError('VALIDATION', 'The review digest does not match this formation operation.');
    if (this.pending !== null || !plan || plan.generation !== this.generation || plan.prepared.operationId !== operationId || plan.prepared.reviewDigest !== digest) throw new AppError('NOT_FOUND', 'This reviewed formation expired. Prepare it again before creating a project.');
    const result = store.commitKnowledgeFormation(plan.snapshot, plan.prepared);
    this.cancel();
    return result;
  }
}
