import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { GlobalNavigation } from "@/components/global-navigation"

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get progress photos
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get daily check-ins for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false })

  // Get user goals
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <GlobalNavigation />

      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-stone-800 mb-4">Progress & Reflection</h1>
            <p className="text-stone-600 text-lg leading-relaxed max-w-2xl">
              Document your skincare journey with intention. Each photograph and reflection becomes part of your
              personal transformation story.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <ProgressDashboard photos={photos || []} checkins={checkins || []} goals={goals || []} userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}
