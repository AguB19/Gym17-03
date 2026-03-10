import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, CreditCard } from "lucide-react"
import Link from "next/link"
import { PaymentsList } from "@/components/dashboard/payments-list"
import { PaymentFilters } from "@/components/dashboard/payment-filters"

interface PaymentsPageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

export default async function PagosPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const now = new Date()
  const selectedMonth = params.mes ? parseInt(params.mes) : now.getMonth() + 1
  const selectedYear = params.anio ? parseInt(params.anio) : now.getFullYear()

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      member:members (
        id,
        first_name,
        last_name,
        dni
      )
    `)
    .eq("user_id", user.id)
    .eq("period_month", selectedMonth)
    .eq("period_year", selectedYear)
    .order("payment_date", { ascending: false })

  const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
          <p className="text-muted-foreground">Historial de pagos y registro de nuevos cobros</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pagos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Registrar pago
          </Link>
        </Button>
      </div>

      <PaymentFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Ingresos del período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              ${totalRevenue.toLocaleString("es-AR")}
            </span>
            <span className="text-muted-foreground">
              ({payments?.length || 0} pagos)
            </span>
          </div>
        </CardContent>
      </Card>

      {payments && payments.length > 0 ? (
        <PaymentsList payments={payments} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-3 rounded-full bg-primary/10 mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay pagos en este período</h3>
            <p className="text-muted-foreground text-center mb-4">
              Registra un nuevo pago para comenzar
            </p>
            <Button asChild>
              <Link href="/dashboard/pagos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Registrar pago
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
