export interface GymConfig {
  id: string
  owner_id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  schedule: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SuperAdmin {
  id: string
  user_id: string
  email: string
  created_at: string
}

export interface WhatsAppNotification {
  id: string
  gym_id: string
  member_id: string
  phone: string
  message: string
  notification_type: 'reminder' | 'overdue'
  status: 'sent' | 'failed' | 'pending'
  error_message: string | null
  sent_at: string
  created_at: string
}

export interface GymClass {
  id: string
  name: string
  description: string | null
  schedule: string | null
  monthly_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  created_by: string
  first_name: string
  last_name: string
  ci: string
  email: string | null
  phone: string | null
  notes: string | null
  status: "al_dia" | "vencido" | "inactivo"
  registration_date: string
  membership_expiry: string | null
  created_at: string
  updated_at: string
}

export interface MemberClass {
  id: string
  member_id: string
  class_id: string
  enrolled_at: string
  is_active: boolean
  class?: GymClass
}

export interface Payment {
  id: string
  created_by: string
  member_id: string
  amount: number
  payment_date: string
  month: number
  year: number
  notes: string | null
  created_at: string
  member?: Member
}

export interface MemberWithClasses extends Member {
  classes: MemberClass[]
  last_payment?: Payment
  monthly_total: number
}
