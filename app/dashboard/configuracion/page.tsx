import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GymConfigForm } from "@/components/dashboard/gym-config-form"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: gymConfig } = await supabase
    .from("gym_config")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración del gimnasio</h1>
        <p className="text-muted-foreground">
          {gymConfig ? "Actualiza los datos de tu gimnasio" : "Configura los datos de tu gimnasio para comenzar"}
        </p>
      </div>

      <GymConfigForm gymConfig={gymConfig} />
    </div>
  )
}
