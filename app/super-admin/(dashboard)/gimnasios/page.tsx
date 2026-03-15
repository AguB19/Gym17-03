'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw, Building2 } from 'lucide-react'

interface Gym {
  owner_id: string
  is_active: boolean
  created_at: string
}

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const fetchGyms = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('gym_config')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setGyms(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchGyms()
  }, [])

  const filteredGyms = gyms.filter((gym) =>
    gym.owner_id.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: gyms.length,
    active: gyms.filter(g => g.is_active).length,
    inactive: gyms.filter(g => !g.is_active).length,
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground">Gimnasios</h1>
        <p className="text-muted-foreground mt-1">
          Gestión de gimnasios registrados en la plataforma
        </p>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>

      </div>

      {/* Search */}

      <div className="flex gap-4">

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Buscar por owner id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={fetchGyms} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>

      </div>

      {/* Lista */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de gimnasios
          </CardTitle>
          <CardDescription>
            Todos los gimnasios registrados
          </CardDescription>
        </CardHeader>

        <CardContent>

          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>

          ) : filteredGyms.length === 0 ? (

            <div className="text-center py-8 text-muted-foreground">
              No hay gimnasios registrados
            </div>

          ) : (

            <div className="space-y-4">

              {filteredGyms.map((gym) => (

                <div
                  key={gym.owner_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >

                  <div>
                    <p className="font-medium">{gym.owner_id}</p>
                    <p className="text-sm text-muted-foreground">
                      Creado: {new Date(gym.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Badge className={gym.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {gym.is_active ? "Activo" : "Inactivo"}
                  </Badge>

                </div>

              ))}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  )
}