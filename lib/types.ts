export interface GymConfig {
  id: string
  user_id: string
  name: string
  address: string | null
  phone: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface GymClass {
  id: string
  user_id: string
  name: string
  description: string | null
  monthly_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  user_id: string
  first_name: string
  last_name: string
  dni: string
  email: string | null
  phone: string | null
  birth_date: string | null
  address: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemberClass {
  id: string
  member_id: string
  class_id: string
  start_date: string
  is_active: boolean
  created_at: string
  class?: GymClass
}

export interface Payment {
  id: string
  user_id: string
  member_id: string
  amount: number
  payment_date: string
  period_month: number
  period_year: number
  notes: string | null
  created_at: string
  member?: Member
}

export type MemberStatus = "al_dia" | "vencido" | "inactivo"

export interface MemberWithStatus extends Member {
  status: MemberStatus
  classes: MemberClass[]
  last_payment?: Payment
  monthly_total: number
}
