"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Pencil, Trash2, CreditCard, Search, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface MemberWithStatus {
  id: string
  first_name: string
  last_name: string
  ci: string
  email: string | null
  phone: string | null
  status: "al_dia" | "vencido" | "inactivo"
  hasPaidThisMonth: boolean
  monthlyTotal: number
  member_classes: Array<{
    id: string
    is_active: boolean
    class: {
      id: string
      name: string
      monthly_price: number
    } | null
  }>
}

interface MembersListProps {
  members: MemberWithStatus[]
}

export function MembersList({ members }: MembersListProps) {
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filteredMembers = members.filter(member => {
    const searchLower = search.toLowerCase()
    return (
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      member.ci.includes(search) ||
      member.email?.toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)

    await supabase.from("members").delete().eq("id", deleteId)

    setDeleteId(null)
    setLoading(false)
    router.refresh()
  }

  const getStatusBadge = (member: MemberWithStatus) => {
    if (member.status === "inactivo") {
      return <Badge variant="secondary">Inactivo</Badge>
    }
    
    // If member has no classes, they're considered "al_dia" (nothing to pay)
    const hasActiveClasses = member.member_classes?.some(mc => mc.is_active && mc.class)
    
    if (!hasActiveClasses) {
      return (
        <Badge className="bg-muted text-muted-foreground border-0">
          Sin clases
        </Badge>
      )
    }
    
    if (member.status === "vencido" || !member.hasPaidThisMonth) {
      return (
        <Badge variant="destructive" className="bg-yellow-500/20 text-yellow-500 border-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      )
    }
    return (
      <Badge className="bg-primary/20 text-primary border-0">
        <CheckCircle className="h-3 w-3 mr-1" />
        Al día
      </Badge>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, CI o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className={member.status === "inactivo" ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">
                      {member.last_name}, {member.first_name}
                    </h3>
                    {getStatusBadge(member)}
                  </div>
                  <p className="text-sm text-muted-foreground">CI: {member.ci}</p>
                  {member.email && (
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  )}
                  {member.member_classes && member.member_classes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.member_classes
                        .filter(mc => mc.is_active && mc.class)
                        .map(mc => (
                          <Badge key={mc.id} variant="outline" className="text-xs">
                            {mc.class?.name}
                          </Badge>
                        ))}
                    </div>
                  )}
                  {member.monthlyTotal > 0 && (
                    <p className="text-sm font-medium text-primary mt-2">
                      Total mensual: ${member.monthlyTotal.toLocaleString("es-UY")}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/socios/${member.id}/editar`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    {!member.hasPaidThisMonth && member.status !== "inactivo" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/pagos/nuevo?socio=${member.id}`}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Registrar pago
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(member.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && search && (
        <p className="text-center text-muted-foreground py-8">
          No se encontraron socios con "{search}"
        </p>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar socio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el socio y todo su historial de pagos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
