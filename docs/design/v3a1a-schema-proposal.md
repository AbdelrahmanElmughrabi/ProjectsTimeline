# V3a1a — proposed exact additive schema

2026-11-07 · **Approval draft, not an installed migration.** Proposed filename: `src/main/data/migrations/004_durable_knowledge.sql`. [Transaction/DTO/UI/acceptance proposal](v3a1a-implementation-proposal.md). Preserve migrations 001–003 and every existing row; no backfill, legacy classification, seed project or manufactured event.

The following fenced SQL is the proposed complete migration body. It creates **13 STRICT tables**, 5 explicit indexes and 33 named triggers; the existing migration runner owns backup, the enclosing transaction, FK checking and `user_version = 4`. SQLite-generated unique indexes are additional to the explicit indexes. Exact source is a BLOB; literal arrays/source coordinates use validated JSON, not a generic entity payload.

## DDL for approval

```sql
-- Proposed contents of 004_durable_knowledge.sql. NOT an installed migration.
-- The existing runner owns BEGIN/COMMIT, backup, foreign_key_check and user_version.
CREATE TABLE knowledge_workspaces (
  project_id INTEGER PRIMARY KEY REFERENCES projects(id),
  source_namespace TEXT NOT NULL CHECK (source_namespace = 'ptb'),
  external_project_id TEXT NOT NULL CHECK (length(external_project_id) BETWEEN 1 AND 128),
  initial_import_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  UNIQUE (source_namespace, external_project_id),
  FOREIGN KEY (initial_import_id, project_id)
    REFERENCES knowledge_imports(id, project_id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE knowledge_imports (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  project_id INTEGER NOT NULL REFERENCES knowledge_workspaces(project_id),
  snapshot_id TEXT NOT NULL,
  parser_contract TEXT NOT NULL CHECK (parser_contract = 'v2-preview-1'),
  format_version TEXT NOT NULL CHECK (format_version = '0.2'),
  formation_policy TEXT NOT NULL CHECK (formation_policy = 'v3a1a-1'),
  semantic_sha256 TEXT NOT NULL CHECK (
    length(semantic_sha256) = 64 AND semantic_sha256 NOT GLOB '*[^0-9a-f]*'),
  review_digest TEXT NOT NULL CHECK (
    length(review_digest) = 64 AND review_digest NOT GLOB '*[^0-9a-f]*'),
  chosen_project_name TEXT NOT NULL CHECK (length(trim(chosen_project_name)) BETWEEN 1 AND 120),
  captured_at TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  capture_validation TEXT NOT NULL CHECK (capture_validation IN ('valid', 'needs-review')),
  diagnostics_json TEXT NOT NULL CHECK (
    json_valid(diagnostics_json) AND json_type(diagnostics_json) = 'array'),
  UNIQUE (id, project_id)
) STRICT;
CREATE INDEX knowledge_imports_project ON knowledge_imports(project_id, applied_at, id);

CREATE TABLE knowledge_documents (
  import_id TEXT NOT NULL,
  document_key TEXT NOT NULL CHECK (length(document_key) BETWEEN 1 AND 128),
  project_id INTEGER NOT NULL,
  relative_path TEXT NOT NULL CHECK (length(relative_path) BETWEEN 1 AND 240),
  presentation_order INTEGER NOT NULL CHECK (presentation_order BETWEEN 0 AND 49),
  source_utf8 BLOB NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length BETWEEN 0 AND 1048576),
  utf16_length INTEGER NOT NULL CHECK (utf16_length BETWEEN 0 AND byte_length),
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  headings_json TEXT NOT NULL CHECK (
    json_valid(headings_json) AND json_type(headings_json) = 'array'),
  CHECK (length(source_utf8) = byte_length),
  PRIMARY KEY (import_id, document_key),
  UNIQUE (import_id, document_key, project_id),
  UNIQUE (import_id, presentation_order),
  FOREIGN KEY (import_id, project_id) REFERENCES knowledge_imports(id, project_id)
) STRICT;

CREATE TABLE knowledge_entities (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES knowledge_workspaces(project_id),
  external_id TEXT NOT NULL CHECK (length(external_id) BETWEEN 1 AND 128),
  kind TEXT NOT NULL CHECK (kind IN (
    'project', 'component', 'feature', 'requirement', 'scope', 'action', 'decision', 'check')),
  current_revision INTEGER NOT NULL DEFAULT 1 CHECK (current_revision >= 1),
  action_id INTEGER UNIQUE REFERENCES actions(id),
  created_at TEXT NOT NULL,
  CHECK ((kind = 'action' AND action_id IS NOT NULL) OR
         (kind <> 'action' AND action_id IS NULL)),
  UNIQUE (project_id, external_id),
  UNIQUE (id, project_id, kind),
  FOREIGN KEY (id, current_revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
    DEFERRABLE INITIALLY DEFERRED
) STRICT;
CREATE UNIQUE INDEX knowledge_one_project_entity
  ON knowledge_entities(project_id) WHERE kind = 'project';
CREATE INDEX knowledge_entities_kind ON knowledge_entities(project_id, kind, id);

CREATE TABLE knowledge_definitions (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND
    CASE kind WHEN 'project' THEN 120 WHEN 'action' THEN 300 ELSE 200 END),
  narrative_markdown TEXT NOT NULL,
  origin_import_id TEXT NOT NULL,
  origin_document_key TEXT NOT NULL,
  origin_occurrence_key TEXT NOT NULL,
  presentation_order INTEGER NOT NULL CHECK (presentation_order BETWEEN 0 AND 1999),
  metadata_ref_json TEXT NOT NULL CHECK (
    json_valid(metadata_ref_json) AND json_type(metadata_ref_json) = 'object'),
  narrative_ref_json TEXT NOT NULL CHECK (
    json_valid(narrative_ref_json) AND json_type(narrative_ref_json) = 'object'),
  created_at TEXT NOT NULL,
  PRIMARY KEY (entity_id, revision),
  UNIQUE (entity_id, revision, project_id, kind),
  UNIQUE (origin_import_id, origin_occurrence_key, revision),
  UNIQUE (origin_import_id, presentation_order, revision),
  FOREIGN KEY (entity_id, project_id, kind) REFERENCES knowledge_entities(id, project_id, kind),
  FOREIGN KEY (origin_import_id, origin_document_key, project_id)
    REFERENCES knowledge_documents(import_id, document_key, project_id)
) STRICT;

CREATE TABLE knowledge_project_details (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'project' CHECK (kind = 'project'),
  goal TEXT NOT NULL CHECK (length(goal) <= 2000),
  documents_json TEXT NOT NULL CHECK (
    json_valid(documents_json) AND json_type(documents_json) = 'array'),
  capabilities_json TEXT NOT NULL CHECK (
    json_valid(capabilities_json) AND json_type(capabilities_json) = 'array'),
  PRIMARY KEY (entity_id, revision),
  FOREIGN KEY (entity_id, revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_requirement_details (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'requirement' CHECK (kind = 'requirement'),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('functional', 'quality', 'constraint')),
  acceptance_json TEXT NOT NULL CHECK (
    json_valid(acceptance_json) AND json_type(acceptance_json) = 'array'),
  PRIMARY KEY (entity_id, revision),
  FOREIGN KEY (entity_id, revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_scope_plans (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'scope' CHECK (kind = 'scope'),
  workflow_mode TEXT NOT NULL CHECK (workflow_mode IN ('none', 'inline', 'reference')),
  workflow_status TEXT NOT NULL CHECK (workflow_status IN ('none', 'inline', 'unresolved', 'incompatible')),
  template_key TEXT CHECK (template_key IS NULL OR length(template_key) BETWEEN 1 AND 128),
  template_version INTEGER CHECK (template_version IS NULL OR template_version >= 1),
  CHECK ((workflow_mode = 'none' AND workflow_status = 'none' AND
          template_key IS NULL AND template_version IS NULL) OR
         (workflow_mode = 'inline' AND workflow_status = 'inline' AND
          template_key IS NULL AND template_version IS NULL) OR
         (workflow_mode = 'reference' AND workflow_status IN ('unresolved', 'incompatible') AND
          template_key IS NOT NULL AND template_version IS NOT NULL)),
  PRIMARY KEY (entity_id, revision),
  UNIQUE (entity_id, revision, project_id, kind),
  FOREIGN KEY (entity_id, revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_stage_definitions (
  scope_entity_id INTEGER NOT NULL,
  scope_revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'scope' CHECK (kind = 'scope'),
  stage_key TEXT NOT NULL CHECK (length(stage_key) BETWEEN 1 AND 128),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 49),
  PRIMARY KEY (scope_entity_id, scope_revision, stage_key),
  UNIQUE (scope_entity_id, scope_revision, position),
  FOREIGN KEY (scope_entity_id, scope_revision, project_id, kind)
    REFERENCES knowledge_scope_plans(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_action_details (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'action' CHECK (kind = 'action'),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'requirement', 'implementation', 'verification', 'decision', 'research', 'documentation')),
  instructions TEXT NOT NULL CHECK (length(instructions) <= 10000),
  applicability TEXT NOT NULL CHECK (length(applicability) <= 2000),
  definition_of_done TEXT NOT NULL CHECK (length(definition_of_done) <= 10000),
  evidence_guidance TEXT NOT NULL CHECK (length(evidence_guidance) <= 2000),
  covers_rule_ids_json TEXT NOT NULL CHECK (
    json_valid(covers_rule_ids_json) AND json_type(covers_rule_ids_json) = 'array'),
  proposed_stage_key TEXT CHECK (proposed_stage_key IS NULL OR
    length(proposed_stage_key) BETWEEN 1 AND 128),
  PRIMARY KEY (entity_id, revision),
  FOREIGN KEY (entity_id, revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_decision_details (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'decision' CHECK (kind = 'decision'),
  rationale TEXT NOT NULL CHECK (length(rationale) <= 10000),
  alternatives_json TEXT NOT NULL CHECK (
    json_valid(alternatives_json) AND json_type(alternatives_json) = 'array'),
  PRIMARY KEY (entity_id, revision),
  FOREIGN KEY (entity_id, revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_check_details (
  entity_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'check' CHECK (kind = 'check'),
  method TEXT CHECK (method IS NULL OR method IN ('manual', 'automated')),
  instructions TEXT NOT NULL CHECK (length(instructions) <= 10000),
  expected_json TEXT NOT NULL CHECK (
    json_valid(expected_json) AND json_type(expected_json) = 'array'),
  PRIMARY KEY (entity_id, revision),
  FOREIGN KEY (entity_id, revision, project_id, kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;

CREATE TABLE knowledge_relationships (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  from_entity_id INTEGER NOT NULL,
  from_revision INTEGER NOT NULL,
  from_kind TEXT NOT NULL,
  to_entity_id INTEGER NOT NULL,
  to_kind TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN (
    'parent-component', 'primary-component', 'applies-to-feature', 'concerns-feature',
    'concerns-scope', 'addresses-requirement', 'affects-feature', 'affects-requirement',
    'plans-to-verify')),
  origin_import_id TEXT NOT NULL,
  origin_document_key TEXT NOT NULL,
  source_ref_json TEXT NOT NULL CHECK (
    json_valid(source_ref_json) AND json_type(source_ref_json) = 'object'),
  CHECK (
    (relation = 'parent-component' AND from_kind = 'component' AND to_kind = 'component') OR
    (relation = 'primary-component' AND from_kind = 'feature' AND to_kind = 'component') OR
    (relation = 'applies-to-feature' AND from_kind = 'requirement' AND to_kind = 'feature') OR
    (relation = 'concerns-feature' AND from_kind IN ('scope', 'action') AND to_kind = 'feature') OR
    (relation = 'concerns-scope' AND from_kind = 'action' AND to_kind = 'scope') OR
    (relation = 'addresses-requirement' AND from_kind = 'action' AND to_kind = 'requirement') OR
    (relation = 'affects-feature' AND from_kind = 'decision' AND to_kind = 'feature') OR
    (relation = 'affects-requirement' AND from_kind = 'decision' AND to_kind = 'requirement') OR
    (relation = 'plans-to-verify' AND from_kind = 'check' AND to_kind = 'requirement')),
  UNIQUE (from_entity_id, from_revision, relation, to_entity_id),
  FOREIGN KEY (from_entity_id, from_revision, project_id, from_kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind),
  FOREIGN KEY (to_entity_id, project_id, to_kind)
    REFERENCES knowledge_entities(id, project_id, kind),
  FOREIGN KEY (origin_import_id, origin_document_key, project_id)
    REFERENCES knowledge_documents(import_id, document_key, project_id)
) STRICT;
CREATE UNIQUE INDEX knowledge_single_parent_relation
  ON knowledge_relationships(from_entity_id, from_revision, relation)
  WHERE relation IN ('parent-component', 'primary-component', 'concerns-scope');
CREATE INDEX knowledge_relationships_target
  ON knowledge_relationships(project_id, to_entity_id, relation, from_entity_id);

CREATE TRIGGER knowledge_project_identity BEFORE INSERT ON knowledge_entities
WHEN NEW.kind = 'project' AND NOT EXISTS (
  SELECT 1 FROM knowledge_workspaces WHERE project_id = NEW.project_id
    AND external_project_id = NEW.external_id)
BEGIN SELECT RAISE(ABORT, 'Knowledge project identity does not match binding'); END;

CREATE TRIGGER knowledge_action_registration BEFORE INSERT ON knowledge_entities
WHEN NEW.kind = 'action' AND NOT EXISTS (
  SELECT 1 FROM actions a WHERE a.id = NEW.action_id AND a.project_id = NEW.project_id
    AND a.completed_at IS NULL AND NOT EXISTS (
      SELECT 1 FROM release_actions r WHERE r.action_id = a.id))
BEGIN SELECT RAISE(ABORT, 'Knowledge action must be incomplete, project-owned and outside releases'); END;

CREATE TRIGGER knowledge_action_no_completion BEFORE UPDATE OF completed_at ON actions
WHEN NEW.completed_at IS NOT NULL AND EXISTS (
  SELECT 1 FROM knowledge_entities WHERE action_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'Knowledge proposal cannot be completed'); END;

CREATE TRIGGER knowledge_action_owner_immutable BEFORE UPDATE OF id, project_id ON actions
WHEN (NEW.id IS NOT OLD.id OR NEW.project_id IS NOT OLD.project_id) AND EXISTS (
  SELECT 1 FROM knowledge_entities WHERE action_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'Knowledge action identity is fixed'); END;

CREATE TRIGGER knowledge_action_no_release BEFORE INSERT ON release_actions
WHEN EXISTS (SELECT 1 FROM knowledge_entities WHERE action_id = NEW.action_id)
BEGIN SELECT RAISE(ABORT, 'Knowledge action cannot join a release'); END;

CREATE TRIGGER knowledge_inline_stage_only BEFORE INSERT ON knowledge_stage_definitions
WHEN NOT EXISTS (
  SELECT 1 FROM knowledge_scope_plans WHERE entity_id = NEW.scope_entity_id
    AND revision = NEW.scope_revision AND workflow_mode = 'inline')
BEGIN SELECT RAISE(ABORT, 'Stage requires an inline scope plan'); END;

CREATE TRIGGER knowledge_action_stage_target BEFORE INSERT ON knowledge_action_details
WHEN NEW.proposed_stage_key IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM knowledge_relationships l
  JOIN knowledge_entities e ON e.id = l.to_entity_id
  JOIN knowledge_scope_plans s ON s.entity_id = e.id AND s.revision = e.current_revision
  WHERE l.from_entity_id = NEW.entity_id AND l.from_revision = NEW.revision
    AND l.relation = 'concerns-scope' AND (
      s.workflow_mode = 'reference' OR
      (s.workflow_mode = 'inline' AND EXISTS (
        SELECT 1 FROM knowledge_stage_definitions d WHERE d.scope_entity_id = s.entity_id
          AND d.scope_revision = s.revision AND d.stage_key = NEW.proposed_stage_key))))
BEGIN SELECT RAISE(ABORT, 'Proposed stage does not match source scope plan'); END;

CREATE TRIGGER knowledge_workspace_binding_immutable BEFORE UPDATE ON knowledge_workspaces
WHEN NEW.project_id IS NOT OLD.project_id OR
     NEW.source_namespace IS NOT OLD.source_namespace OR
     NEW.external_project_id IS NOT OLD.external_project_id OR
     NEW.initial_import_id IS NOT OLD.initial_import_id OR
     (NEW.revision <> OLD.revision AND NEW.revision <> OLD.revision + 1)
BEGIN SELECT RAISE(ABORT, 'Knowledge binding is fixed; revisions advance one at a time'); END;
CREATE TRIGGER knowledge_workspace_no_delete BEFORE DELETE ON knowledge_workspaces
BEGIN SELECT RAISE(ABORT, 'Knowledge binding cannot be deleted'); END;

CREATE TRIGGER knowledge_entity_identity_immutable BEFORE UPDATE ON knowledge_entities
WHEN NEW.id IS NOT OLD.id OR NEW.project_id IS NOT OLD.project_id OR
     NEW.external_id IS NOT OLD.external_id OR NEW.kind IS NOT OLD.kind OR
     NEW.action_id IS NOT OLD.action_id OR NEW.created_at IS NOT OLD.created_at OR
     (NEW.current_revision <> OLD.current_revision AND NEW.current_revision <> OLD.current_revision + 1)
BEGIN SELECT RAISE(ABORT, 'Knowledge identity is fixed; revisions advance one at a time'); END;
CREATE TRIGGER knowledge_entity_no_delete BEFORE DELETE ON knowledge_entities
BEGIN SELECT RAISE(ABORT, 'Knowledge identity cannot be deleted'); END;

-- Append-only captured/definition rows: future editing appends a new revision.

CREATE TRIGGER knowledge_imports_no_update BEFORE UPDATE ON knowledge_imports
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_imports_no_delete BEFORE DELETE ON knowledge_imports
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_documents_no_update BEFORE UPDATE ON knowledge_documents
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_documents_no_delete BEFORE DELETE ON knowledge_documents
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_definitions_no_update BEFORE UPDATE ON knowledge_definitions
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_definitions_no_delete BEFORE DELETE ON knowledge_definitions
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_project_details_no_update BEFORE UPDATE ON knowledge_project_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_project_details_no_delete BEFORE DELETE ON knowledge_project_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_requirement_details_no_update BEFORE UPDATE ON knowledge_requirement_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_requirement_details_no_delete BEFORE DELETE ON knowledge_requirement_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_scope_plans_no_update BEFORE UPDATE ON knowledge_scope_plans
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_scope_plans_no_delete BEFORE DELETE ON knowledge_scope_plans
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_stage_definitions_no_update BEFORE UPDATE ON knowledge_stage_definitions
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_stage_definitions_no_delete BEFORE DELETE ON knowledge_stage_definitions
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_action_details_no_update BEFORE UPDATE ON knowledge_action_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_action_details_no_delete BEFORE DELETE ON knowledge_action_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_decision_details_no_update BEFORE UPDATE ON knowledge_decision_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_decision_details_no_delete BEFORE DELETE ON knowledge_decision_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_check_details_no_update BEFORE UPDATE ON knowledge_check_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_check_details_no_delete BEFORE DELETE ON knowledge_check_details
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;

CREATE TRIGGER knowledge_relationships_no_update BEFORE UPDATE ON knowledge_relationships
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source is immutable'); END;
CREATE TRIGGER knowledge_relationships_no_delete BEFORE DELETE ON knowledge_relationships
BEGIN SELECT RAISE(ABORT, 'Stored knowledge definition or source cannot be deleted'); END;
```

## Main-owned invariants, deliberately not a SQL execution engine

- Every applied project has exactly one project-kind entity matching the binding, all eight kinds have their required typed payload (components/features use the common definition), every current pointer resolves, and the graph has exactly the reviewed counts. An initial formation inserts revision 1 only. An empty inline workflow is invalid; its 1–50 ordered stages must match the captured plan. SQL validates owner/type/FKs and cardinalities; main validates completeness before commit.
- Ordinary action title/details equal their initial knowledge definition; action ID owner is validated by the registration trigger, completion is null, release membership absent. **Apply creates every action row itself** in the new project transaction; renderer inputs never contain action IDs or an existing-project target. The registration trigger enforces owner/incomplete/not-release-bound, not a general historical “new” predicate. Existing mutators reject knowledge action IDs before touching title/details, completion, exclusion, assignment or audit. No API advances these proposal states in V3a1a. Future commitment/editing must explicitly revise these guards, rather than bypass them.
- All IDs/keys satisfy existing parser vocabulary/prefix/length rules; names and normalized strings round-trip losslessly as UTF-8. Reject label NUL and escaped lone-surrogate storage loss before starting a write. SQL scalar limits back up existing parser validation; ordered literal array member types/counts/lengths and canonical JSON source-ref shapes are validated by main.
- Valid source spans have the owning document key, correct ordered byte/UTF-16/code-point line-column coordinates, end-exclusive limits, real heading context and exact captured slices. BLOB re-encoding from Preview text must equal captured byte length and SHA-256 before storage (including BOM/CRLF). Document presentation order and occurrence order are unique within the applied capture; they never mean priority.
- Main retains all source documents, unknown fields/narrative and diagnostics without treating malformed records as entities. Formation blocks unavailable/invalid source; no partial-invalid durable graph. Diagnostic references may legitimately be package-level/null. Reference workflow status is the captured resolver result, not an automatic live registry re-resolution.
- Existing limits remain: 50 documents, 1 MiB/file, 10 MiB/package, 2,000 records and 20,000 relationships. Component parents are acyclic. Relationships are the exact explicit captured edges, with the source entity revision's import/document; source ownership and typed links are checked against that captured graph, not merely a syntactically valid span.
- A non-null proposed action stage needs exactly one concerns-scope relation. It must match the authored inline stage, or remain a string proposal in an unresolved/incompatible reference plan. No stage is created for a reference, no stage is guessed for unscoped work, no committed membership exists. Insert scope/stages and relationships before action payloads so the SQL guard can check placement.
- Immutability triggers intentionally make all capture/definition/link rows append-only. There is no deletion/purge or local edit command yet. Source occurrence/order uniqueness includes the definition revision, allowing a later local revision to retain its original source anchor without inventing another occurrence. That future command must distinguish edited working text from original captured text, record its actor/reason and validate expected revisions; no such mutation is exposed now. Operational acceptance/work state and checkpoint links will be separate later records, not rewrites of source definitions.
- UUID syntax, real UTC times, expected absence/revisions, cryptographic digests, exact payload coverage, audit/receipt integrity and selected-source provenance are main responsibilities. No arbitrary SQL/path/span command is exposed. Bound writes plus these FKs/checks/triggers are the persistence boundary, not a new workflow rules engine.

## Insert order, versioning and failure policy

Inside the existing `BEGIN IMMEDIATE`: project → workspace binding → import/receipt → documents → ordinary actions/details → entity identities → common definitions → project/requirement/scope payloads and stages → typed relationships → action/decision/check payloads → invariant checks → one actual formation audit → COMMIT. The two explicitly deferred references allow binding/import and entity/current-definition insertion without placeholder records. The receipt is visible only with the committed graph.

**`knowledge_imports.id = operationId = importId`** is the unique durable receipt key, not a separate generated capture ID. Receipt lookup uses that primary key and the stored review digest before consulting transient sessions. Immutable receipt values store actual capture/apply times, parser/formation policy and review digest. Reconstruct the initial receipt from that import's revision-1 definitions/links, fixed project-kind identity, chosen project name and applied-at time (also the original project's created-at time). Do not use mutable current pointers/names or count later definition revisions. No separate job/status queue. Later reimport is not implemented; a repeated canonical binding opens the existing project and returns its stored initial receipt, including after restart. Changes to files or labels never silently rebind it. Source semantic hash is not an entity ID or duplicate-project permission.

Relationships identify the target entity, not its target definition revision. This slice creates revision 1 only and can recover its initial imported graph/source; it does **not** promise arbitrary historical graph snapshots after later local edits. Before editing/reimport, review target-version resolution, local-link provenance and historical graph queries. Evidence and development-to-release snapshots need separately pinned revisions and remain deferred.

Migration failure rolls back the complete pending batch, leaves the previous version/rows intact and uses the existing SQLite backup path. Backup failure prevents migration. Foreign-key validation precedes the version marker/commit. A version-3 executable refuses version 4; rollback after an accepted production migration means explicitly restoring a verified backup with the app closed. Do not mutate old migrations, install a second database engine, or automatically downgrade.

## Approval limits

This schema saves **definitions and source**, not scope activation, acceptance, action execution, check results, blockers/focus, workflow instances, linked checkpoints or release snapshots. Future slices add their own small reviewed tables/commands. Nothing here changes a release's protected confirmation, revision or evidence history.
