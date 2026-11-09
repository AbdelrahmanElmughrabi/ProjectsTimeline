import type { PreviewRecordKind, PreviewSourceRef, PreviewRelation, PreviewDiagnostic, PreviewWorkflowRequest, PreviewDocument } from './blueprint-preview';
import type { Project, ActionDefinitionInput, Result } from './contracts';

export type KnowledgeKind = PreviewRecordKind;
export type KnowledgeCounts = Readonly<Record<KnowledgeKind, number>>;
export type KnowledgeSourceAnchor = {
  importId: string; documentKey: string; source: PreviewSourceRef;
}; // source.documentId must equal documentKey; end-exclusive offsets unchanged.
export type KnowledgeNode = {
  entityId: number; externalId: string; kind: KnowledgeKind;
  revision: number; title: string; presentationOrder: number;
  origin: { sourceBindingId: number; importId: string; occurrenceKey: string };
  // externalId is the non-null captured PTB native ID, not canonical app identity.
};
export type KnowledgeLink = {
  relationshipId: number; fromEntityId: number; fromRevision: number;
  toEntityId: number; relation: PreviewRelation;
}; // Explicit source links only, not paths or ownership spokes.
export type FormationReceipt = {
  operationId: string; importId: string; sourceBindingId: number; reviewDigest: string;
  project: Project; rootEntityId: number; appliedAt: string;
  counts: KnowledgeCounts; relationshipCount: number;
};
export type PreparedFormation = {
  kind: 'prepared'; operationId: string; reviewDigest: string;
  policyVersion: 'v3a1a-1'; snapshotId: string; capturedAt: string;
  projectName: string; externalProjectId: string;
  documents: readonly { documentKey: string; relativePath: string;
    sha256: string; byteLength: number }[];
  counts: KnowledgeCounts; relationshipCount: number;
  diagnostics: readonly PreviewDiagnostic[];
  // UI states the fixed effects: Draft / Proposed / Planned, zero commitments/releases.
};
export type FormationPreparation = PreparedFormation | {
  kind: 'existing'; project: Project; receipt: FormationReceipt;
  captureComparison: 'same' | 'different'; // Exact document tuples, not counts alone.
};
export type KnowledgeWorkspace = {
  project: Project; rootEntityId: number;
  goal: string; counts: KnowledgeCounts; receipt: FormationReceipt;
  documents: readonly { importId: string; documentKey: string;
    relativePath: string; sha256: string; byteLength: number }[];
  review: { importId: string; diagnostics: readonly PreviewDiagnostic[];
    needsReviewScopeEntityIds: readonly number[] };
  nodes: readonly KnowledgeNode[]; links: readonly KnowledgeLink[];
};
export type KnowledgeRecordBase = KnowledgeNode & {
  projectId: number; narrativeMarkdown: string;
  metadata: KnowledgeSourceAnchor; narrative: KnowledgeSourceAnchor;
  relationships: readonly KnowledgeLink[];
};
export type KnowledgeRecord = KnowledgeRecordBase & (
  | { kind: 'project'; goal: string; documents: readonly string[];
      capabilities: readonly string[] }
  | { kind: 'component' | 'feature' }
  | { kind: 'requirement'; state: 'draft'; requirementType:
      'functional' | 'quality' | 'constraint'; acceptance: readonly string[] }
  | { kind: 'scope'; state: 'draft'; workflow: PreviewWorkflowRequest | null;
      workflowStatus: 'none' | 'inline' | 'unresolved' | 'incompatible' }
  | { kind: 'action'; state: 'proposed';
      details: ActionDefinitionInput; proposedStageKey: string | null;
      coversRuleIds: readonly string[] }
  | { kind: 'decision'; state: 'proposed'; rationale: string;
      alternatives: readonly string[] }
  | { kind: 'check'; state: 'not-run'; method: 'manual' | 'automated' | null;
      instructions: string; expected: readonly string[] }
);
export type KnowledgeSourceTarget =
  | { kind: 'record'; entityId: number; revision: number;
      part: 'metadata' | 'narrative' }
  | { kind: 'relationship'; relationshipId: number }
  | { kind: 'diagnostic'; importId: string; diagnosticId: string;
      relatedIndex?: number }
  | { kind: 'document'; importId: string; documentKey: string };
export type KnowledgeSource = {
  importId: string; document: PreviewDocument & { status: 'captured'; text: string;
    sha256: string; byteLength: number };
  selection: PreviewSourceRef | null;
};

export interface KnowledgeApi {
prepareKnowledgeFormation(input: {
  sessionId: string; snapshotId: string; name: string;
}): Promise<Result<FormationPreparation>>;
applyKnowledgeFormation(input: {
  operationId: string; reviewDigest: string;
}): Promise<Result<{ receipt: FormationReceipt; replayed: boolean }>>;
openKnowledgeWorkspace(input: {
  projectId: number;
}): Promise<Result<KnowledgeWorkspace | null>>; // null = existing legacy project
getKnowledgeRecord(input: {
  projectId: number; entityId: number; revision?: number;
}): Promise<Result<KnowledgeRecord>>;
getKnowledgeSource(input: {
  projectId: number; target: KnowledgeSourceTarget;
}): Promise<Result<KnowledgeSource>>;
}
