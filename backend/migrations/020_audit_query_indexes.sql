-- Migration: 020_audit_query_indexes
-- Performance indexes for the Admin Audit Center.
-- Derives the "module" grouping from the existing `event` column so we keep a
-- single source of truth and avoid changing the audit_logs schema.

CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs ((
  CASE
    WHEN event IN ('login','logout','session_revoked','account_created','password_changed','password_reset','email_verified','account_deleted','account_reactivated','account_suspended') THEN 'Authentication'
    WHEN event LIKE 'product%' THEN 'Products'
    WHEN event LIKE 'order%' THEN 'Orders'
    WHEN event LIKE 'payment%' THEN 'Payments'
    WHEN event LIKE 'download%' OR event IN ('token_revoked','token_regenerated') THEN 'Downloads'
    WHEN event LIKE 'customer%' OR event IN ('verification_resent','password_reset_requested','customer_sessions_revoked') THEN 'Customers'
    WHEN event LIKE 'contact%' OR event LIKE 'feedback%' OR event LIKE 'newsletter%' OR event LIKE 'careers%' OR event IN ('note_added','tag_added','tag_removed') THEN 'Communication'
    WHEN event LIKE 'email%' THEN 'Emails'
    WHEN event LIKE 'general%' OR event LIKE 'brand%' OR event LIKE 'oauth%' OR event LIKE 'security%' OR event LIKE 'storage%' OR event LIKE 'features%' OR event LIKE 'notifications%' OR event LIKE 'seo%' OR event LIKE 'legal%' THEN 'Settings'
    WHEN event LIKE 'system%' THEN 'System'
    WHEN event LIKE 'analytics%' THEN 'Analytics'
    ELSE 'Admin'
  END
));

-- GIN index over metadata JSONB to accelerate target/metadata text searches.
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING gin (metadata jsonb_path_ops);
