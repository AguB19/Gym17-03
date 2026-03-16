import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/twilio"

// API para probar el envío de WhatsApp manualmente
// Solo accesible para super admins
// POST /api/test-whatsapp
// Body: { phone: "5491123456789", message: "Mensaje de prueba" }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar que el usuario es super admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .single()
    
    if (!superAdmin) {
      return NextResponse.json({ error: "No autorizado - Solo super admins" }, { status: 403 })
    }
    
    const body = await request.json()
    const { phone, message } = body
    
    if (!phone || !message) {
      return NextResponse.json({ 
        error: "Se requiere phone y message en el body",
        example: {
          phone: "5491123456789",
          message: "Hola! Este es un mensaje de prueba."
        }
      }, { status: 400 })
    }
    
    // Formatear el número - quitar caracteres no numéricos y agregar + si no lo tiene
    const cleanPhone = phone.replace(/\D/g, "")
    const formattedPhone = cleanPhone.startsWith("0")
      ? "+598" + cleanPhone.slice(1)
      : "+" + cleanPhone
    
    const result = await sendWhatsAppMessage({ to: formattedPhone, message })
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Mensaje enviado correctamente",
      sid: result.sid,
      to: formattedPhone
    })
    
  } catch (error) {
    console.error("Error enviando mensaje de prueba:", error)
    return NextResponse.json({ 
      error: "Error enviando mensaje",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
