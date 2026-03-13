import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_ID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function GET() {
  try {
    const today = new Date()
    const day = today.getDate()

    // Solo ejecutar el día 10 o el día 5 (5 días antes del 10)
    if (day !== 10 && day !== 5) {
      return NextResponse.json({ message: 'No es día de notificaciones' })
    }

    // Traer todos los socios con teléfono
    const { data: members, error } = await supabase
      .from('members')
      .select('first_name, last_name, phone')
      .not('phone', 'is', null)

    if (error) throw error

    const results = []

    for (const member of members) {
      let message = ''

      if (day === 5) {
        message = `Hola ${member.first_name}! ⚠️ Tu cuota vence el día 10. Recordá ponerte al día para seguir entrenando.`
      } else if (day === 10) {
        message = `Hola ${member.first_name}! ⚠️ Tu cuota está vencida. Contactate con el gimnasio para regularizar tu situación.`
      }

      const result = await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${member.phone}`,
        body: message
      })

      results.push({ member: member.first_name, sid: result.sid })
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      results
    })

  } catch (error) {
    console.error('Error enviando notificaciones:', error)
    return NextResponse.json({ error: 'Error enviando notificaciones' }, { status: 500 })
  }
}