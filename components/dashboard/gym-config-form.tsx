"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { GymConfig } from "@/lib/types"
import { Settings } from "lucide-react"

interface GymConfigFormProps {
  gymConfig: GymConfig | null
}

export function GymConfigForm({ gymConfig }: GymConfigFormProps) {
  const [name, setName] = useState(gymConfig?.name || "")
  const [address, setAddress] = useState(gymConfig?.address || "")
  const [phone, setPhone] = useState(gymConfig?.phone || "")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError("El nombre del gimnasio es requerido")
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("No estás autenticado")
      setLoading(false)
      return
    }

    if (gymConfig) {
      // Update
      const { error } = await supabase
        .from("gym_config")
        .update({
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gymConfig.id)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      // Insert
      const { error } = await supabase
        .from("gym_config")
        .insert({
          user_id: user.id,
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
        })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Datos del gimnasio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nombre del gimnasio *</FieldLabel>
              <Input
                id="name"
                placeholder="Gimnasio Fitness Pro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Dirección</FieldLabel>
              <Input
                id="address"
                placeholder="Av. Principal 123, Ciudad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
              <Input
                id="phone"
                placeholder="+54 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : gymConfig ? "Actualizar" : "Guardar y continuar"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
