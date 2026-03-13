-- Add is_active column to gym_config table
ALTER TABLE gym_config 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add user_id column to gym_config if it doesn't exist (for consistency)
ALTER TABLE gym_config 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update user_id from owner_id where user_id is null
UPDATE gym_config SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- Create super_admins table to track platform administrators
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS on super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can view all super_admins (only super admins can access this table)
CREATE POLICY "Super admins can view super_admins"
  ON super_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()
    )
  );

-- Super admins can manage super_admins
CREATE POLICY "Super admins can insert super_admins"
  ON super_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can delete super_admins"
  ON super_admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()
    )
  );

-- Allow super admins to view all gym_config records
CREATE POLICY "Super admins can view all gym_config"
  ON gym_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()
    )
    OR owner_id = auth.uid()
    OR user_id = auth.uid()
  );

-- Allow super admins to update any gym_config (for activation/deactivation)
CREATE POLICY "Super admins can update all gym_config"
  ON gym_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()
    )
    OR owner_id = auth.uid()
    OR user_id = auth.uid()
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gym_config_is_active ON gym_config(is_active);
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);
