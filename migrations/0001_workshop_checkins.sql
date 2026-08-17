PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  opened_at TEXT,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS checkins (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id TEXT NOT NULL UNIQUE,
  event_id TEXT NOT NULL,
  client_submission_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email_consent INTEGER NOT NULL DEFAULT 0 CHECK (email_consent IN (0, 1)),
  disclosure_version TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'ipad-kiosk',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE (event_id, client_submission_id)
);

CREATE INDEX IF NOT EXISTS checkins_event_sequence_idx
  ON checkins (event_id, sequence);

CREATE INDEX IF NOT EXISTS checkins_event_created_idx
  ON checkins (event_id, created_at);
