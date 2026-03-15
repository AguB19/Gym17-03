"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Dumbbell } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!supabase) {
      setError("Error de conexión. Por favor, recarga la página.")
      setLoading(false)
      return
    }

    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un email válido")
      setLoading(false)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("Email o contraseña incorrectos")
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Por favor confirma tu email antes de iniciar sesión")
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    // 🔎 Verificar estado del gimnasio
    const { data: gymConfig, error: gymError } = await supabase
      .from("gym_config")
      .select("is_active")
      .eq("owner_id", authData.user.id)
      .single()

    if (gymError || !gymConfig || !gymConfig.is_active) {
      await supabase.auth.signOut()
      setError("Acceso denegado.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">GymAdmin</CardTitle>
          <CardDescription>Inicia sesión para administrar tu gimnasio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/registro" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}