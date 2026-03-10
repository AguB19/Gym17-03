"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function CheckOverdueButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheck = async () => {
    setLoading(true)
    try {
      // Call the cron endpoint manually to simulate the check
      const response = await fetch("/api/cron/check-overdue-payments")
      const data = await response.json()
      
      if (data.success) {
        // Refresh the page to show updated data
        router.refresh()
      }
    } catch (error) {
      console.error("Error checking overdue payments:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleCheck}
      disabled={loading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Verificando..." : "Actualizar"}
    </Button>
  )
}
