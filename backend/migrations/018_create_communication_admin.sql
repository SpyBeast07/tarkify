CREATE TABLE IF NOT EXISTS communication_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL CHECK (record_type IN ('contact', 'feedback', 'newsletter', 'careers')),
  record_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comm_notes_record ON communication_notes(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_comm_notes_author ON communication_notes(author_id);

CREATE TABLE IF NOT EXISTS communication_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_record_tags (
  record_type TEXT NOT NULL CHECK (record_type IN ('contact', 'feedback', 'newsletter', 'careers')),
  record_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES communication_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (record_type, record_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_comm_record_tags_record ON communication_record_tags(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_comm_record_tags_tag ON communication_record_tags(tag_id);
