CREATE TABLE IF NOT EXISTS email_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient  TEXT NOT NULL,
  template   TEXT NOT NULL,
  provider   TEXT NOT NULL,
  provider_id TEXT,
  status     TEXT NOT NULL,
  error      TEXT,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata   JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs (recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);
