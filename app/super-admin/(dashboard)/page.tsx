import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, CheckCircle, XCircle } from "lucide-react"
import { GymsList } from "@/components/super-admin/gyms-list"

export default async function SuperAdminDashboard() {
  const supabase = await createClient()

  // Get all gyms with stats
  const { data: gyms, error } = await supabase
    .from("gym_config")
    .select(`
      id,
      name,
      email,
      phone,
      is_active,
      created_at,
      owner_id
    `)
    .order("created_at", { ascending: false })

  const totalGyms = gyms?.length || 0
  const activeGyms = gyms?.filter(g => g.is_active).length || 0
  const inactiveGyms = gyms?.filter(g => !g.is_active).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administracion</h1>
        <p className="text-muted-foreground">
          Gestiona todos los gimnasios registrados en la plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gimnasios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGyms}</div>
            <p className="text-xs text-muted-foreground">
              Gimnasios registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeGyms}</div>
            <p className="text-xs text-muted-foreground">
              Con acceso habilitado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveGyms}</div>
            <p className="text-xs text-muted-foreground">
              Con acceso suspendido
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gimnasios Registrados</CardTitle>
          <CardDescription>
            Activa o desactiva el acceso de cada gimnasio a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GymsList gyms={gyms || []} />
        </CardContent>
      </Card>
    </div>
  )
}
