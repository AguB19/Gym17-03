"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Building2, Mail, Phone, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Gym {
  id: string
  name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  owner_id: string
}

interface GymsListProps {
  gyms: Gym[]
}

export function GymsList({ gyms: initialGyms }: GymsListProps) {
  const [gyms, setGyms] = useState(initialGyms)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const toggleGymStatus = async (gymId: string, currentStatus: boolean) => {
    setLoading(gymId)
    
    const { error } = await supabase
      .from("gym_config")
      .update({ is_active: !currentStatus })
      .eq("id", gymId)

    if (!error) {
      setGyms(prev => 
        prev.map(gym => 
          gym.id === gymId ? { ...gym, is_active: !currentStatus } : gym
        )
      )
    }
    
    setLoading(null)
    router.refresh()
  }

  if (gyms.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No hay gimnasios registrados</h3>
        <p className="text-muted-foreground">
          Los gimnasios apareceran aqui cuando se registren en la plataforma.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gimnasio</TableHead>
            <TableHead className="hidden md:table-cell">Contacto</TableHead>
            <TableHead className="hidden lg:table-cell">Fecha de registro</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gyms.map((gym) => (
            <TableRow key={gym.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{gym.name}</div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {gym.email || "Sin email"}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="space-y-1">
                  {gym.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{gym.email}</span>
                    </div>
                  )}
                  {gym.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{gym.phone}</span>
                    </div>
                  )}
                  {!gym.email && !gym.phone && (
                    <span className="text-sm text-muted-foreground">Sin contacto</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(gym.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={gym.is_active ? "default" : "destructive"}>
                  {gym.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {gym.is_active ? "Desactivar" : "Activar"}
                  </span>
                  <Switch
                    checked={gym.is_active}
                    onCheckedChange={() => toggleGymStatus(gym.id, gym.is_active)}
                    disabled={loading === gym.id}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
