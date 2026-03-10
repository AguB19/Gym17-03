-- Drop old tables and types if they exist
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS member_classes CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS gym_config CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS fee_type CASCADE;

-- Enum for membership status
CREATE TYPE membership_status AS ENUM ('al_dia', 'vencido', 'inactivo');

-- Gym Configuration table
CREATE TABLE IF NOT EXISTS gym_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id)
);

-- Classes table (Clases que ofrece el gimnasio)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10, 2) NOT NULL,
  schedule TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members (Socios) table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  phone TEXT,
  email TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status membership_status NOT NULL DEFAULT 'al_dia',
  membership_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Member Classes (Relación muchos-a-muchos: socios ↔ clases)
CREATE TABLE IF NOT EXISTS member_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(member_id, class_id)
);

-- Payments (Pagos mensuales)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(member_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE gym_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gym_config table
CREATE POLICY "Allow authenticated users to view gym_config" 
  ON gym_config FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert gym_config" 
  ON gym_config FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update gym_config" 
  ON gym_config FOR UPDATE 
  TO authenticated 
  USING (true);

-- RLS Policies for classes table
CREATE POLICY "Allow authenticated users to view classes" 
  ON classes FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert classes" 
  ON classes FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update classes" 
  ON classes FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete classes" 
  ON classes FOR DELETE 
  TO authenticated 
  USING (true);

-- RLS Policies for members table
CREATE POLICY "Allow authenticated users to view members" 
  ON members FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert members" 
  ON members FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update members" 
  ON members FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete members" 
  ON members FOR DELETE 
  TO authenticated 
  USING (true);

-- RLS Policies for member_classes table
CREATE POLICY "Allow authenticated users to view member_classes" 
  ON member_classes FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert member_classes" 
  ON member_classes FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update member_classes" 
  ON member_classes FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete member_classes" 
  ON member_classes FOR DELETE 
  TO authenticated 
  USING (true);

-- RLS Policies for payments table
CREATE POLICY "Allow authenticated users to view payments" 
  ON payments FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert payments" 
  ON payments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payments" 
  ON payments FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete payments" 
  ON payments FOR DELETE 
  TO authenticated 
  USING (true);

-- Indexes for better query performance
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_expiry ON members(membership_expiry);
CREATE INDEX idx_member_classes_member ON member_classes(member_id);
CREATE INDEX idx_member_classes_class ON member_classes(class_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_month_year ON payments(month, year);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_gym_config_updated
  BEFORE UPDATE ON gym_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_classes_updated
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_members_updated
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to calculate member monthly total
CREATE OR REPLACE FUNCTION get_member_monthly_total(member_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(c.monthly_price), 0)
  INTO total
  FROM member_classes mc
  JOIN classes c ON c.id = mc.class_id
  WHERE mc.member_id = member_uuid AND mc.is_active = true AND c.is_active = true;
  RETURN total;
END;
$$ LANGUAGE plpgsql;
