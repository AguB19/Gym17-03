"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MessageCircle, Phone, Send } from "lucide-react"

interface OverdueMember {
  id: string
  first_name: string
  last_name: string
  ci: string
  phone: string | null
  monthly_total: number
}

interface OverdueMembersListProps {
  members: OverdueMember[]
  gymName: string
  month: string
  year: number
}

export function OverdueMembersList({ members, gymName, month, year }: OverdueMembersListProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  const toggleMember = (id: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMembers(newSelected)
  }

  const selectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)))
    }
  }

  const generateWhatsAppLink = (member: OverdueMember) => {
    if (!member.phone) return null
    
    // Clean phone number (remove spaces, dashes, etc.)
    let cleanPhone = member.phone.replace(/[\s\-\(\)]/g, "")
    
    // If it doesn't start with +, assume it's a local number and add Uruguay code
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+598" + cleanPhone
    }
    
    // Remove the + for the WhatsApp URL
    cleanPhone = cleanPhone.replace("+", "")
    
    const message = encodeURIComponent(
      `Hola ${member.first_name}, te escribimos desde ${gymName}. ` +
      `Te recordamos que tu cuota de ${month} ${year} está pendiente de pago. ` +
      `El monto es de $${member.monthly_total.toLocaleString("es-UY")}. ` +
      `Cualquier consulta estamos a las órdenes. Saludos!`
    )
    
    return `https://wa.me/${cleanPhone}?text=${message}`
  }

  const openAllSelected = () => {
    const selectedList = members.filter(m => selectedMembers.has(m.id))
    selectedList.forEach((member, index) => {
      const link = generateWhatsAppLink(member)
      if (link) {
        // Open with delay to avoid browser blocking
        setTimeout(() => {
          window.open(link, "_blank")
        }, index * 500)
      }
    })
  }

  const membersWithPhone = members.filter(m => m.phone)
  const membersWithoutPhone = members.filter(m => !m.phone)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="destructive">
            {members.length} socio{members.length !== 1 ? "s" : ""} pendiente{members.length !== 1 ? "s" : ""}
          </Badge>
          {membersWithoutPhone.length > 0 && (
            <Badge variant="secondary">
              {membersWithoutPhone.length} sin teléfono
            </Badge>
          )}
        </div>
        {selectedMembers.size > 0 && (
          <Button onClick={openAllSelected} className="gap-2">
            <Send className="h-4 w-4" />
            Enviar a {selectedMembers.size} seleccionado{selectedMembers.size !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedMembers.size === membersWithPhone.length && membersWithPhone.length > 0}
                  onCheckedChange={selectAll}
                />
              </TableHead>
              <TableHead>Socio</TableHead>
              <TableHead>CI</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-24">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const whatsappLink = generateWhatsAppLink(member)
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.phone && (
                      <Checkbox 
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {member.last_name}, {member.first_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.ci}
                  </TableCell>
                  <TableCell>
                    {member.phone ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin teléfono</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${member.monthly_total.toLocaleString("es-UY")}
                  </TableCell>
                  <TableCell>
                    {whatsappLink ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                        asChild
                      >
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          Al hacer clic en WhatsApp se abrirá una conversación con un mensaje predefinido. 
          El mensaje incluye el nombre del socio, el mes pendiente y el monto a pagar.
        </p>
      </div>
    </div>
  )
}
