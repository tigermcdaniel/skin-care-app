/**
 * Routines Hook
 * 
 * Custom hook for managing routines functionality.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/integrations/supabase/client"
import { Routine } from "../types/routines"

/**
 * Custom hook for routines management
 */
export function useRoutines(routines: Routine[], userId: string) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case "morning":
        return "☀️"
      case "evening":
        return "🌙"
      case "weekly":
        return "📅"
      default:
        return "⏰"
    }
  }

  const getRoutineTypeColor = (type: string) => {
    switch (type) {
      case "morning":
        return "bg-yellow-100 text-yellow-800"
      case "evening":
        return "bg-purple-100 text-purple-800"
      case "weekly":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const deleteRoutine = async (routineId: string) => {
    if (!confirm("Are you sure you want to delete this routine?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", routineId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting routine:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRoutineActive = async (routineId: string, isActive: boolean) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("routines")
        .update({ 
          is_active: !isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", routineId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating routine:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openBuilder = (routine?: Routine) => {
    setEditingRoutine(routine || null)
    setIsBuilderOpen(true)
  }

  const closeBuilder = () => {
    setIsBuilderOpen(false)
    setEditingRoutine(null)
  }

  const markRoutineComplete = async (routineId: string, routineName: string) => {
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]

      const routine = routines.find((r) => r.id === routineId)
      const isEveningRoutine =
        routine?.type?.toLowerCase().includes("evening") || 
        routine?.name?.toLowerCase().includes("evening")

      const { error } = await supabase
        .from("daily_checkins")
        .insert({
          user_id: userId,
          date: today,
          morning_routine_completed: isEveningRoutine ? null : true,
          evening_routine_completed: isEveningRoutine ? true : null,
          notes: `Completed ${routineName} routine`,
        })

      if (error) throw error

      alert(`${routineName} routine marked as complete for today!`)
      router.refresh()
    } catch (error) {
      console.error("Error marking routine complete:", error)
      alert("Failed to mark routine as complete. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const askChatAboutRoutine = (routine: Routine) => {
    const prompt = `Tell me about my ${routine.name} routine and suggest any improvements`
    router.push(`/chat/new-session?prompt=${encodeURIComponent(prompt)}`)
  }

  return {
    isBuilderOpen,
    editingRoutine,
    isLoading,
    getRoutineIcon,
    getRoutineTypeColor,
    deleteRoutine,
    toggleRoutineActive,
    openBuilder,
    closeBuilder,
    markRoutineComplete,
    askChatAboutRoutine,
  }
}
