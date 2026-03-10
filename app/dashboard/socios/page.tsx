import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Users } from "lucide-react"
import Link from "next/link"
import { MembersList } from "@/components/dashboard/members-list"

export default async function SociosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: members } = await supabase
    .from("members")
    .select(`
      *,
      member_classes (
        id,
        class_id,
        start_date,
        is_active,
        class:classes (
          id,
          name,
          monthly_price
        )
      )
    `)
    .eq("user_id", user.id)
    .order("last_name")

  // Get payments for current month to determine status
  const now = new Date()
  const { data: currentPayments } = await supabase
    .from("payments")
    .select("member_id")
    .eq("user_id", user.id)
    .eq("period_month", now.getMonth() + 1)
    .eq("period_year", now.getFullYear())

  const paidMemberIds = new Set(currentPayments?.map(p => p.member_id) || [])

  // Add status to members
  const membersWithStatus = members?.map(member => ({
    ...member,
    hasPaidThisMonth: paidMemberIds.has(member.id),
    monthlyTotal: member.member_classes
      ?.filter((mc: { is_active: boolean }) => mc.is_active)
      .reduce((sum: number, mc: { class: { monthly_price: number } | null }) => sum + (mc.class?.monthly_price || 0), 0) || 0
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Socios</h1>
          <p className="text-muted-foreground">Administra los socios de tu gimnasio</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/socios/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo socio
          </Link>
        </Button>
      </div>

      {membersWithStatus.length > 0 ? (
        <MembersList members={membersWithStatus} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-3 rounded-full bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay socios registrados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega tu primer socio para comenzar a gestionar tu gimnasio
            </p>
            <Button asChild>
              <Link href="/dashboard/socios/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer socio
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
