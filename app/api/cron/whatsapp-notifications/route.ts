import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/twilio'

// Use service role for cron jobs to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[Cron] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const today = new Date()
  const dayOfMonth = today.getDate()
  
  console.log(`[Cron] Running WhatsApp notifications for day ${dayOfMonth}`)

  // Only run on day 5 (reminder) or day 10 (overdue)
  if (dayOfMonth !== 5 && dayOfMonth !== 10) {
    console.log('[Cron] Not a notification day, skipping')
    return NextResponse.json({ 
      message: 'Not a notification day',
      day: dayOfMonth 
    })
  }

  try {
    // Get all active gyms
    const { data: activeGyms, error: gymsError } = await supabase
      .from('gym_config')
      .select('id, owner_id')
      .eq('is_active', true)

    if (gymsError) {
      console.error('[Cron] Error fetching active gyms:', gymsError)
      return NextResponse.json({ error: 'Error fetching gyms' }, { status: 500 })
    }

    if (!activeGyms || activeGyms.length === 0) {
      console.log('[Cron] No active gyms found')
      return NextResponse.json({ message: 'No active gyms' })
    }

    const gymOwnerIds = activeGyms.map(g => g.owner_id)

    // Get all active members from active gyms with phone numbers
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, first_name, phone, owner_id, status')
      .in('owner_id', gymOwnerIds)
      .eq('status', 'active')
      .not('phone', 'is', null)

    if (membersError) {
      console.error('[Cron] Error fetching members:', membersError)
      return NextResponse.json({ error: 'Error fetching members' }, { status: 500 })
    }

    if (!members || members.length === 0) {
      console.log('[Cron] No active members with phone numbers found')
      return NextResponse.json({ message: 'No members to notify' })
    }

    console.log(`[Cron] Found ${members.length} members to notify`)

    // Determine message based on day
    const messageTemplate = dayOfMonth === 5
      ? (name: string) => `Hola ${name}! ⚠️ Tu cuota vence el día 10. Recordá ponerte al día para seguir entrenando.`
      : (name: string) => `Hola ${name}! ⚠️ Tu cuota está vencida. Contactate con el gimnasio para regularizar tu situación.`

    const notificationType = dayOfMonth === 5 ? 'payment_reminder' : 'payment_overdue'

    // Send messages and track results
    const results = {
      total: members.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const member of members) {
      if (!member.phone) continue

      const message = messageTemplate(member.first_name)
      
      // Send WhatsApp message
      const sendResult = await sendWhatsAppMessage({
        to: member.phone,
        message,
      })

      // Log notification to database
      await supabase.from('whatsapp_notifications').insert({
        member_id: member.id,
        gym_owner_id: member.owner_id,
        phone_number: member.phone,
        message_content: message,
        notification_type: notificationType,
        status: sendResult.success ? 'sent' : 'failed',
        twilio_sid: sendResult.success ? sendResult.sid : null,
        error_message: sendResult.success ? null : sendResult.error,
      })

      if (sendResult.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push(`${member.first_name}: ${sendResult.error}`)
      }

      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`[Cron] Notifications complete: ${results.sent} sent, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      day: dayOfMonth,
      notificationType,
      results,
    })

  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
