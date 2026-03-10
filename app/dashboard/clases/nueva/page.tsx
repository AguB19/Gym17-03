import { ClassForm } from "@/components/dashboard/class-form"

export default function NuevaClasePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nueva clase</h1>
        <p className="text-muted-foreground">Agrega una nueva clase a tu gimnasio</p>
      </div>

      <ClassForm />
    </div>
  )
}
