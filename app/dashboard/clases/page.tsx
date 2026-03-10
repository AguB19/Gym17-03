import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Dumbbell } from "lucide-react"
import Link from "next/link"
import { ClassesList } from "@/components/dashboard/classes-list"

export default async function ClasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clases</h1>
          <p className="text-muted-foreground">Administra las clases y precios de tu gimnasio</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clases/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva clase
          </Link>
        </Button>
      </div>

      {classes && classes.length > 0 ? (
        <ClassesList classes={classes} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-3 rounded-full bg-primary/10 mb-4">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay clases registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega las clases que ofrece tu gimnasio con sus precios mensuales
            </p>
            <Button asChild>
              <Link href="/dashboard/clases/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera clase
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
