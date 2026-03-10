import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ClassForm } from "@/components/dashboard/class-form"

interface EditClassPageProps {
  params: Promise<{ id: string }>
}

export default async function EditClassPage({ params }: EditClassPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: gymClass } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .single()

  if (!gymClass) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar clase</h1>
        <p className="text-muted-foreground">Modifica los datos de la clase</p>
      </div>

      <ClassForm gymClass={gymClass} />
    </div>
  )
}
