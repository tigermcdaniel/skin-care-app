import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlobalNavigation } from "@/components/global-navigation"
import { SkincareCalendar } from "@/components/skincare-calendar"

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's active routines
  const { data: routines } = await supabase
    .from("routines")
    .select(`
      id,
      name,
      type,
      is_active,
      routine_steps (
        id,
        step_order,
        instructions,
        products (
          name,
          brand
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("type")

  // Get upcoming appointments (next 3 months)
  const threeMonthsFromNow = new Date()
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .gte("scheduled_date", new Date().toISOString())
    .lte("scheduled_date", threeMonthsFromNow.toISOString())
    .order("scheduled_date")

  // Get recent check-ins (last 3 months for routine completion tracking)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", threeMonthsAgo.toISOString().split("T")[0])
    .order("date", { ascending: false })

  return (
    <>
      <GlobalNavigation />

      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-charcoal-900 mb-4">Ritual Calendar</h1>
            <p className="text-charcoal-600 text-lg leading-relaxed max-w-2xl">
              Your personal sanctuary schedule. Track daily rituals, upcoming appointments, and maintain consistency in
              your skincare journey.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <SkincareCalendar
              routines={routines || []}
              appointments={appointments || []}
              checkins={checkins || []}
              userId={user.id}
            />
          </div>
        </div>
      </div>
    </>
  )
}
