CREATE TABLE releases (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL,
  scope_revision INTEGER NOT NULL DEFAULT 1 CHECK (scope_revision >= 1),
  policy_version INTEGER NOT NULL DEFAULT 1 CHECK (policy_version = 1),
  confirmed_at TEXT,
  confirmed_verification_id INTEGER,
  CHECK ((confirmed_at IS NULL) = (confirmed_verification_id IS NULL)),
  FOREIGN KEY (confirmed_verification_id, id) REFERENCES release_verifications(id, release_id)
) STRICT;

CREATE TABLE release_stages (
  id INTEGER PRIMARY KEY,
  release_id INTEGER NOT NULL REFERENCES releases(id),
  stage_key TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  exclusion_reason TEXT CHECK (exclusion_reason IS NULL OR length(trim(exclusion_reason)) BETWEEN 1 AND 2000),
  UNIQUE (id, release_id),
  UNIQUE (release_id, position),
  UNIQUE (release_id, stage_key)
) STRICT;

-- Membership is commitment. Keeping it separate leaves every v1 action untouched.
CREATE TABLE release_actions (
  action_id INTEGER PRIMARY KEY REFERENCES actions(id),
  release_id INTEGER NOT NULL REFERENCES releases(id),
  stage_id INTEGER,
  exclusion_reason TEXT CHECK (exclusion_reason IS NULL OR length(trim(exclusion_reason)) BETWEEN 1 AND 2000),
  kind TEXT NOT NULL DEFAULT 'work' CHECK (kind IN ('work', 'release-confirmation')),
  CHECK (kind = 'work' OR (stage_id IS NOT NULL AND exclusion_reason IS NULL)),
  FOREIGN KEY (stage_id, release_id) REFERENCES release_stages(id, release_id)
) STRICT;
CREATE INDEX release_actions_release ON release_actions(release_id, stage_id);
CREATE UNIQUE INDEX release_confirmation_action ON release_actions(release_id) WHERE kind = 'release-confirmation';

CREATE TABLE release_verifications (
  id INTEGER PRIMARY KEY,
  release_id INTEGER NOT NULL REFERENCES releases(id),
  scope_revision INTEGER NOT NULL CHECK (scope_revision >= 1),
  artifact_identity TEXT NOT NULL CHECK (length(trim(artifact_identity)) BETWEEN 1 AND 300),
  evidence_reference TEXT NOT NULL CHECK (length(trim(evidence_reference)) BETWEEN 1 AND 2000),
  summary TEXT NOT NULL CHECK (length(trim(summary)) BETWEEN 1 AND 10000),
  outcome TEXT NOT NULL CHECK (outcome IN ('passed', 'failed')),
  created_at TEXT NOT NULL,
  UNIQUE (id, release_id)
) STRICT;
CREATE INDEX release_verifications_release ON release_verifications(release_id, id DESC);

CREATE TABLE action_events (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  release_id INTEGER REFERENCES releases(id),
  action_id INTEGER REFERENCES actions(id),
  description TEXT NOT NULL,
  before_value TEXT,
  after_value TEXT,
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX action_events_project ON action_events(project_id, id DESC);

CREATE TRIGGER release_action_owner BEFORE INSERT ON release_actions
WHEN (SELECT project_id FROM actions WHERE id = NEW.action_id) != (SELECT project_id FROM releases WHERE id = NEW.release_id)
BEGIN SELECT RAISE(ABORT, 'Action and release must belong to the same project'); END;

CREATE TRIGGER release_action_frozen_insert BEFORE INSERT ON release_actions
WHEN (SELECT confirmed_at FROM releases WHERE id = NEW.release_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Confirmed release is immutable'); END;

CREATE TRIGGER release_action_update BEFORE UPDATE ON release_actions
WHEN NEW.action_id != OLD.action_id OR NEW.release_id != OLD.release_id OR OLD.kind = 'release-confirmation'
  OR (SELECT confirmed_at FROM releases WHERE id = OLD.release_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Release membership or confirmed scope is immutable'); END;

CREATE TRIGGER release_action_delete BEFORE DELETE ON release_actions
BEGIN SELECT RAISE(ABORT, 'Release membership history must be preserved'); END;

CREATE TRIGGER confirmation_stage BEFORE INSERT ON release_actions
WHEN NEW.kind = 'release-confirmation' AND NOT EXISTS (
  SELECT 1 FROM release_stages WHERE id = NEW.stage_id AND release_id = NEW.release_id
    AND stage_key = 'release_confirmation' AND exclusion_reason IS NULL
)
BEGIN SELECT RAISE(ABORT, 'Confirmation must belong to the closing stage'); END;

CREATE TRIGGER release_action_stage_insert BEFORE INSERT ON release_actions
WHEN NEW.exclusion_reason IS NULL AND NEW.stage_id IS NOT NULL
  AND (SELECT exclusion_reason FROM release_stages WHERE id = NEW.stage_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Applicable work requires an included stage'); END;

CREATE TRIGGER release_action_stage_update BEFORE UPDATE ON release_actions
WHEN NEW.exclusion_reason IS NULL AND NEW.stage_id IS NOT NULL
  AND (SELECT exclusion_reason FROM release_stages WHERE id = NEW.stage_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Applicable work requires an included stage'); END;

CREATE TRIGGER protect_release_action BEFORE UPDATE ON actions
WHEN EXISTS (SELECT 1 FROM release_actions ra JOIN releases r ON r.id = ra.release_id
  WHERE ra.action_id = OLD.id AND (r.confirmed_at IS NOT NULL OR ra.kind = 'release-confirmation' OR NEW.project_id != OLD.project_id))
BEGIN SELECT RAISE(ABORT, 'Protected release action cannot be changed'); END;

CREATE TRIGGER freeze_stage BEFORE UPDATE ON release_stages
WHEN (SELECT confirmed_at FROM releases WHERE id = OLD.release_id) IS NOT NULL
  OR NEW.release_id != OLD.release_id OR NEW.stage_key != OLD.stage_key
  OR (OLD.stage_key = 'release_confirmation' AND NEW.exclusion_reason IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'Protected release stage cannot be changed'); END;

CREATE TRIGGER exclude_stage BEFORE UPDATE OF exclusion_reason ON release_stages
WHEN NEW.exclusion_reason IS NOT NULL AND EXISTS (
  SELECT 1 FROM release_actions WHERE stage_id = OLD.id AND exclusion_reason IS NULL
)
BEGIN SELECT RAISE(ABORT, 'Reassign or exclude applicable work before excluding its stage'); END;

CREATE TRIGGER freeze_stage_insert BEFORE INSERT ON release_stages
WHEN (SELECT confirmed_at FROM releases WHERE id = NEW.release_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Confirmed release is immutable'); END;

CREATE TRIGGER preserve_stage BEFORE DELETE ON release_stages
BEGIN SELECT RAISE(ABORT, 'Stage history must be preserved'); END;

CREATE TRIGGER freeze_release BEFORE UPDATE ON releases WHEN OLD.confirmed_at IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Confirmed release is immutable'); END;

CREATE TRIGGER confirmation_provenance BEFORE UPDATE OF confirmed_verification_id ON releases
WHEN NEW.confirmed_verification_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM release_verifications WHERE id = NEW.confirmed_verification_id AND release_id = NEW.id
    AND outcome = 'passed' AND scope_revision = NEW.scope_revision
    AND id = (SELECT MAX(id) FROM release_verifications WHERE release_id = NEW.id)
)
BEGIN SELECT RAISE(ABORT, 'Confirmation requires current passed verification'); END;

CREATE TRIGGER freeze_verification_insert BEFORE INSERT ON release_verifications
WHEN (SELECT confirmed_at FROM releases WHERE id = NEW.release_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Confirmed release is immutable'); END;
CREATE TRIGGER preserve_verification_update BEFORE UPDATE ON release_verifications
BEGIN SELECT RAISE(ABORT, 'Verification records are append-only'); END;
CREATE TRIGGER preserve_verification_delete BEFORE DELETE ON release_verifications
BEGIN SELECT RAISE(ABORT, 'Verification records are append-only'); END;
CREATE TRIGGER preserve_event_update BEFORE UPDATE ON action_events
BEGIN SELECT RAISE(ABORT, 'Action events are append-only'); END;
CREATE TRIGGER preserve_event_delete BEFORE DELETE ON action_events
BEGIN SELECT RAISE(ABORT, 'Action events are append-only'); END;
