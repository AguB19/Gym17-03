"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

interface PaymentFiltersProps {
  selectedMonth: number
  selectedYear: number
}

export function PaymentFilters({ selectedMonth, selectedYear }: PaymentFiltersProps) {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleFilterChange = (month: string, year: string) => {
    router.push(`/dashboard/pagos?mes=${month}&anio=${year}`)
  }

  return (
    <div className="flex gap-4">
      <Select
        value={selectedMonth.toString()}
        onValueChange={(month) => handleFilterChange(month, selectedYear.toString())}
      >
        <SelectTrigger className="w-[180px]">
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

      <Select
        value={selectedYear.toString()}
        onValueChange={(year) => handleFilterChange(selectedMonth.toString(), year)}
      >
        <SelectTrigger className="w-[120px]">
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
    </div>
  )
}
