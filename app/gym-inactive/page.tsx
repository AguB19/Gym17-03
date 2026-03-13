"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CreditCard, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function GymInactivePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Cuenta Suspendida</CardTitle>
          <CardDescription className="text-base mt-2">
            Tu cuenta de gimnasio se encuentra temporalmente inactiva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pago pendiente
            </h3>
            <p className="text-sm text-muted-foreground">
              Para reactivar tu cuenta y continuar usando el sistema de gestion, 
              es necesario que realices el pago mensual correspondiente.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Contactanos para regularizar tu situacion:</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>soporte@gymgestion.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>+598 99 123 456</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" onClick={handleLogout}>
              Cerrar sesion
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Una vez realizado el pago, tu cuenta sera reactivada automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
