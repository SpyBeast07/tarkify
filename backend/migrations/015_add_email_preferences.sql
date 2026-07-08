-- Add default email preferences to users who don't already have them

UPDATE users
SET preferences = preferences || '{"email": {"marketing": true, "newsletter": true, "product": true, "security": true, "billing": true}}'::jsonb
WHERE NOT (preferences ? 'email');
