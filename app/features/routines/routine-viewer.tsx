"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/integrations/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Edit, Sun, Moon, Calendar, Clock } from "lucide-react"
import Link from "next/link"

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

interface RoutineViewerProps {
  routine: Routine
  userId: string
}

export function RoutineViewer({ routine, userId }: RoutineViewerProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  const toggleStepCompletion = (stepId: string) => {
    const newCompletedSteps = new Set(completedSteps)
    if (newCompletedSteps.has(stepId)) {
      newCompletedSteps.delete(stepId)
    } else {
      newCompletedSteps.add(stepId)
    }
    setCompletedSteps(newCompletedSteps)
  }

  const completeRoutine = async () => {
    setIsCompleting(true)
    const supabase = createClient()

    try {
      const today = new Date().toISOString().split("T")[0]
      const routineField = routine.type === "morning" ? "morning_routine_completed" : "evening_routine_completed"

      // Update or insert daily check-in
      const { error } = await supabase.from("daily_checkins").upsert(
        {
          user_id: userId,
          date: today,
          [routineField]: true,
        },
        {
          onConflict: "user_id,date",
        },
      )

      if (error) throw error

      alert("Routine completed! Great job on taking care of your skin.")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error completing routine:", error)
      alert("Failed to mark routine as complete. Please try again.")
    } finally {
      setIsCompleting(false)
    }
  }

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case "morning":
        return <Sun className="h-6 w-6 text-blue-600" />
      case "evening":
        return <Moon className="h-6 w-6 text-blue-600" />
      case "weekly":
        return <Calendar className="h-6 w-6 text-blue-600" />
      default:
        return <Clock className="h-6 w-6 text-blue-600" />
    }
  }

  const getRoutineTypeColor = (type: string) => {
    switch (type) {
      case "morning":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "evening":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "weekly":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const completionPercentage =
    routine.routine_steps.length > 0 ? Math.round((completedSteps.size / routine.routine_steps.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-stone-300 text-stone-700 hover:bg-stone-50 bg-transparent"
        >
          <Link href="/routines">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rituals
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {getRoutineIcon(routine.type)}
            <div>
              <h1 className="text-2xl font-serif font-bold text-charcoal-900">{routine.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getRoutineTypeColor(routine.type)} border`}>
                  {routine.type === "morning"
                    ? "Dawn Ritual"
                    : routine.type === "evening"
                      ? "Evening Ceremony"
                      : routine.type}
                </Badge>
                {!routine.is_active && (
                  <Badge variant="secondary" className="bg-stone-200 text-stone-700">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-stone-300 text-stone-700 hover:bg-stone-50 bg-transparent"
        >
          <Link href={`/routines?edit=${routine.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Refine
          </Link>
        </Button>
      </div>

      {/* Progress Card */}
      <Card className="border-stone-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-serif text-charcoal-900">
            <span>Ritual Progress</span>
            <span className="text-lg font-bold text-blue-700">{completionPercentage}%</span>
          </CardTitle>
          <CardDescription className="text-stone-600">
            {completedSteps.size} of {routine.routine_steps.length} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-stone-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Routine Steps */}
      <div className="space-y-6">
        <h2 className="text-xl font-serif font-semibold text-charcoal-900">Ritual Steps</h2>

        {routine.routine_steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)

          return (
            <Card
              key={step.id}
              className={`border-stone-200 shadow-sm transition-all ${
                isCompleted ? "bg-blue-50 border-blue-200" : "bg-white"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleStepCompletion(step.id)}
                      className="mt-1 border-stone-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        isCompleted ? "bg-blue-600" : "bg-stone-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h3
                        className={`font-semibold ${isCompleted ? "line-through text-stone-500" : "text-charcoal-900"}`}
                      >
                        {step.products.name}
                      </h3>
                      <p className={`text-sm ${isCompleted ? "line-through text-stone-400" : "text-stone-600"}`}>
                        {step.products.brand} • {step.products.category}
                      </p>
                    </div>

                    {(step.amount || step.instructions) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        {step.amount && (
                          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                            <p className="text-xs font-medium text-stone-700 mb-1">Amount</p>
                            <p
                              className={`text-sm ${isCompleted ? "line-through text-stone-400" : "text-charcoal-900"}`}
                            >
                              {step.amount}
                            </p>
                          </div>
                        )}
                        {step.instructions && (
                          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                            <p className="text-xs font-medium text-stone-700 mb-1">Instructions</p>
                            <p
                              className={`text-sm ${isCompleted ? "line-through text-stone-400" : "text-charcoal-900"}`}
                            >
                              {step.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Complete Routine Button */}
      {routine.routine_steps.length > 0 && (
        <Card className="border-stone-200 shadow-sm bg-white">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-serif font-semibold text-charcoal-900">Complete Your Ritual</h3>
                <p className="text-stone-600">Mark this ritual as completed for today</p>
              </div>
              <Button
                onClick={completeRoutine}
                disabled={isCompleting || completedSteps.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                size="lg"
              >
                {isCompleting ? "Completing..." : "Complete Ritual"}
              </Button>
              {completedSteps.size === 0 && (
                <p className="text-sm text-stone-500">Complete at least one step to finish the ritual</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
