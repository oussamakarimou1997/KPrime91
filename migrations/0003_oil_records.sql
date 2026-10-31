-- Cloudflare D1 Migration for Oil Tracker
CREATE TABLE IF NOT EXISTS oil_records (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  oil_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  amount REAL NOT NULL,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_records_date ON oil_records(date);
CREATE INDEX IF NOT EXISTS idx_oil_records_type ON oil_records(type);
