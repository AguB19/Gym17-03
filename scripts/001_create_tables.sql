-- Gym Management System Database Schema

-- Enum for membership status
CREATE TYPE membership_status AS ENUM ('al_dia', 'vencido', 'inactivo');

-- Enum for fee types
CREATE TYPE fee_type AS ENUM ('mensual', 'trimestral', 'pase_diario');

-- Members (Socios) table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status membership_status NOT NULL DEFAULT 'al_dia',
  membership_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Fee types (Cuotas) table
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type fee_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments (Pagos) table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES fees(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for fees table
CREATE POLICY "Allow authenticated users to view fees" 
  ON fees FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert fees" 
  ON fees FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update fees" 
  ON fees FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete fees" 
  ON fees FOR DELETE 
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
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Function to update member status based on expiry date
CREATE OR REPLACE FUNCTION update_member_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on membership_expiry
  IF NEW.membership_expiry IS NOT NULL THEN
    IF NEW.membership_expiry >= CURRENT_DATE THEN
      NEW.status = 'al_dia';
    ELSE
      NEW.status = 'vencido';
    END IF;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update member status
CREATE TRIGGER trigger_update_member_status
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_member_status();

-- Function to update member expiry after payment
CREATE OR REPLACE FUNCTION update_member_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE members
  SET 
    membership_expiry = NEW.period_end,
    status = 'al_dia',
    updated_at = NOW()
  WHERE id = NEW.member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update member after payment insert
CREATE TRIGGER trigger_update_member_after_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_after_payment();
