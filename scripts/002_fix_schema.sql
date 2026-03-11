-- Fix Database Schema to match application requirements
-- This migration updates the schema to work correctly with the gym management app

-- =============================================================================
-- 1. DROP OLD TRIGGERS AND FUNCTIONS (if they exist)
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_update_member_status ON members;
DROP TRIGGER IF EXISTS trigger_update_member_after_payment ON payments;
DROP FUNCTION IF EXISTS update_member_status();
DROP FUNCTION IF EXISTS update_member_after_payment();

-- =============================================================================
-- 2. DROP OLD TABLES (in correct order due to foreign keys)
-- =============================================================================
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Drop old types if they exist
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS fee_type CASCADE;

-- =============================================================================
-- 3. GYM CONFIG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gym_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gym_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_config_select_own" ON public.gym_config 
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "gym_config_insert_own" ON public.gym_config 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "gym_config_update_own" ON public.gym_config 
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "gym_config_delete_own" ON public.gym_config 
  FOR DELETE USING (auth.uid() = owner_id);

-- =============================================================================
-- 4. CLASSES TABLE (Gym activities/disciplines)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT,
  monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_own" ON public.classes 
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "classes_insert_own" ON public.classes 
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "classes_update_own" ON public.classes 
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "classes_delete_own" ON public.classes 
  FOR DELETE USING (auth.uid() = created_by);

-- =============================================================================
-- 5. MEMBERS TABLE (Gym members/clients)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ci TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'al_dia' CHECK (status IN ('al_dia', 'vencido', 'inactivo')),
  registration_date DATE DEFAULT CURRENT_DATE,
  membership_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_own" ON public.members 
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "members_insert_own" ON public.members 
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "members_update_own" ON public.members 
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "members_delete_own" ON public.members 
  FOR DELETE USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_members_ci ON public.members(ci);
CREATE INDEX IF NOT EXISTS idx_members_created_by ON public.members(created_by);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);

-- =============================================================================
-- 6. MEMBER_CLASSES TABLE (Many-to-many: members enrolled in classes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.member_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(member_id, class_id)
);

ALTER TABLE public.member_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_classes_select" ON public.member_classes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.members 
      WHERE members.id = member_classes.member_id 
      AND members.created_by = auth.uid()
    )
  );
CREATE POLICY "member_classes_insert" ON public.member_classes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members 
      WHERE members.id = member_classes.member_id 
      AND members.created_by = auth.uid()
    )
  );
CREATE POLICY "member_classes_update" ON public.member_classes 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.members 
      WHERE members.id = member_classes.member_id 
      AND members.created_by = auth.uid()
    )
  );
CREATE POLICY "member_classes_delete" ON public.member_classes 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.members 
      WHERE members.id = member_classes.member_id 
      AND members.created_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_member_classes_member_id ON public.member_classes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_classes_class_id ON public.member_classes(class_id);

-- =============================================================================
-- 7. PAYMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments 
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "payments_insert_own" ON public.payments 
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "payments_update_own" ON public.payments 
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "payments_delete_own" ON public.payments 
  FOR DELETE USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON public.payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON public.payments(year, month);

-- =============================================================================
-- 8. NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'membership_expiry', 'general')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications 
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "notifications_insert_own" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "notifications_update_own" ON public.notifications 
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "notifications_delete_own" ON public.notifications 
  FOR DELETE USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
