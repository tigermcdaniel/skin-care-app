import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DailyCheckIn } from "@/components/daily-check-in"
import { GlobalNavigation } from "@/components/global-navigation"

export default async function CheckInPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get today's check-in if it exists
  const today = new Date().toISOString().split("T")[0]
  const { data: todayCheckin } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single()

  return (
    <>
      <GlobalNavigation />

      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-charcoal-900 mb-4">Daily Reflection</h1>
            <p className="text-charcoal-600 text-lg leading-relaxed">
              Document your skin's journey with mindful observation and care
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <DailyCheckIn existingCheckin={todayCheckin} userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}
