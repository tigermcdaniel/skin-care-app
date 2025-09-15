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

  // First, let's check ALL routines (not just active ones)
  const { data: allRoutines } = await supabase
    .from("routines")
    .select("id, name, type, is_active")
    .eq("user_id", user.id)

  console.log("[v0] All user routines:", allRoutines)

  // Get user's routines
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
    .order("type")

  console.log("[v0] Routines fetched:", routines)

  const today = new Date().toISOString().split("T")[0]
  const { data: todayCheckin } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single()

  console.log("[v0] Today's checkin:", todayCheckin)

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
            <h1 className="font-serif text-4xl text-charcoal-900 mb-4">Routine Calendar</h1>
            <p className="text-charcoal-600 text-lg leading-relaxed max-w-2xl">
              Your personal sanctuary schedule. Track daily routines, upcoming appointments, and maintain consistency in
              your skincare journey.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <div className="mb-6 p-6 bg-red-100 border-2 border-red-500 rounded text-base">
              <div className="font-bold text-red-800 mb-2">🔍 DEBUG INFO (Server-side data):</div>
              <div className="space-y-1">
                <div>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Routines count:</strong> {routines?.length || 0}
                </div>
                <div>
                  <strong>All routines count:</strong> {allRoutines?.length || 0}
                </div>
                <div>
                  <strong>Appointments count:</strong> {appointments?.length || 0}
                </div>
                <div>
                  <strong>Checkins count:</strong> {checkins?.length || 0}
                </div>
                <div>
                  <strong>Routines data:</strong>{" "}
                  <pre className="mt-1 text-xs bg-white p-2 rounded">
                    {JSON.stringify(
                      routines?.map((r) => ({
                        id: r.id,
                        name: r.name,
                        type: r.type,
                        is_active: r.is_active,
                        steps_count: r.routine_steps?.length || 0,
                      })),
                      null,
                      2,
                    ) || "[]"}
                  </pre>
                </div>
              </div>
            </div>
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
