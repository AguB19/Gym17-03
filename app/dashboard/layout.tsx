import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: gymConfig, error } = await supabase
    .from("gym_config")
    .select("name, is_active")
    .eq("owner_id", user.id)
    .single()


  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar gymName={gymConfig.name} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}