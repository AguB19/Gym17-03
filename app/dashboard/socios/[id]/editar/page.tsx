import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MemberForm } from "@/components/dashboard/member-form"

interface EditMemberPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: member } = await supabase
    .from("members")
    .select(`
      *,
      member_classes (
        id,
        class_id,
        is_active
      )
    `)
    .eq("id", id)
    .single()

  if (!member) {
    notFound()
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar socio</h1>
        <p className="text-muted-foreground">Modifica los datos del socio</p>
      </div>

      <MemberForm member={member} availableClasses={classes || []} />
    </div>
  )
}
