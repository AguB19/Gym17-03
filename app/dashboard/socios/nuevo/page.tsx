import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MemberForm } from "@/components/dashboard/member-form"

export default async function NuevoSocioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nuevo socio</h1>
        <p className="text-muted-foreground">Registra un nuevo socio en tu gimnasio</p>
      </div>

      <MemberForm availableClasses={classes || []} />
    </div>
  )
}
