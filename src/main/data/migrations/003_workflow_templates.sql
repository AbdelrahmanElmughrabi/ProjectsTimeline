CREATE TABLE workflow_templates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 10000),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  built_in_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (built_in_key, version)
) STRICT;

CREATE TABLE workflow_template_stages (
  id INTEGER PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES workflow_templates(id),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  position INTEGER NOT NULL CHECK (position >= 0),
  protected_closing INTEGER NOT NULL DEFAULT 0 CHECK (protected_closing IN (0, 1)),
  UNIQUE (id, template_id),
  UNIQUE (template_id, position)
) STRICT;
CREATE UNIQUE INDEX workflow_closing_stage ON workflow_template_stages(template_id) WHERE protected_closing = 1;

CREATE TABLE workflow_template_actions (
  id INTEGER PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES workflow_templates(id),
  stage_id INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  instructions TEXT NOT NULL DEFAULT '' CHECK (length(instructions) <= 10000),
  applicability TEXT NOT NULL DEFAULT '' CHECK (length(applicability) <= 2000),
  definition_of_done TEXT NOT NULL DEFAULT '' CHECK (length(definition_of_done) <= 10000),
  evidence_guidance TEXT NOT NULL DEFAULT '' CHECK (length(evidence_guidance) <= 2000),
  action_type TEXT NOT NULL DEFAULT 'implementation' CHECK (action_type IN ('requirement','implementation','verification','decision','research','documentation')),
  UNIQUE (stage_id, position),
  FOREIGN KEY (stage_id, template_id) REFERENCES workflow_template_stages(id, template_id)
) STRICT;

CREATE TABLE action_details (
  action_id INTEGER PRIMARY KEY REFERENCES actions(id),
  instructions TEXT NOT NULL DEFAULT '' CHECK (length(instructions) <= 10000),
  applicability TEXT NOT NULL DEFAULT '' CHECK (length(applicability) <= 2000),
  definition_of_done TEXT NOT NULL DEFAULT '' CHECK (length(definition_of_done) <= 10000),
  evidence_guidance TEXT NOT NULL DEFAULT '' CHECK (length(evidence_guidance) <= 2000),
  action_type TEXT NOT NULL DEFAULT 'implementation' CHECK (action_type IN ('requirement','implementation','verification','decision','research','documentation')),
  position INTEGER CHECK (position IS NULL OR position >= 0)
) STRICT;

ALTER TABLE releases ADD COLUMN source_template_id INTEGER REFERENCES workflow_templates(id);
ALTER TABLE releases ADD COLUMN source_template_version INTEGER CHECK (source_template_version IS NULL OR source_template_version >= 1);
ALTER TABLE releases ADD COLUMN source_template_name TEXT CHECK (
  (source_template_id IS NULL AND source_template_version IS NULL AND source_template_name IS NULL)
  OR (source_template_id IS NOT NULL AND source_template_version IS NOT NULL AND source_template_name IS NOT NULL AND length(trim(source_template_name)) BETWEEN 1 AND 120)
);

INSERT INTO workflow_templates(name, description, version, built_in_key, created_at, updated_at)
VALUES ('Seven-stage Engineering Workflow', 'A starter foundation for engineering a software release. Add product-specific requirements and review applicability; this is not an exhaustive checklist.', 1, 'seven-stage-engineering', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'Requirements and Planning', 0, 0 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;
INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'UX, Architecture, and Technical Design', 1, 0 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;
INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'Development Environment and Project Setup', 2, 0 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;
INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'Implementation', 3, 0 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;
INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'Integrated Release Verification', 4, 0 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;
INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'Release Preparation', 5, 0 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;
INSERT INTO workflow_template_stages(template_id, name, position, protected_closing)
SELECT id, 'Deployment/Distribution and Release Confirmation', 6, 1 FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1;

INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Record release scope and observable acceptance criteria',
  'List intended user outcomes, explicit exclusions and a checkable acceptance condition for each committed outcome.',
  'Any planned release.',
  'Scope and exclusions are written; each committed outcome has an observable pass/fail criterion.',
  'Scope note and acceptance checklist.', 'requirement'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 0;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Review ownership boundaries and one critical data flow',
  'Identify which module or process owns state, validation and persistence; trace a critical operation and its failure path.',
  'Releases changing application behavior or architecture.',
  'Boundaries, data flow, failure behavior and rationale for consequential choices are recorded.',
  'Architecture note or diagram and decision rationale.', 'decision'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 1;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Verify a clean setup can build and launch',
  'Follow documented setup in a fresh environment or profile; install declared dependencies and run the documented build and start steps.',
  'Software built or distributed from source.',
  'Documented steps reproduce a working build and launch without undeclared local state.',
  'Commands, environment and version record, and actual result.', 'verification'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 2;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Validate externally supplied input before changing state',
  'Identify input boundaries touched by this release; add validation, safe error feedback and invalid-input checks.',
  'Behavior accepting user, file, network or other external input.',
  'Representative invalid input is rejected safely without partial state changes; expected valid input succeeds.',
  'Boundary tests or recorded manual cases.', 'implementation'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 3;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Run integrated acceptance checks on the release candidate',
  'Exercise committed acceptance criteria against the actual candidate, including relevant integration, security, reliability and failure paths.',
  'Every release candidate.',
  'Relevant criteria pass on the identified candidate; unresolved failures are recorded and addressed before confirmation.',
  'Candidate identity, actual check results and failure resolution.', 'verification'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 4;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 1, 'Verify persistence after application restart',
  'Save representative project state, terminate the application completely, reopen it and retrieve the saved data.',
  'Software storing persistent local state.',
  'Saved data and relevant state are restored correctly after a full restart.',
  'Automated persistence or recovery test and/or a recorded manual restart result.', 'verification'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 4;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Document installation, version identity and recovery',
  'Record how to install and run this version, identify its artifact, and recover or roll back when applicable.',
  'Software delivered to a user or environment.',
  'Another reader can follow installation and applicable recovery steps for the named version.',
  'Release instructions and exercised recovery or installation result.', 'documentation'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 5;
INSERT INTO workflow_template_actions(template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type)
SELECT template_id, id, 0, 'Verify the delivered artifact in its target environment',
  'Install or deploy the intended artifact and exercise its critical acceptance flow in the target environment.',
  'Distributed or deployed software.',
  'The delivered version is identified and its critical flow works in the intended environment.',
  'Artifact identity and actual target-environment result. Protected final confirmation still requires its separate recorded provenance.', 'verification'
FROM workflow_template_stages WHERE template_id = (SELECT id FROM workflow_templates WHERE built_in_key = 'seven-stage-engineering' AND version = 1) AND position = 6;

CREATE TRIGGER preserve_workflow_origin BEFORE UPDATE OF source_template_id, source_template_version, source_template_name ON releases
WHEN NEW.source_template_id IS NOT OLD.source_template_id OR NEW.source_template_version IS NOT OLD.source_template_version OR NEW.source_template_name IS NOT OLD.source_template_name
BEGIN SELECT RAISE(ABORT, 'Release workflow origin is immutable'); END;

CREATE TRIGGER protect_builtin_template_update BEFORE UPDATE ON workflow_templates
WHEN OLD.built_in_key IS NOT NULL OR NEW.built_in_key IS NOT OLD.built_in_key
BEGIN SELECT RAISE(ABORT, 'Built-in workflow editions are read-only'); END;
CREATE TRIGGER protect_builtin_template_delete BEFORE DELETE ON workflow_templates WHEN OLD.built_in_key IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Built-in workflow editions are read-only'); END;
CREATE TRIGGER protect_builtin_stage_insert BEFORE INSERT ON workflow_template_stages
WHEN (SELECT built_in_key FROM workflow_templates WHERE id = NEW.template_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Built-in workflow editions are read-only'); END;
CREATE TRIGGER protect_template_stage_update BEFORE UPDATE ON workflow_template_stages
WHEN NEW.template_id != OLD.template_id OR NEW.id != OLD.id OR NEW.protected_closing != OLD.protected_closing
  OR (SELECT built_in_key FROM workflow_templates WHERE id = OLD.template_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Protected workflow stage cannot be changed'); END;
CREATE TRIGGER protect_template_stage_delete BEFORE DELETE ON workflow_template_stages
WHEN OLD.protected_closing = 1 OR (SELECT built_in_key FROM workflow_templates WHERE id = OLD.template_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Protected workflow stage cannot be removed'); END;
CREATE TRIGGER protect_builtin_action_insert BEFORE INSERT ON workflow_template_actions
WHEN (SELECT built_in_key FROM workflow_templates WHERE id = NEW.template_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Built-in workflow editions are read-only'); END;
CREATE TRIGGER protect_template_action_update BEFORE UPDATE ON workflow_template_actions
WHEN NEW.template_id != OLD.template_id OR NEW.id != OLD.id
  OR (SELECT built_in_key FROM workflow_templates WHERE id = OLD.template_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Protected workflow action cannot be changed'); END;
CREATE TRIGGER protect_builtin_action_delete BEFORE DELETE ON workflow_template_actions
WHEN (SELECT built_in_key FROM workflow_templates WHERE id = OLD.template_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Built-in workflow editions are read-only'); END;

CREATE TRIGGER freeze_action_details_insert BEFORE INSERT ON action_details
WHEN EXISTS (SELECT 1 FROM release_actions ra JOIN releases r ON r.id = ra.release_id WHERE ra.action_id = NEW.action_id AND (ra.kind = 'release-confirmation' OR r.confirmed_at IS NOT NULL))
BEGIN SELECT RAISE(ABORT, 'Protected release details cannot be changed'); END;
CREATE TRIGGER freeze_action_details_update BEFORE UPDATE ON action_details
WHEN NEW.action_id != OLD.action_id OR EXISTS (SELECT 1 FROM release_actions ra JOIN releases r ON r.id = ra.release_id WHERE ra.action_id = OLD.action_id AND (ra.kind = 'release-confirmation' OR r.confirmed_at IS NOT NULL))
BEGIN SELECT RAISE(ABORT, 'Protected release details cannot be changed'); END;
CREATE TRIGGER freeze_action_details_delete BEFORE DELETE ON action_details
WHEN EXISTS (SELECT 1 FROM release_actions ra JOIN releases r ON r.id = ra.release_id WHERE ra.action_id = OLD.action_id AND (ra.kind = 'release-confirmation' OR r.confirmed_at IS NOT NULL))
BEGIN SELECT RAISE(ABORT, 'Protected release details cannot be changed'); END;
