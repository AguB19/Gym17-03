import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null

export interface WhatsAppMessage {
  to: string // Phone number with country code, e.g., "+5491123456789"
  message: string
}

export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage) {
  if (!client) {
    console.error('[Twilio] Client not initialized - missing credentials')
    return { success: false, error: 'Twilio client not initialized' }
  }

  if (!twilioWhatsAppNumber) {
    console.error('[Twilio] WhatsApp number not configured')
    return { success: false, error: 'WhatsApp number not configured' }
  }

  try {
    // Format the recipient number for WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    
    const result = await client.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: formattedTo,
    })

    console.log(`[Twilio] Message sent successfully. SID: ${result.sid}`)
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('[Twilio] Error sending message:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function sendBulkWhatsAppMessages(messages: WhatsAppMessage[]) {
  const results = await Promise.allSettled(
    messages.map(msg => sendWhatsAppMessage(msg))
  )

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - successful

  return {
    total: results.length,
    successful,
    failed,
    results,
  }
}
