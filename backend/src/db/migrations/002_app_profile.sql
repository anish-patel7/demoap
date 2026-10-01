-- Single-row table holding the app user's editable profile (display name +
-- subtitle shown in the sidebar/header). No login/password by design.
CREATE TABLE IF NOT EXISTS app_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT 'V. K. Sharma',
  subtitle TEXT NOT NULL DEFAULT 'Pro Account',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO app_profile (id, display_name, subtitle)
VALUES (1, 'V. K. Sharma', 'Pro Account');
