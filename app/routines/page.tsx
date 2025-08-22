import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoutineManager } from "@/components/routine-manager"
import { GlobalNavigation } from "@/components/global-navigation"

export default async function RoutinesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's routines with steps and product details
  const { data: routines } = await supabase
    .from("routines")
    .select(`
      *,
      routine_steps (
        *,
        products (*)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get user's inventory for routine builder
  const { data: inventory } = await supabase.from("user_inventory").select("*, products(*)").eq("user_id", user.id)

  return (
    <div className="min-h-screen bg-stone-50">
      <GlobalNavigation />

      <div className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-light text-stone-800 mb-4 tracking-wide">SKINCARE RITUALS</h1>
          <p className="text-stone-600 text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Curate your morning and evening rituals with intention. Each step, thoughtfully crafted to nurture your
            skin's natural radiance and create moments of mindful self-care.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          <RoutineManager routines={routines || []} inventory={inventory || []} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
