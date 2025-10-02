/**
 * Goals Hook
 * 
 * Custom hook for managing goals functionality.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/integrations/supabase/client"
import { Goal } from "../types/progress"

/**
 * Custom hook for goals management
 */
export function useGoals(goals: Goal[], userId: string) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [progress, setProgress] = useState(0)
  
  const router = useRouter()
  const supabase = createClient()

  const openDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal)
      setTitle(goal.title)
      setDescription(goal.description || "")
      setTargetDate(goal.target_date || "")
      setProgress(goal.progress)
    } else {
      setEditingGoal(null)
      setTitle("")
      setDescription("")
      setTargetDate("")
      setProgress(0)
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingGoal(null)
    setTitle("")
    setDescription("")
    setTargetDate("")
    setProgress(0)
  }

  const saveGoal = async () => {
    if (!title.trim()) return

    setIsLoading(true)
    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        target_date: targetDate || null,
        progress,
        status: "active",
      }

      if (editingGoal) {
        const { error } = await supabase
          .from("goals")
          .update(goalData)
          .eq("id", editingGoal.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("goals")
          .insert({
            user_id: userId,
            ...goalData,
          })

        if (error) throw error
      }

      closeDialog()
      router.refresh()
    } catch (error) {
      console.error("Error saving goal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting goal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProgress = async (goalId: string, newProgress: number) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("goals")
        .update({ progress: newProgress })
        .eq("id", goalId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating progress:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const completeGoal = async (goalId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("goals")
        .update({ 
          status: "completed",
          progress: 100,
        })
        .eq("id", goalId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error completing goal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isDialogOpen,
    editingGoal,
    isLoading,
    title,
    setTitle,
    description,
    setDescription,
    targetDate,
    setTargetDate,
    progress,
    setProgress,
    openDialog,
    closeDialog,
    saveGoal,
    deleteGoal,
    updateProgress,
    completeGoal,
  }
}
