import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Users, CreditCard, BarChart3 } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      redirect("/dashboard")
    }
  }

  const features = [
    {
      icon: Users,
      title: "Gestión de Socios",
      description: "Registra y administra todos los socios de tu gimnasio con información completa",
    },
    {
      icon: Dumbbell,
      title: "Clases Personalizables",
      description: "Define las clases que ofreces con sus precios mensuales",
    },
    {
      icon: CreditCard,
      title: "Control de Pagos",
      description: "Registra pagos mensuales y lleva el control de quién está al día",
    },
    {
      icon: BarChart3,
      title: "Dashboard Completo",
      description: "Visualiza estadísticas e identifica socios con pagos pendientes",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl">GymAdmin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/registro">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
          Sistema de gestión para tu{" "}
          <span className="text-primary">gimnasio</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          Administra socios, clases y pagos de forma simple y eficiente. 
          Todo lo que necesitas para gestionar tu gimnasio en un solo lugar.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/registro">Comenzar gratis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Todo lo que necesitas
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GymAdmin. Sistema de gestión de gimnasios.</p>
        </div>
      </footer>
    </div>
  )
}
