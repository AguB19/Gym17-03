"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError, FieldSet, FieldLegend } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import type { GymClass, Member } from "@/lib/types"
import { Users } from "lucide-react"

interface MemberWithClasses extends Member {
  member_classes?: Array<{
    id: string
    class_id: string
    is_active: boolean
  }>
}

interface MemberFormProps {
  member?: MemberWithClasses
  availableClasses: GymClass[]
}

export function MemberForm({ member, availableClasses }: MemberFormProps) {
  const [firstName, setFirstName] = useState(member?.first_name || "")
  const [lastName, setLastName] = useState(member?.last_name || "")
  const [dni, setDni] = useState(member?.dni || "")
  const [email, setEmail] = useState(member?.email || "")
  const [phone, setPhone] = useState(member?.phone || "")
  const [birthDate, setBirthDate] = useState(member?.birth_date || "")
  const [address, setAddress] = useState(member?.address || "")
  const [emergencyContact, setEmergencyContact] = useState(member?.emergency_contact || "")
  const [emergencyPhone, setEmergencyPhone] = useState(member?.emergency_phone || "")
  const [notes, setNotes] = useState(member?.notes || "")
  const [isActive, setIsActive] = useState(member?.is_active ?? true)
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    member?.member_classes?.filter(mc => mc.is_active).map(mc => mc.class_id) || []
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !dni.trim()) {
      setError("Nombre, apellido y DNI son requeridos")
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("No estás autenticado")
      setLoading(false)
      return
    }

    const memberData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      dni: dni.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      birth_date: birthDate || null,
      address: address.trim() || null,
      emergency_contact: emergencyContact.trim() || null,
      emergency_phone: emergencyPhone.trim() || null,
      notes: notes.trim() || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    if (member) {
      // Update member
      const { error: updateError } = await supabase
        .from("members")
        .update(memberData)
        .eq("id", member.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Update member classes
      // First, deactivate all existing
      await supabase
        .from("member_classes")
        .update({ is_active: false })
        .eq("member_id", member.id)

      // Then, upsert selected classes
      if (selectedClasses.length > 0) {
        for (const classId of selectedClasses) {
          const existing = member.member_classes?.find(mc => mc.class_id === classId)
          if (existing) {
            await supabase
              .from("member_classes")
              .update({ is_active: true })
              .eq("id", existing.id)
          } else {
            await supabase
              .from("member_classes")
              .insert({
                member_id: member.id,
                class_id: classId,
                start_date: new Date().toISOString().split("T")[0],
                is_active: true,
              })
          }
        }
      }
    } else {
      // Insert new member
      const { data: newMember, error: insertError } = await supabase
        .from("members")
        .insert({
          user_id: user.id,
          ...memberData,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Insert member classes
      if (selectedClasses.length > 0 && newMember) {
        const memberClassesData = selectedClasses.map(classId => ({
          member_id: newMember.id,
          class_id: classId,
          start_date: new Date().toISOString().split("T")[0],
          is_active: true,
        }))

        const { error: classError } = await supabase
          .from("member_classes")
          .insert(memberClassesData)

        if (classError) {
          setError(classError.message)
          setLoading(false)
          return
        }
      }
    }

    router.push("/dashboard/socios")
    router.refresh()
  }

  const totalMonthly = availableClasses
    .filter(c => selectedClasses.includes(c.id))
    .reduce((sum, c) => sum + c.monthly_price, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {member ? "Editar socio" : "Nuevo socio"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firstName">Nombre *</FieldLabel>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Apellido *</FieldLabel>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="dni">DNI *</FieldLabel>
                <Input
                  id="dni"
                  placeholder="12345678"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
            </div>

            <Field>
              <FieldLabel htmlFor="address">Dirección</FieldLabel>
              <Input
                id="address"
                placeholder="Calle 123, Ciudad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="emergencyContact">Contacto de emergencia</FieldLabel>
                <Input
                  id="emergencyContact"
                  placeholder="María Pérez"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="emergencyPhone">Teléfono de emergencia</FieldLabel>
                <Input
                  id="emergencyPhone"
                  placeholder="+54 11 9876-5432"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </Field>
            </div>

            {availableClasses.length > 0 && (
              <FieldSet>
                <FieldLegend>Clases inscriptas</FieldLegend>
                <div className="space-y-3 mt-2">
                  {availableClasses.map((gymClass) => (
                    <label
                      key={gymClass.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedClasses.includes(gymClass.id)}
                        onCheckedChange={() => handleClassToggle(gymClass.id)}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{gymClass.name}</span>
                        {gymClass.description && (
                          <p className="text-sm text-muted-foreground">{gymClass.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-primary">
                        ${gymClass.monthly_price.toLocaleString("es-AR")}/mes
                      </span>
                    </label>
                  ))}
                </div>
                {selectedClasses.length > 0 && (
                  <p className="text-right font-semibold text-primary mt-3">
                    Total mensual: ${totalMonthly.toLocaleString("es-AR")}
                  </p>
                )}
              </FieldSet>
            )}

            <Field>
              <FieldLabel htmlFor="notes">Notas</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre el socio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </Field>

            <Field className="flex items-center justify-between">
              <FieldLabel htmlFor="isActive" className="mb-0">Socio activo</FieldLabel>
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
                {loading ? "Guardando..." : member ? "Actualizar" : "Registrar socio"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
