"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditCard } from "lucide-react"

interface MemberWithTotal {
  id: string
  first_name: string
  last_name: string
  dni: string
  monthlyTotal: number
}

interface PaymentFormProps {
  members: MemberWithTotal[]
  preselectedMemberId?: string
}

const months = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export function PaymentForm({ members, preselectedMemberId }: PaymentFormProps) {
  const now = new Date()
  const [memberId, setMemberId] = useState(preselectedMemberId || "")
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(now.toISOString().split("T")[0])
  const [periodMonth, setPeriodMonth] = useState((now.getMonth() + 1).toString())
  const [periodYear, setPeriodYear] = useState(now.getFullYear().toString())
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const selectedMember = members.find(m => m.id === memberId)
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i + 1)

  // Auto-fill amount when member is selected
  useEffect(() => {
    if (selectedMember && selectedMember.monthlyTotal > 0) {
      setAmount(selectedMember.monthlyTotal.toString())
    }
  }, [selectedMember])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!memberId) {
      setError("Selecciona un socio")
      setLoading(false)
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("El monto debe ser mayor a 0")
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("No estás autenticado")
      setLoading(false)
      return
    }

    // Check if payment already exists for this member/period
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("member_id", memberId)
      .eq("month", parseInt(periodMonth))
      .eq("year", parseInt(periodYear))
      .single()

    if (existingPayment) {
      setError(`Ya existe un pago registrado para ${months.find(m => m.value === periodMonth)?.label} ${periodYear}`)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from("payments")
      .insert({
        created_by: user.id,
        member_id: memberId,
        amount: amountNum,
        payment_date: paymentDate,
        month: parseInt(periodMonth),
        year: parseInt(periodYear),
        notes: notes.trim() || null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/pagos")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Registrar pago
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member">Socio *</FieldLabel>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un socio" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.last_name}, {member.first_name} - DNI: {member.dni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMember && selectedMember.monthlyTotal > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Cuota mensual: ${selectedMember.monthlyTotal.toLocaleString("es-AR")}
                </p>
              )}
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="periodMonth">Mes del período *</FieldLabel>
                <Select value={periodMonth} onValueChange={setPeriodMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="periodYear">Año del período *</FieldLabel>
                <Select value={periodYear} onValueChange={setPeriodYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="amount">Monto ($) *</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="paymentDate">Fecha de pago *</FieldLabel>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notas</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre el pago..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Registrar pago"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
