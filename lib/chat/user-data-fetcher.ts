import { createClient } from "@/integrations/supabase/server"
import { getWeekStartDate } from "@/utils/dateUtils"
import { UserData } from "./types/api"

/**
 * Fetches comprehensive user data for chat context
 */
export async function fetchUserData(userId: string): Promise<UserData> {
  const supabase = await createClient()

  // Fetch all user data in parallel for better performance
  const [
    profileResult,
    inventoryResult,
    routinesResult,
    weeklyCheckInsResult,
    recentProgressResult,
    recentCheckinsResult,
    activeGoalsResult,
    pendingSuggestionsResult
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("user_inventory")
      .select(`
        *,
        products (name, brand, category, ingredients, description)
      `)
      .eq("user_id", userId),
    supabase
      .from("routines")
      .select(`
        *,
        routine_steps (
          *,
          products (name, brand, category)
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("date", getWeekStartDate())
      .order("date", { ascending: false }),
    supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("routine_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false })
  ])

  // Organize routines by day
  const routinesByDay = routinesResult.data?.reduce(
    (acc, routine) => {
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
        routine.day_of_week
      ]
      if (!acc[dayName]) {
        acc[dayName] = { morning: null, evening: null }
      }
      acc[dayName][routine.type] = routine
      return acc
    },
    {} as Record<string, { morning: any; evening: any }>,
  ) || {}

  return {
    profile: profileResult.data,
    inventory: inventoryResult.data || [],
    routines: routinesResult.data || [],
    routinesByDay,
    weeklyCheckIns: weeklyCheckInsResult.data || [],
    recentProgress: recentProgressResult.data || [],
    recentCheckins: recentCheckinsResult.data || [],
    activeGoals: activeGoalsResult.data || [],
    pendingSuggestions: pendingSuggestionsResult.data || []
  }
}
