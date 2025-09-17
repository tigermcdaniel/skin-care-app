"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/features/shared/ui/card"
import { Button } from "@/app/features/shared/ui/button"
import { Badge } from "@/app/features/shared/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/features/shared/ui/dialog"
import { RoutineBuilder } from "@/app/features/routines/routine-builder"
import { createClient } from "@/integrations/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Edit, Sun, Moon, Calendar, Clock, MessageCircle, CheckCircle, Play } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  category: string
}

interface RoutineStep {
  id: string
  routine_id: string
  product_id: string
  step_order: number
  instructions: string | null
  amount: string | null
  products: Product
}

interface Routine {
  id: string
  user_id: string
  name: string
  type: string
  is_active: boolean
  created_at: string
  updated_at: string
  routine_steps: RoutineStep[]
}

interface InventoryItem {
  id: string
  product_id: string
  products: Product
}

interface RoutineManagerProps {
  routines: Routine[]
  inventory: InventoryItem[]
  userId: string
}

export function RoutineManager({ routines, inventory, userId }: RoutineManagerProps) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case "morning":
        return <Sun className="h-5 w-5 text-yellow-500" />
      case "evening":
        return <Moon className="h-5 w-5 text-purple-500" />
      case "weekly":
        return <Calendar className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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
    const supabase = createClient()

    try {
      const { error } = await supabase.from("routines").delete().eq("id", routineId)

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
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("routines")
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
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
    const supabase = createClient()

    try {
      const today = new Date().toISOString().split("T")[0]

      const routine = routines.find((r) => r.id === routineId)
      const isEveningRoutine =
        routine?.type?.toLowerCase().includes("evening") || routine?.name?.toLowerCase().includes("evening")

      const { error } = await supabase.from("daily_checkins").insert({
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif text-charcoal-800">Your Ritual Reference</h2>
          <p className="text-charcoal-600">View your routines and take actions when ready</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/chat/new-session?prompt=Help me create a new skincare routine")}
            variant="outline"
            className="border-sage-200 text-sage-700 hover:bg-sage-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Ask Chat to Build
          </Button>
          <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => openBuilder()}
                className="bg-sage-600 hover:bg-sage-700 text-white transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Ritual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRoutine ? "Edit Ritual" : "Create New Ritual"}</DialogTitle>
                <DialogDescription>
                  {editingRoutine ? "Update your ritual steps and products" : "Build a personalized skincare ritual"}
                </DialogDescription>
              </DialogHeader>
              <RoutineBuilder
                routine={editingRoutine}
                inventory={inventory}
                userId={userId}
                onClose={closeBuilder}
                onSave={() => {
                  closeBuilder()
                  router.refresh()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-charcoal-400 mb-4">
            <Clock className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium font-serif text-charcoal-800 mb-2">No rituals created yet</h3>
          <p className="text-charcoal-600 mb-4">Start by asking your advisor to build a routine</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/chat/new-session?prompt=Help me create my first skincare routine")}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Chat to Build
            </Button>
            <Button
              onClick={() => openBuilder()}
              variant="outline"
              className="border-sage-200 text-sage-700 hover:bg-sage-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Build Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className="border-0 bg-stone-50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getRoutineIcon(routine.type)}
                    <div>
                      <CardTitle className="text-lg font-serif text-charcoal-800">{routine.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-sage-100 text-sage-800 border-sage-200">{routine.type}</Badge>
                        {!routine.is_active && (
                          <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-charcoal-600">
                  <p>{routine.routine_steps?.length || 0} steps</p>
                  <p>Last updated: {new Date(routine.updated_at).toLocaleDateString()}</p>
                </div>

                {/* Preview of first few steps */}
                {routine.routine_steps && routine.routine_steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Steps:</p>
                    <div className="space-y-1">
                      {routine.routine_steps.slice(0, 3).map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span className="truncate">{step.products.name}</span>
                        </div>
                      ))}
                      {routine.routine_steps.length > 3 && (
                        <p className="text-xs text-gray-500 ml-7">+{routine.routine_steps.length - 3} more steps</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Primary Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => markRoutineComplete(routine.id, routine.name)}
                      disabled={isLoading}
                      className="flex-1 bg-sage-600 hover:bg-sage-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Button
                      onClick={() => router.push(`/routines/${routine.id}`)}
                      variant="outline"
                      className="flex-1 border-sage-200 text-sage-700 hover:bg-sage-50"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Routine
                    </Button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => askChatAboutRoutine(routine)}
                      className="flex-1 border-stone-200 text-charcoal-600 hover:bg-stone-50"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Ask Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBuilder(routine)}
                      className="border-stone-200 text-charcoal-600 hover:bg-stone-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRoutineActive(routine.id, routine.is_active)}
                      disabled={isLoading}
                      className={
                        routine.is_active
                          ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                          : "text-sage-600 border-sage-200 hover:bg-sage-50"
                      }
                    >
                      {routine.is_active ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
