"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User as UserIcon } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // 🔎 chequeo automático del estado del gimnasio
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("gym_config")
        .select("is_active")
        .eq("owner_id", user.id)
        .single()

      if (!data?.is_active) {
        await supabase.auth.signOut()
        router.push("/auth/login")
        router.refresh()
      }
    }, 60000) // cada 60 segundos

    return () => clearInterval(interval)
  }, [router, supabase, user.id])

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-end px-4 lg:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden sm:inline text-sm">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}