-- Migration number: 0002 	 2026-01-05T00:00:00.000Z
-- Recovery codes table
CREATE TABLE IF NOT EXISTS recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT 0,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_hash ON recovery_codes(code_hash);
