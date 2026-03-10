import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverdueMembersList } from "@/components/dashboard/overdue-members-list"
import { CheckOverdueButton } from "@/components/dashboard/check-overdue-button"
import { Bell } from "lucide-react"

export default async function NotificacionesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentDay = now.getDate()

  // Get all active members with their classes
  const { data: members } = await supabase
    .from("members")
    .select(`
      id,
      first_name,
      last_name,
      ci,
      phone,
      member_classes (
        is_active,
        class:classes (
          monthly_price
        )
      )
    `)
    .neq("status", "inactivo")

  // Get payments for current month
  const { data: payments } = await supabase
    .from("payments")
    .select("member_id")
    .eq("month", currentMonth)
    .eq("year", currentYear)

  const paidMemberIds = new Set(payments?.map(p => p.member_id) || [])

  // Get gym config for the message
  const { data: gymConfig } = await supabase
    .from("gym_config")
    .select("name")
    .eq("owner_id", user.id)
    .single()

  const gymName = gymConfig?.name || "el gimnasio"

  // Filter members who haven't paid and have active classes
  const overdueMembers = (members || [])
    .filter(member => {
      const hasActiveClasses = member.member_classes?.some((mc: { is_active: boolean }) => mc.is_active)
      const hasPaid = paidMemberIds.has(member.id)
      return hasActiveClasses && !hasPaid
    })
    .map(member => {
      const monthlyTotal = member.member_classes
        ?.filter((mc: { is_active: boolean }) => mc.is_active)
        .reduce((sum: number, mc: { class: { monthly_price: number } | null }) => 
          sum + (mc.class?.monthly_price || 0), 0) || 0
      
      return {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        ci: member.ci,
        phone: member.phone,
        monthly_total: monthlyTotal,
      }
    })

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notificaciones de Pago</h1>
        <p className="text-muted-foreground">
          Gestiona los recordatorios de pago para socios atrasados
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Socios con Pago Pendiente</CardTitle>
                <CardDescription>
                  {monthNames[currentMonth - 1]} {currentYear} - Día {currentDay}
                </CardDescription>
              </div>
            </div>
            <CheckOverdueButton />
          </div>
        </CardHeader>
        <CardContent>
          {currentDay < 10 && (
            <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                El recordatorio automático se enviará el día 10 de cada mes. 
                Hoy es día {currentDay}, pero puedes enviar mensajes manualmente a continuación.
              </p>
            </div>
          )}
          
          {overdueMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Todos los socios están al día con sus pagos este mes.
            </div>
          ) : (
            <OverdueMembersList 
              members={overdueMembers} 
              gymName={gymName}
              month={monthNames[currentMonth - 1]}
              year={currentYear}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
