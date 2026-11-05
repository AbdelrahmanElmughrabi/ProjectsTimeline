CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE actions (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  created_at TEXT NOT NULL,
  completed_at TEXT
) STRICT;
CREATE INDEX actions_project ON actions(project_id, id);

CREATE TABLE checkpoints (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  accomplished TEXT NOT NULL CHECK (length(trim(accomplished)) BETWEEN 1 AND 10000),
  next_steps TEXT NOT NULL CHECK (length(trim(next_steps)) BETWEEN 1 AND 10000),
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX checkpoints_project ON checkpoints(project_id, created_at DESC, id DESC);
