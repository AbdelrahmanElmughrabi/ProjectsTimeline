import { randomUUID } from 'node:crypto';
import type { BlueprintPreviewOutcome } from '../../shared/blueprint-preview';
import { AppError, payload, requiredText } from '../domain';
import { captureBlueprint, createBlueprintGrant, type BlueprintGrant } from './acquisition';

export class BlueprintPreviewSession {
  private generation = 0;
  private pending: number | null = null;
  private pickerOpen = false;
  private grant: { id: string; source: BlueprintGrant } | null = null;

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
      const source = await createBlueprintGrant(entry);
      if (request !== this.generation) return { kind: 'cancelled' };
      const grant = { id: randomUUID(), source };
      const snapshot = await captureBlueprint(source, { sessionId: grant.id, snapshotId: randomUUID(), capturedAt: new Date().toISOString(), releaseWorkflowKeys: this.releaseWorkflowKeys() });
      if (request !== this.generation) return { kind: 'cancelled' };
      this.grant = grant;
      return { kind: 'snapshot', snapshot };
    } finally { if (this.pending === request) this.pending = null; }
  }

  async refresh(input: unknown): Promise<BlueprintPreviewOutcome> {
    const { sessionId } = payload(input, ['sessionId']);
    const id = requiredText(sessionId, 'Preview session', 128);
    const grant = this.grant;
    if (!grant || grant.id !== id) throw new AppError('NOT_FOUND', 'This preview session expired. Select the blueprint again.');
    const request = this.begin();
    try {
      const snapshot = await captureBlueprint(grant.source, { sessionId: grant.id, snapshotId: randomUUID(), capturedAt: new Date().toISOString(), releaseWorkflowKeys: this.releaseWorkflowKeys() });
      return request === this.generation ? { kind: 'snapshot', snapshot } : { kind: 'cancelled' };
    } finally { if (this.pending === request) this.pending = null; }
  }

  cancel(input?: unknown): void {
    if (input !== undefined) throw new AppError('VALIDATION', 'Cancel preview accepts no input.');
    this.generation++;
    this.pending = null;
    this.grant = null;
  }
}
