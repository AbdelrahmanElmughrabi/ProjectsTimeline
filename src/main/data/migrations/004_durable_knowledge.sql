-- Approved V3a1a durable knowledge schema; 001-003 remain unchanged.
-- The existing runner owns BEGIN/COMMIT, backup, foreign_key_check and user_version.
CREATE TABLE knowledge_source_bindings (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  adapter_key TEXT NOT NULL CHECK (length(adapter_key) BETWEEN 1 AND 64 AND
    adapter_key GLOB '[a-z]*' AND adapter_key NOT GLOB '*[^a-z0-9._-]*'),
  native_root_key TEXT CHECK (native_root_key IS NULL OR length(native_root_key) BETWEEN 1 AND 2000),
  initial_import_id TEXT NOT NULL,
  UNIQUE (adapter_key, native_root_key),
  UNIQUE (id, project_id),
  FOREIGN KEY (initial_import_id, id, project_id)
    REFERENCES knowledge_imports(id, source_binding_id, project_id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE knowledge_imports (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  source_binding_id INTEGER NOT NULL,
  snapshot_id TEXT NOT NULL,
  parser_contract TEXT NOT NULL CHECK (length(parser_contract) BETWEEN 1 AND 64),
  format_version TEXT NOT NULL CHECK (length(format_version) BETWEEN 1 AND 64),
  formation_policy TEXT NOT NULL CHECK (length(formation_policy) BETWEEN 1 AND 64),
  semantic_sha256 TEXT CHECK (semantic_sha256 IS NULL OR (
    length(semantic_sha256) = 64 AND semantic_sha256 NOT GLOB '*[^0-9a-f]*')),
  review_digest TEXT NOT NULL CHECK (
    length(review_digest) = 64 AND review_digest NOT GLOB '*[^0-9a-f]*'),
  chosen_project_name TEXT NOT NULL CHECK (length(trim(chosen_project_name)) BETWEEN 1 AND 120),
  captured_at TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  capture_validation TEXT NOT NULL CHECK (capture_validation IN ('valid', 'needs-review')),
  diagnostics_json TEXT NOT NULL CHECK (
    json_valid(diagnostics_json) AND json_type(diagnostics_json) = 'array'),
  UNIQUE (id, project_id),
  UNIQUE (id, source_binding_id, project_id),
  FOREIGN KEY (source_binding_id, project_id) REFERENCES knowledge_source_bindings(id, project_id)
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
  project_id INTEGER NOT NULL REFERENCES projects(id),
  kind TEXT NOT NULL CHECK (kind IN (
    'project', 'component', 'feature', 'requirement', 'scope', 'action', 'decision', 'check')),
  created_at TEXT NOT NULL,
  UNIQUE (id, project_id, kind)
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
  source_native_id TEXT CHECK (source_native_id IS NULL OR length(source_native_id) BETWEEN 1 AND 2000),
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
  UNIQUE (origin_import_id, source_native_id, revision),
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

CREATE TRIGGER knowledge_project_identity BEFORE INSERT ON knowledge_definitions
WHEN NEW.kind = 'project' AND NOT EXISTS (
  SELECT 1 FROM knowledge_imports i JOIN knowledge_source_bindings s ON s.id = i.source_binding_id
  WHERE i.id = NEW.origin_import_id AND i.project_id = NEW.project_id
    AND s.native_root_key IS NEW.source_native_id)
BEGIN SELECT RAISE(ABORT, 'Knowledge project identity does not match binding'); END;

CREATE TRIGGER knowledge_inline_stage_only BEFORE INSERT ON knowledge_stage_definitions
WHEN NOT EXISTS (
  SELECT 1 FROM knowledge_scope_plans WHERE entity_id = NEW.scope_entity_id
    AND revision = NEW.scope_revision AND workflow_mode = 'inline')
BEGIN SELECT RAISE(ABORT, 'Stage requires an inline scope plan'); END;

CREATE TRIGGER knowledge_action_stage_target BEFORE INSERT ON knowledge_action_details
WHEN NEW.proposed_stage_key IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM knowledge_relationships l
  JOIN knowledge_entities e ON e.id = l.to_entity_id
  JOIN knowledge_scope_plans s ON s.entity_id = e.id AND s.revision = (
    SELECT MAX(d.revision) FROM knowledge_definitions d WHERE d.entity_id = e.id)
  WHERE l.from_entity_id = NEW.entity_id AND l.from_revision = NEW.revision
    AND l.relation = 'concerns-scope' AND (
      s.workflow_mode = 'reference' OR
      (s.workflow_mode = 'inline' AND EXISTS (
        SELECT 1 FROM knowledge_stage_definitions d WHERE d.scope_entity_id = s.entity_id
          AND d.scope_revision = s.revision AND d.stage_key = NEW.proposed_stage_key))))
BEGIN SELECT RAISE(ABORT, 'Proposed stage does not match source scope plan'); END;

CREATE TRIGGER knowledge_source_binding_immutable BEFORE UPDATE ON knowledge_source_bindings
BEGIN SELECT RAISE(ABORT, 'Knowledge source binding is fixed'); END;
CREATE TRIGGER knowledge_source_binding_no_delete BEFORE DELETE ON knowledge_source_bindings
BEGIN SELECT RAISE(ABORT, 'Knowledge binding cannot be deleted'); END;

CREATE TRIGGER knowledge_entity_identity_immutable BEFORE UPDATE ON knowledge_entities
BEGIN SELECT RAISE(ABORT, 'Knowledge identity is fixed'); END;
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
