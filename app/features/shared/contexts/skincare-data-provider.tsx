/**
 * Skincare Data Provider
 * 
 * Provider component for skincare data context.
 * Handles all data fetching and state management logic.
 */

"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/integrations/supabase/client"
import { SkincareDataContext } from "./skincare-data-context"
import { SkincareDataContextType } from "../types/context"
import { Routine, InventoryItem, CheckIn, Goal } from "../types/skincare"

/**
 * SkincareDataProvider Component
 * 
 * Centralized state management provider for the entire AI-powered skincare consultant application.
 * This component acts as the single source of truth for all skincare-related data,
 * managing complex state interactions between routines, inventory, check-ins, and goals.
 * 
 * Key Responsibilities:
 * - Manages user authentication state and session persistence
 * - Handles CRUD operations for routines, inventory items, check-ins, and goals
 * - Provides real-time data synchronization with Supabase backend
 * - Implements optimistic UI updates for better user experience
 * - Manages event-driven updates across all child components
 * - Handles data loading states and error conditions
 * 
 * State Management:
 * - Tracks user's active routines and their completion status
 * - Manages product inventory with usage tracking and expiration dates
 * - Stores daily check-ins with photos and skin condition notes
 * - Maintains user goals and progress tracking
 * - Provides data change listeners for real-time UI updates
 * 
 * @param {Object} props - Component configuration object
 * @param {React.ReactNode} props.children - Child components that will have access to the skincare data context
 * @returns {JSX.Element} React context provider wrapping all child components with skincare data access
 */
export function SkincareDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataChangeCallbacks, setDataChangeCallbacks] = useState<(() => void)[]>([])

  const supabase = createClient()

  const notifyDataChange = useCallback(() => {
    dataChangeCallbacks.forEach((callback) => callback())
  }, [dataChangeCallbacks])

  const refreshData = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser)

      if (!currentUser) return

      const [routinesData, inventoryData, checkInsData, goalsData] = await Promise.all([
        supabase
          .from("routines")
          .select(`
            *,
            routine_steps (
              *,
              products (*)
            )
          `)
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("user_inventory")
          .select(`
            *,
            products (*)
          `)
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("daily_checkins")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("date", { ascending: false })
          .limit(10),

        supabase
          .from("goals")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ])

      setRoutines(routinesData.data || [])
      setInventory(inventoryData.data || [])
      setCheckIns(checkInsData.data || [])
      setGoals(goalsData.data || [])

      notifyDataChange()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, notifyDataChange])

  const updateRoutine = useCallback(
    async (routineId: string, updates: Partial<Routine>) => {
      try {
        const { error } = await supabase
          .from("routines")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", routineId)

        if (error) throw error

        setRoutines((prev) => prev.map((routine) => (routine.id === routineId ? { ...routine, ...updates } : routine)))

        notifyDataChange()
      } catch (error) {
        console.error("Error updating routine:", error)
        throw error
      }
    },
    [supabase, notifyDataChange],
  )

  const markRoutineComplete = useCallback(
    async (routineId: string, routineName: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date().toISOString().split("T")[0]

        const routine = routines.find((r) => r.id === routineId)
        const isEveningRoutine =
          routine?.type?.toLowerCase().includes("evening") || routine?.name?.toLowerCase().includes("evening")

        const { data: existingCheckIn } = await supabase
          .from("daily_checkins")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single()

        if (existingCheckIn) {
          const updateData = isEveningRoutine
            ? { evening_routine_completed: true }
            : { morning_routine_completed: true }

          const { error } = await supabase.from("daily_checkins").update(updateData).eq("id", existingCheckIn.id)

          if (error) throw error
        } else {
          const insertData = {
            user_id: user.id,
            date: today,
            notes: `Completed ${routineName} routine`,
            skin_condition_rating: 3,
            morning_routine_completed: isEveningRoutine ? null : true,
            evening_routine_completed: isEveningRoutine ? true : null,
          }

          const { data, error } = await supabase.from("daily_checkins").insert(insertData)

          if (error) throw error
        }

        await refreshData()
      } catch (error) {
        console.error("Error marking routine complete:", error)
        throw error
      }
    },
    [supabase, routines, refreshData],
  )

  const updateInventoryItem = useCallback(
    async (itemId: string, updates: Partial<InventoryItem>) => {
      try {
        const { error } = await supabase
          .from("user_inventory")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", itemId)

        if (error) throw error

        setInventory((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)))

        notifyDataChange()
      } catch (error) {
        console.error("Error updating inventory item:", error)
        throw error
      }
    },
    [supabase, notifyDataChange],
  )

  const addProductToInventory = useCallback(
    async (productId: string, notes?: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const existingItem = inventory.find((item) => item.product_id === productId)

        if (existingItem) {
          await updateInventoryItem(existingItem.id, {
            amount_remaining: Math.min(100, existingItem.amount_remaining + 20),
            notes: notes || existingItem.notes,
          })
        } else {
          const { data, error } = await supabase
            .from("user_inventory")
            .insert({
              user_id: user.id,
              product_id: productId,
              amount_remaining: 100,
              purchase_date: new Date().toISOString().split("T")[0],
              notes: notes || null,
            })
            .select(`
          *,
          products (*)
        `)
            .single()

          if (error) throw error

          if (data) {
            setInventory((prev) => [data, ...prev])
            notifyDataChange()
          }
        }

        await refreshData()
      } catch (error) {
        console.error("Error adding product to inventory:", error)
        throw error
      }
    },
    [supabase, inventory, updateInventoryItem, notifyDataChange, refreshData],
  )

  const markProductAsUsed = useCallback(
    async (itemId: string, currentAmount: number) => {
      const newAmount = Math.max(0, currentAmount - 10)
      await updateInventoryItem(itemId, { amount_remaining: newAmount })
    },
    [updateInventoryItem],
  )

  const deleteProductFromInventory = useCallback(
    async (itemId: string) => {
      try {
        const { error } = await supabase.from("user_inventory").delete().eq("id", itemId)

        if (error) throw error

        setInventory((prev) => prev.filter((item) => item.id !== itemId))
        notifyDataChange()
      } catch (error) {
        console.error("Error deleting product from inventory:", error)
        throw error
      }
    },
    [supabase, notifyDataChange],
  )

  const addCheckIn = useCallback(
    async (checkIn: Omit<CheckIn, "id" | "user_id" | "created_at">) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("daily_checkins")
          .insert({
            user_id: user.id,
            ...checkIn,
          })
          .select()
          .single()

        if (error) throw error

        if (data) {
          setCheckIns((prev) => [data, ...prev])
          notifyDataChange()
        }
      } catch (error) {
        console.error("Error adding check-in:", error)
        throw error
      }
    },
    [supabase, notifyDataChange],
  )

  const addGoal = useCallback(
    async (goal: Omit<Goal, "id" | "user_id" | "created_at">) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("goals")
          .insert({
            user_id: user.id,
            ...goal,
          })
          .select()
          .single()

        if (error) throw error

        if (data) {
          setGoals((prev) => [data, ...prev])
          notifyDataChange()
        }
      } catch (error) {
        console.error("Error adding goal:", error)
        throw error
      }
    },
    [supabase, notifyDataChange],
  )

  const onDataChange = useCallback((callback: () => void) => {
    setDataChangeCallbacks((prev) => [...prev, callback])

    // Return cleanup function
    return () => {
      setDataChangeCallbacks((prev) => prev.filter((cb) => cb !== callback))
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    const handleRefreshData = () => {
      console.log("[v0] Received refreshSkincareData event, refreshing context data")
      refreshData()
    }

    window.addEventListener("refreshSkincareData", handleRefreshData)

    return () => {
      window.removeEventListener("refreshSkincareData", handleRefreshData)
    }
  }, [refreshData])

  const value: SkincareDataContextType = {
    user,
    routines,
    inventory,
    checkIns,
    goals,
    isLoading,
    refreshData,
    updateRoutine,
    markRoutineComplete,
    updateInventoryItem,
    addProductToInventory,
    markProductAsUsed,
    deleteProductFromInventory,
    removeFromInventory: deleteProductFromInventory, // Alias for compatibility
    addCheckIn,
    addGoal,
    onDataChange,
  }

  return <SkincareDataContext.Provider value={value}>{children}</SkincareDataContext.Provider>
}
