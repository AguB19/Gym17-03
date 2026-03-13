import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import { SuperAdminHeader } from "@/components/super-admin/header"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/super-admin/login")
  }

  // Verify super admin status
  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("id, email")
    .eq("user_id", user.id)
    .single()

  if (!superAdmin) {
    redirect("/super-admin/login")
  }

  return (
    <div className="min-h-screen bg-background flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <SuperAdminHeader user={user} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
