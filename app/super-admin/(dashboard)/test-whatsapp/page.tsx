"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Send, MessageSquare } from "lucide-react"

export default function TestWhatsAppPage() {
  const [phone, setPhone] = useState("59891368463")
  const [message, setMessage] = useState("Hola! Este es un mensaje de prueba desde el sistema de gestión de gimnasios.")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSend = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: `Mensaje enviado correctamente. SID: ${data.sid}` })
      } else {
        setResult({ success: false, message: data.error || "Error al enviar el mensaje" })
      }
    } catch (error) {
      setResult({ success: false, message: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Probar WhatsApp</h1>
        <p className="text-muted-foreground">
          Envía mensajes de prueba para verificar la integración con Twilio
        </p>
      </div>

      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertTitle>Importante: Twilio Sandbox</AlertTitle>
        <AlertDescription>
          Para recibir mensajes del sandbox de Twilio, primero debes enviar un mensaje desde tu WhatsApp 
          al número <strong>+1 415 523 8886</strong> con el texto <strong>join [palabra-clave]</strong>.
          La palabra clave está en tu cuenta de Twilio en la sección WhatsApp Sandbox.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Enviar mensaje de prueba</CardTitle>
          <CardDescription>
            Ingresa el número de teléfono y el mensaje a enviar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de teléfono (sin + ni espacios)</Label>
            <Input
              id="phone"
              placeholder="59891368463"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Ejemplo: 59891368463 (Uruguay), 5491123456789 (Argentina)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              placeholder="Escribe tu mensaje aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSend} disabled={loading || !phone || !message}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Enviar mensaje"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
