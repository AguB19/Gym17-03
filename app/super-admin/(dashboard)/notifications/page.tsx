'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

interface WhatsAppNotification {
  id: string
  member_id: string
  phone_number: string
  message_content: string
  notification_type: 'payment_reminder' | 'payment_overdue'
  status: 'pending' | 'sent' | 'failed'
  twilio_sid: string | null
  error_message: string | null
  created_at: string
  members: {
    first_name: string
    last_name: string
  } | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .select(`
        *,
        members (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter(n => {
    const searchLower = search.toLowerCase()
    const memberName = n.members 
      ? `${n.members.first_name} ${n.members.last_name}`.toLowerCase()
      : ''
    return (
      memberName.includes(searchLower) ||
      n.phone_number.includes(search) ||
      n.notification_type.includes(searchLower)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Enviado</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Fallido</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'payment_reminder' 
      ? <Badge variant="outline" className="border-blue-500 text-blue-700">Recordatorio</Badge>
      : <Badge variant="outline" className="border-orange-500 text-orange-700">Vencido</Badge>
  }

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notificaciones WhatsApp</h1>
        <p className="text-muted-foreground mt-1">Historial de notificaciones enviadas a socios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exitosas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fallidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Historial de Mensajes
          </CardTitle>
          <CardDescription>
            Ultimas 100 notificaciones enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay notificaciones registradas
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {notification.members 
                          ? `${notification.members.first_name} ${notification.members.last_name}`
                          : 'Usuario eliminado'}
                      </span>
                      {getStatusBadge(notification.status)}
                      {getTypeBadge(notification.notification_type)}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.phone_number}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message_content}
                    </p>
                    {notification.error_message && (
                      <p className="text-sm text-red-600">Error: {notification.error_message}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(notification.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
