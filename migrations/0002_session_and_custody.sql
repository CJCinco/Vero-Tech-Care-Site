ALTER TABLE events ADD COLUMN session_generation TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN aos_verified_at TEXT;
ALTER TABLE events ADD COLUMN aos_verified_count INTEGER;
ALTER TABLE events ADD COLUMN aos_verified_final_sequence INTEGER;
ALTER TABLE events ADD COLUMN aos_receipt_digest TEXT;
ALTER TABLE events ADD COLUMN purged_at TEXT;

ALTER TABLE checkins RENAME COLUMN email_consent TO email_provided_under_disclosure;
