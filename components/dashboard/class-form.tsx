"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import type { GymClass } from "@/lib/types"
import { Dumbbell } from "lucide-react"

interface ClassFormProps {
  gymClass?: GymClass
}

export function ClassForm({ gymClass }: ClassFormProps) {
  const [name, setName] = useState(gymClass?.name || "")
  const [description, setDescription] = useState(gymClass?.description || "")
  const [monthlyPrice, setMonthlyPrice] = useState(gymClass?.monthly_price?.toString() || "")
  const [isActive, setIsActive] = useState(gymClass?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError("El nombre de la clase es requerido")
      setLoading(false)
      return
    }

    const price = parseFloat(monthlyPrice)
    if (isNaN(price) || price <= 0) {
      setError("El precio debe ser un número mayor a 0")
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("No estás autenticado")
      setLoading(false)
      return
    }

    if (gymClass) {
      const { error } = await supabase
        .from("classes")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          monthly_price: price,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gymClass.id)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase
        .from("classes")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          monthly_price: price,
          is_active: isActive,
        })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push("/dashboard/clases")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          {gymClass ? "Editar clase" : "Nueva clase"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nombre de la clase *</FieldLabel>
              <Input
                id="name"
                placeholder="Spinning, Sala de musculación, Yoga..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea
                id="description"
                placeholder="Descripción opcional de la clase..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="monthlyPrice">Precio mensual ($) *</FieldLabel>
              <Input
                id="monthlyPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                required
              />
            </Field>
            <Field className="flex items-center justify-between">
              <FieldLabel htmlFor="isActive" className="mb-0">Clase activa</FieldLabel>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : gymClass ? "Actualizar" : "Crear clase"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
