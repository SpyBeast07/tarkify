-- Migration: 008_create_communication_tables
-- Communication module: contact_messages, feedback, newsletter_subscribers, career_applications
-- Each table is designed for future extension (tags, attachments, notes, replies, assignment, analytics)
-- without modifying existing columns.

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED')),
  submitted_from_ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  product TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED')),
  submitted_from_ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_product ON feedback(product);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED')),
  submitted_from_ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created ON newsletter_subscribers(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_active_email
  ON newsletter_subscribers(email)
  WHERE archived_at IS NULL;

-- Career applications
CREATE TABLE IF NOT EXISTS career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  portfolio_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED')),
  submitted_from_ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_applications_status ON career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_email ON career_applications(email);
CREATE INDEX IF NOT EXISTS idx_career_applications_created ON career_applications(created_at);
