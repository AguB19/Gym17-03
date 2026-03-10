import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PaymentForm } from "@/components/dashboard/payment-form"

interface NewPaymentPageProps {
  searchParams: Promise<{ socio?: string }>
}

export default async function NuevoPagoPage({ searchParams }: NewPaymentPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all active members with their classes
  const { data: members } = await supabase
    .from("members")
    .select(`
      id,
      first_name,
      last_name,
      dni,
      member_classes (
        id,
        is_active,
        class:classes (
          id,
          name,
          monthly_price
        )
      )
    `)
    .eq("status", "active")
    .order("last_name")

  // Calculate monthly total for each member
  const membersWithTotal = members?.map(member => ({
    ...member,
    monthlyTotal: member.member_classes
      ?.filter((mc: { is_active: boolean }) => mc.is_active)
      .reduce((sum: number, mc: { class: { monthly_price: number } | null }) => 
        sum + (mc.class?.monthly_price || 0), 0) || 0
  })) || []

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registrar pago</h1>
        <p className="text-muted-foreground">Registra el pago mensual de un socio</p>
      </div>

      <PaymentForm 
        members={membersWithTotal} 
        preselectedMemberId={params.socio}
      />
    </div>
  )
}
