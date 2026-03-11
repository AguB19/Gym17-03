import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Dumbbell, CreditCard, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    redirect("/auth/login")
  }
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if gym is configured
  const { data: gymConfig } = await supabase
    .from("gym_config")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!gymConfig) {
    redirect("/dashboard/configuracion")
  }

  // Get stats
  const { count: totalMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .neq("status", "inactivo")

  const { count: totalClasses } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Get current month payments
  const now = new Date()
  const { data: currentMonthPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("month", now.getMonth() + 1)
    .eq("year", now.getFullYear())

  const totalRevenue = currentMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0

  // Get members with no payment this month
  const { data: membersWithPayment } = await supabase
    .from("payments")
    .select("member_id")
    .eq("month", now.getMonth() + 1)
    .eq("year", now.getFullYear())

  const paidMemberIds = membersWithPayment?.map(p => p.member_id) || []

  const { data: overdueMembers } = await supabase
    .from("members")
    .select("id, first_name, last_name")
    .neq("status", "inactivo")
    .not("id", "in", paidMemberIds.length > 0 ? `(${paidMemberIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
    .limit(5)

  const stats = [
    {
      title: "Socios activos",
      value: totalMembers || 0,
      icon: Users,
      href: "/dashboard/socios",
    },
    {
      title: "Clases disponibles",
      value: totalClasses || 0,
      icon: Dumbbell,
      href: "/dashboard/clases",
    },
    {
      title: "Ingresos del mes",
      value: `$${totalRevenue.toLocaleString("es-UY")}`,
      icon: CreditCard,
      href: "/dashboard/pagos",
    },
    {
      title: "Pagos pendientes",
      value: overdueMembers?.length || 0,
      icon: AlertTriangle,
      href: "/dashboard/socios",
      variant: "warning" as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bienvenido a {gymConfig.name}</h1>
        <p className="text-muted-foreground">Resumen de tu gimnasio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.variant === "warning" ? "text-yellow-500" : "text-primary"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overdue Members */}
      {overdueMembers && overdueMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Socios con pago pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">
                    {member.first_name} {member.last_name}
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/pagos/nuevo?socio=${member.id}`}>
                      Registrar pago
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
