-- Rename dni to ci for Uruguay
ALTER TABLE members RENAME COLUMN dni TO ci;

-- Remove emergency contact columns
ALTER TABLE members DROP COLUMN IF EXISTS emergency_contact;
ALTER TABLE members DROP COLUMN IF EXISTS emergency_phone;

-- Check enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'membership_status');
