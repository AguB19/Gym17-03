-- =============================================================================
-- FULL SCHEMA WITH GYM ACTIVATION AND SUPER ADMIN SYSTEM
-- This script creates all tables from scratch with the new activation features
-- =============================================================================

-- =============================================================================
-- 1. CLEANUP - Drop existing objects safely
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_update_member_status ON members;
DROP TRIGGER IF EXISTS trigger_update_member_after_payment ON payments;
DROP FUNCTION IF EXISTS update_member_status() CASCADE;
DROP FUNCTION IF EXISTS update_member_after_payment() CASCADE;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS member_classes CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS gym_config CASCADE;
DROP TABLE IF EXISTS fees CASCADE;

DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS fee_type CASCADE;

-- =============================================================================
-- 2. SUPER ADMINS TABLE (Platform administrators)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can view all super_admins
CREATE POLICY "super_admins_select" ON public.super_admins 
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "super_admins_insert" ON public.super_admins 
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "super_admins_delete" ON public.super_admins 
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);

-- =============================================================================
-- 3. GYM CONFIG TABLE (with is_active field)
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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gym_config ENABLE ROW LEVEL SECURITY;

-- Owners can view their own gym OR super admins can view all
CREATE POLICY "gym_config_select" ON public.gym_config 
  FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id 
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "gym_config_insert_own" ON public.gym_config 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own OR super admins can update any
CREATE POLICY "gym_config_update" ON public.gym_config 
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id 
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "gym_config_delete_own" ON public.gym_config 
  FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_gym_config_owner_id ON public.gym_config(owner_id);
CREATE INDEX IF NOT EXISTS idx_gym_config_is_active ON public.gym_config(is_active);

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
  type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'membership_expiry', 'general', 'whatsapp_reminder', 'whatsapp_overdue')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
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

-- =============================================================================
-- 9. WHATSAPP NOTIFICATION LOG TABLE (for tracking sent messages)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gym_config(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'overdue')),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  twilio_sid TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Allow gym owners to view their notifications
CREATE POLICY "whatsapp_notifications_select" ON public.whatsapp_notifications 
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_config gc 
      WHERE gc.id = whatsapp_notifications.gym_id 
      AND gc.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Allow system to insert (via service role)
CREATE POLICY "whatsapp_notifications_insert" ON public.whatsapp_notifications 
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_member_id ON public.whatsapp_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_gym_id ON public.whatsapp_notifications(gym_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_at ON public.whatsapp_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_type ON public.whatsapp_notifications(notification_type);
