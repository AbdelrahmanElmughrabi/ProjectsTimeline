/** Approved V2 preview contract v2-preview-1; type-only boundary.
 * No live WorkspaceApi, IPC, parser, controller or UI implementation.
 * Implementation authorization is recorded separately in the BEGIN handoff.
 */
import type { ActionType, Result } from './contracts';

export type PreviewRecordKind = 'project' | 'component' | 'feature' | 'requirement' | 'scope' | 'action' | 'decision' | 'check';
export type PreviewValidation = 'valid' | 'needs-review' | 'invalid';
export type PreviewSeverity = 'error' | 'resolution' | 'warning';
export type PreviewErrorCode =
  | 'FILE_TYPE' | 'PATH_UNSAFE' | 'PATH_ALIAS' | 'FILE_UNAVAILABLE' | 'UTF8_INVALID' | 'SOURCE_CHANGED' | 'LIMIT_EXCEEDED'
  | 'PTB_FENCE_UNCLOSED' | 'JSON_SYNTAX' | 'DUPLICATE_KEY'
  | 'FORMAT_VERSION' | 'KIND_UNSUPPORTED' | 'FIELD_TYPE' | 'ID_KIND' | 'PROJECT_MISSING' | 'PROJECT_COUNT' | 'PROJECT_OWNER'
  | 'DUPLICATE_ID' | 'DUPLICATE_LINK' | 'LINK_TARGET' | 'COMPONENT_CYCLE' | 'STAGE_TARGET';
export type PreviewResolutionCode = 'WORKFLOW_UNRESOLVED' | 'WORKFLOW_PURPOSE';
export type PreviewWarningCode =
  | 'PTB_FENCE_INFO' | 'ACCEPTANCE_MISSING' | 'DONE_MISSING' | 'RATIONALE_MISSING' | 'CHECK_INCOMPLETE'
  | 'UNKNOWN_FIELD' | 'UNKNOWN_CAPABILITY' | 'UNKNOWN_RULE';

export interface PreviewPoint {
  readonly byteOffset: number; // UTF-8, zero based, includes a source BOM.
  readonly utf16Offset: number; // Into the exact captured document.text.
  readonly line: number; // One based.
  readonly column: number; // One-based Unicode-code-point column, not UTF-16.
}
export interface PreviewSpan { readonly start: PreviewPoint; readonly end: PreviewPoint } // End exclusive.
export interface PreviewSourceRef {
  readonly documentId: string;
  readonly span: PreviewSpan;
  readonly headingPath: readonly string[]; // Actual active heading context, never inferred entities.
}
export interface PreviewDocument {
  readonly id: string;
  readonly relativePath: string; // Entry basename or validated manifest-relative path; no root grant/path authority.
  readonly order: number;
  readonly status: 'captured' | 'unavailable';
  readonly text: string | null; // Exact decoded source, including BOM/CRLF; null when unavailable.
  readonly sha256: string | null;
  readonly byteLength: number | null;
  readonly headings: readonly { readonly depth: number; readonly text: string; readonly source: PreviewSourceRef }[];
}

interface RecordBase {
  readonly ptb: '0.2';
  readonly id: string; // External PTB identity, not a SQLite ID or a unique occurrence key.
  readonly title: string;
}
interface OwnedRecord extends RecordBase { readonly project: string }
// Array order is authored stage order; source occurrence order never implies priority.
export interface PreviewStage { readonly key: string; readonly title: string }
export type PreviewWorkflowRequest =
  | { readonly stages: readonly PreviewStage[] }
  | { readonly template_key: string; readonly version: number };

// Normalized known fields only. Unknown metadata remains in captured source/diagnostics.
export type PreviewRecord =
  | (RecordBase & { readonly kind: 'project'; readonly goal: string; readonly documents: readonly string[]; readonly capabilities: readonly string[] })
  | (OwnedRecord & { readonly kind: 'component'; readonly parent: string | null })
  | (OwnedRecord & { readonly kind: 'feature'; readonly component: string | null })
  | (OwnedRecord & { readonly kind: 'requirement'; readonly features: readonly string[]; readonly type: 'functional' | 'quality' | 'constraint'; readonly acceptance: readonly string[] })
  | (OwnedRecord & { readonly kind: 'scope'; readonly features: readonly string[]; readonly workflow: PreviewWorkflowRequest | null })
  | (OwnedRecord & { readonly kind: 'action'; readonly features: readonly string[]; readonly requirements: readonly string[]; readonly scope: string | null; readonly stage: string | null; readonly action_type: ActionType; readonly instructions: string; readonly applicability: string; readonly definition_of_done: string; readonly evidence_guidance: string; readonly covers_rule_ids: readonly string[] })
  | (OwnedRecord & { readonly kind: 'decision'; readonly features: readonly string[]; readonly requirements: readonly string[]; readonly rationale: string; readonly alternatives: readonly string[] })
  | (OwnedRecord & { readonly kind: 'check'; readonly requirements: readonly string[]; readonly method: 'manual' | 'automated' | null; readonly expected: readonly string[]; readonly instructions: string });

interface OccurrenceBase {
  readonly key: string; // Opaque occurrence identity, unique even for duplicate external IDs.
  readonly order: number; // Entry, manifest, then block presentation order; not priority or semantic identity.
  readonly metadataSource: PreviewSourceRef;
  readonly narrativeSource: PreviewSourceRef;
  readonly narrativeMarkdown: string; // Exact captured narrative slice; not generated HTML.
  readonly diagnosticIds: readonly string[];
}
export type PreviewOccurrence =
  | (OccurrenceBase & { readonly state: 'record'; readonly record: PreviewRecord; readonly validation: PreviewValidation })
  | (OccurrenceBase & { readonly state: 'invalid-record'; readonly declaredId: string | null; readonly declaredKind: string | null });

export type PreviewRelation = 'parent-component' | 'primary-component' | 'applies-to-feature' | 'concerns-feature' | 'concerns-scope' | 'addresses-requirement' | 'affects-feature' | 'affects-requirement' | 'plans-to-verify';
export interface PreviewRelationship {
  readonly id: string;
  readonly fromKey: string;
  readonly relation: PreviewRelation;
  readonly targetId: string;
  readonly expectedKind: PreviewRecordKind;
  readonly status: 'resolved' | 'missing' | 'wrong-kind' | 'wrong-project' | 'ambiguous';
  readonly targetKeys: readonly string[]; // One for resolved; colliding occurrences for ambiguous, never first-wins.
  readonly source: PreviewSourceRef; // Exact reference field/array item.
}
export interface PreviewWorkflowResolution {
  readonly scopeKey: string;
  readonly status: 'none' | 'inline' | 'unresolved' | 'incompatible';
  readonly stages: readonly PreviewStage[]; // Empty for unresolved/incompatible; no fabricated stages.
  readonly diagnosticIds: readonly string[];
}
export interface PreviewStageAssignment {
  readonly actionKey: string;
  readonly scopeKey: string | null;
  readonly stageKey: string | null;
  readonly stageTitle: string | null;
  readonly status: 'unscoped' | 'unassigned' | 'resolved' | 'unresolved-workflow' | 'invalid'; // Unresolved-workflow includes incompatible editions.
}
export type PreviewDiagnostic = {
  readonly id: string;
  readonly message: string;
  readonly recordKeys: readonly string[];
  readonly field: string | null; // JSON pointer when a parsed field exists.
  readonly source: PreviewSourceRef | null; // Never invent a location in unread content.
  readonly relatedSources: readonly PreviewSourceRef[];
} & (
  | { readonly severity: 'error'; readonly code: PreviewErrorCode }
  | { readonly severity: 'resolution'; readonly code: PreviewResolutionCode }
  | { readonly severity: 'warning'; readonly code: PreviewWarningCode }
);
export interface BlueprintPreviewSnapshot {
  readonly contractVersion: 'v2-preview-1';
  readonly sessionId: string; // Opaque main-owned entry/root grant; no renderer-supplied path.
  readonly snapshotId: string; // New on each completed capture; cancellation/refresh retires it.
  readonly capturedAt: string; // Actual preview capture time, not engineering history.
  readonly validation: PreviewValidation;
  readonly projectKey: string | null; // Null if no unique schema-valid project exists.
  readonly semanticSha256: string | null; // Null for blocked graphs; excludes presentation/provenance.
  readonly documents: readonly PreviewDocument[];
  readonly records: readonly PreviewOccurrence[];
  readonly relationships: readonly PreviewRelationship[];
  readonly workflows: readonly PreviewWorkflowResolution[];
  readonly assignments: readonly PreviewStageAssignment[];
  readonly structure: {
    readonly rows: readonly { readonly recordKey: string; readonly depth: number }[]; // Acyclic component/feature preorder, computed by backend.
    readonly unplacedFeatureKeys: readonly string[];
    readonly invalidStructureKeys: readonly string[];
  };
  readonly diagnostics: readonly PreviewDiagnostic[];
  readonly counts: { readonly occurrences: number; readonly unparsed: number; readonly errors: number; readonly resolutions: number; readonly warnings: number };
}

export type BlueprintPreviewOutcome =
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'snapshot'; readonly snapshot: BlueprintPreviewSnapshot };
export interface BlueprintPreviewApi {
  chooseBlueprintPreview(): Promise<Result<BlueprintPreviewOutcome>>;
  refreshBlueprintPreview(input: { sessionId: string }): Promise<Result<BlueprintPreviewOutcome>>;
  cancelBlueprintPreview(): Promise<Result<void>>;
}

export interface PreviewSelection {
  readonly snapshotId: string;
  readonly documentId: string | null; // Null for package-level diagnostics/selection; never invent a document.
  readonly recordKey: string | null;
  readonly diagnosticId: string | null;
  readonly source: PreviewSourceRef | null; // Captured heading/field/related-location anchor, same documentId.
}
export type BlueprintPreviewViewState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'loading'; readonly operation: 'choose' | 'refresh'; readonly previous: BlueprintPreviewSnapshot | null }
  | { readonly phase: 'ready'; readonly snapshot: BlueprintPreviewSnapshot }
  | { readonly phase: 'stale'; readonly snapshot: BlueprintPreviewSnapshot; readonly message: string }
  | { readonly phase: 'error'; readonly message: string }
  | { readonly phase: 'expired'; readonly message: string }
  | { readonly phase: 'cancelling'; readonly previous: BlueprintPreviewSnapshot | null };
export interface BlueprintPreviewProps {
  readonly state: BlueprintPreviewViewState;
  readonly selection: PreviewSelection | null;
  readonly onChoose: () => void;
  readonly onRefresh: () => void;
  readonly onCancel: () => void;
  readonly onSelect: (selection: PreviewSelection) => void;
}
