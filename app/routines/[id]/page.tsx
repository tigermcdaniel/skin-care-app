import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { RoutineViewer } from "@/components/routine-viewer"
import { GlobalNavigation } from "@/components/global-navigation"

interface RoutinePageProps {
  params: Promise<{ id: string }>
}

export default async function RoutinePage({ params }: RoutinePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get routine with steps and product details
  const { data: routine } = await supabase
    .from("routines")
    .select(`
      *,
      routine_steps (
        *,
        products (*)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!routine) {
    notFound()
  }

  // Sort routine steps by order
  if (routine.routine_steps) {
    routine.routine_steps.sort((a, b) => a.step_order - b.step_order)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <GlobalNavigation />

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <RoutineViewer routine={routine} userId={user.id} />
      </div>
    </div>
  )
}
