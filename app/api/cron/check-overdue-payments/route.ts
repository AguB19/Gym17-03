import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Verify cron secret in production (optional but recommended)
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret is set
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get all active members
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select(`
      id,
      first_name,
      last_name,
      ci,
      phone,
      member_classes (
        is_active,
        class:classes (
          monthly_price
        )
      )
    `)
    .neq("status", "inactivo")

  if (membersError) {
    console.error("Error fetching members:", membersError)
    return NextResponse.json({ error: "Error fetching members" }, { status: 500 })
  }

  // Get payments for current month
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("member_id")
    .eq("month", currentMonth)
    .eq("year", currentYear)

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError)
    return NextResponse.json({ error: "Error fetching payments" }, { status: 500 })
  }

  const paidMemberIds = new Set(payments?.map(p => p.member_id) || [])

  // Filter members who haven't paid and have active classes
  const overdueMembers = (members || [])
    .filter(member => {
      const hasActiveClasses = member.member_classes?.some(mc => mc.is_active)
      const hasPaid = paidMemberIds.has(member.id)
      return hasActiveClasses && !hasPaid
    })
    .map(member => {
      const monthlyTotal = member.member_classes
        ?.filter(mc => mc.is_active)
        .reduce((sum, mc) => sum + (mc.class?.monthly_price || 0), 0) || 0
      
      return {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        ci: member.ci,
        phone: member.phone,
        monthly_total: monthlyTotal,
      }
    })

  // Store the overdue check result
  const { error: logError } = await supabase
    .from("overdue_notifications")
    .insert({
      month: currentMonth,
      year: currentYear,
      members_count: overdueMembers.length,
      members_data: overdueMembers,
    })

  if (logError) {
    // Table might not exist, that's ok for now
    console.log("Could not log notification:", logError.message)
  }

  return NextResponse.json({
    success: true,
    month: currentMonth,
    year: currentYear,
    overdue_count: overdueMembers.length,
    overdue_members: overdueMembers,
  })
}
