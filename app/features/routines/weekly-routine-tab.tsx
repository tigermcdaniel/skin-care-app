"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sun, Moon, Check, ChevronDown, ChevronUp, Edit3, Save, X, Plus, Trash2 } from "lucide-react"
import { useSkincareData } from "@/app/features/shared/contexts/skincare-data-context"

interface WeeklyRoutineTabProps {
  onExpand?: () => void
  isFullScreen?: boolean
}

interface DayRoutine {
  date: string
  dayName: string
  morningRoutine: any | null
  eveningRoutine: any | null
  morningCompleted: boolean
  eveningCompleted: boolean
}

export function WeeklyRoutineTab({ onExpand, isFullScreen }: WeeklyRoutineTabProps) {
  const { routines, checkIns, inventory, isLoading, markRoutineComplete } = useSkincareData()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [customizedSteps, setCustomizedSteps] = useState<Record<string, string>>({})
  const [editMode, setEditMode] = useState<Record<string, boolean>>({}) // Track edit mode per routine
  const [editedSteps, setEditedSteps] = useState<Record<string, any[]>>({}) // Track edited steps per routine

  // Get current day and next 5 days
  const getWeekDays = () => {
    const today = new Date()
    const weekDays: DayRoutine[] = []
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    // Show today + next 5 days (6 days total)
    for (let i = 0; i < 6; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateString = date.toISOString().split("T")[0]
      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Find check-in for this date
      const checkIn = checkIns.find((c) => c.date === dateString)

      const morningRoutine = routines.find((r) => r.type === "morning" && r.is_active && r.day_of_week === dayOfWeek)
      const eveningRoutine = routines.find((r) => r.type === "evening" && r.is_active && r.day_of_week === dayOfWeek)

      weekDays.push({
        date: dateString,
        dayName: dayNames[dayOfWeek],
        morningRoutine,
        eveningRoutine,
        morningCompleted: checkIn?.morning_routine_completed || false,
        eveningCompleted: checkIn?.evening_routine_completed || false,
      })
    }

    return weekDays
  }

  const weekDays = getWeekDays()

  const handleMarkComplete = async (routineId: string, routineName: string, date: string) => {
    try {
      await markRoutineComplete(routineId, routineName)
      console.log(`${routineName} routine marked as complete for ${date}!`)
    } catch (error) {
      console.error("Error marking routine complete:", error)
    }
  }

  const handleProductChange = (stepId: string, productId: string) => {
    setCustomizedSteps((prev) => ({
      ...prev,
      [stepId]: productId,
    }))
  }

  const toggleEditMode = (routineKey: string, routine: any) => {
    const isEditing = editMode[routineKey]

    if (!isEditing) {
      // Entering edit mode - initialize edited steps with current routine steps
      setEditedSteps((prev) => ({
        ...prev,
        [routineKey]: [...(routine.routine_steps || [])],
      }))
    }

    setEditMode((prev) => ({
      ...prev,
      [routineKey]: !isEditing,
    }))
  }

  const addStep = (routineKey: string) => {
    const newStep = {
      id: `temp-${Date.now()}`,
      product_id: "",
      instructions: "",
      step_order: (editedSteps[routineKey]?.length || 0) + 1,
      products: { name: "", brand: "", category: "" },
    }

    setEditedSteps((prev) => ({
      ...prev,
      [routineKey]: [...(prev[routineKey] || []), newStep],
    }))
  }

  const removeStep = (routineKey: string, stepIndex: number) => {
    setEditedSteps((prev) => ({
      ...prev,
      [routineKey]: prev[routineKey].filter((_, index) => index !== stepIndex),
    }))
  }

  const updateStepProduct = (routineKey: string, stepIndex: number, productId: string) => {
    const product = getProductOptions().find((p) => p.id === productId)
    if (!product) return

    setEditedSteps((prev) => ({
      ...prev,
      [routineKey]: prev[routineKey].map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              product_id: productId,
              products: { name: product.name, brand: product.brand, category: product.category },
            }
          : step,
      ),
    }))
  }

  const saveChanges = async (routineKey: string) => {
    const routineId = routineKey.includes("morning")
      ? weekDays.find((day) => routineKey.includes(day.date))?.morningRoutine?.id
      : weekDays.find((day) => routineKey.includes(day.date))?.eveningRoutine?.id

    if (!routineId) {
      console.error("Could not find routine ID for key:", routineKey)
      return
    }

    try {
      console.log(`[v0] Saving changes for ${routineKey}:`, editedSteps[routineKey])

      const response = await fetch(`/api/routines/${routineId}/steps`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          steps: editedSteps[routineKey] || [],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save routine steps")
      }

      console.log("[v0] Successfully saved routine steps")

      setEditMode((prev) => ({
        ...prev,
        [routineKey]: false,
      }))

      // Clear edited steps for this routine
      setEditedSteps((prev) => {
        const newState = { ...prev }
        delete newState[routineKey]
        return newState
      })

      // Refresh data to show updated steps
      window.dispatchEvent(new CustomEvent("refreshSkincareData"))
    } catch (error) {
      console.error("Error saving routine steps:", error)
      alert("Failed to save changes. Please try again.")
    }
  }

  const cancelEdit = (routineKey: string) => {
    // Reset edited steps and exit edit mode
    setEditedSteps((prev) => {
      const newState = { ...prev }
      delete newState[routineKey]
      return newState
    })

    setEditMode((prev) => ({
      ...prev,
      [routineKey]: false,
    }))
  }

  const getProductOptions = () => {
    return inventory.map((item) => ({
      id: item.product_id,
      name: item.products.name,
      brand: item.products.brand,
      category: item.products.category,
    }))
  }

  const getStepsForDisplay = (routine: any, routineKey: string) => {
    return editMode[routineKey] ? editedSteps[routineKey] || routine.routine_steps || [] : routine.routine_steps || []
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-charcoal-600">Loading your weekly routines...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif font-semibold text-charcoal-900">Weekly Routine Schedule</h2>
          <p className="text-sm text-charcoal-600">Today + Next 5 Days • Track and customize your daily routines</p>
        </div>
        {!isFullScreen && onExpand && (
          <Button
            size="sm"
            variant="outline"
            onClick={onExpand}
            className="border-stone-200 text-charcoal-600 hover:bg-stone-50 bg-transparent"
          >
            Expand View
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {weekDays.map((day) => (
          <Card
            key={day.date}
            className={`border-stone-200 ${isToday(day.date) ? "bg-green-50 border-green-200" : "bg-stone-50"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-serif text-charcoal-900">
                      {day.dayName}
                      {isToday(day.date) && (
                        <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 text-xs">Today</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-charcoal-600">{formatDateDisplay(day.date)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                  className="text-charcoal-600 hover:bg-stone-100"
                >
                  {expandedDay === day.date ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Morning and Evening Routine Summary */}
              <div className="grid grid-cols-2 gap-4">
                {/* Morning Routine */}
                <div
                  className={`p-3 rounded-lg border ${day.morningCompleted ? "bg-green-100 border-green-200" : "bg-white border-stone-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-charcoal-800">Morning</span>
                    </div>
                    {day.morningCompleted && <Check className="h-4 w-4 text-green-600" />}
                  </div>

                  {day.morningRoutine ? (
                    <div className="space-y-2">
                      <p className="text-xs text-charcoal-600">{day.morningRoutine.routine_steps?.length || 0} steps</p>
                      <Button
                        size="sm"
                        onClick={() => handleMarkComplete(day.morningRoutine.id, day.morningRoutine.name, day.date)}
                        disabled={day.morningCompleted || isPastDate(day.date)}
                        className={
                          day.morningCompleted
                            ? "bg-green-600 hover:bg-green-600 text-white cursor-default text-xs"
                            : "bg-green-600 hover:bg-green-700 text-white text-xs"
                        }
                      >
                        {day.morningCompleted ? "Completed" : "Mark Complete"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-charcoal-500">No routine set</p>
                  )}
                </div>

                {/* Evening Routine */}
                <div
                  className={`p-3 rounded-lg border ${day.eveningCompleted ? "bg-green-100 border-green-200" : "bg-white border-stone-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-charcoal-800">Evening</span>
                    </div>
                    {day.eveningCompleted && <Check className="h-4 w-4 text-green-600" />}
                  </div>

                  {day.eveningRoutine ? (
                    <div className="space-y-2">
                      <p className="text-xs text-charcoal-600">{day.eveningRoutine.routine_steps?.length || 0} steps</p>
                      <Button
                        size="sm"
                        onClick={() => handleMarkComplete(day.eveningRoutine.id, day.eveningRoutine.name, day.date)}
                        disabled={day.eveningCompleted || isPastDate(day.date)}
                        className={
                          day.eveningCompleted
                            ? "bg-green-600 hover:bg-green-600 text-white cursor-default text-xs"
                            : "bg-green-600 hover:bg-green-700 text-white text-xs"
                        }
                      >
                        {day.eveningCompleted ? "Completed" : "Mark Complete"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-charcoal-500">No routine set</p>
                  )}
                </div>
              </div>

              {/* Expanded View - Detailed Steps */}
              {expandedDay === day.date && (
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  {/* Morning Routine Steps */}
                  {day.morningRoutine && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 font-medium text-charcoal-800">
                          <Sun className="h-4 w-4 text-yellow-500" />
                          Morning Routine Steps
                        </h4>
                        <div className="flex items-center gap-2">
                          {editMode[`${day.date}-morning`] ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEdit(`${day.date}-morning`)}
                                className="h-8 px-3 text-xs border-stone-300 text-charcoal-600 hover:bg-stone-50"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveChanges(`${day.date}-morning`)}
                                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleEditMode(`${day.date}-morning`, day.morningRoutine)}
                              className="h-8 px-3 text-xs border-stone-300 text-charcoal-600 hover:bg-stone-50"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {getStepsForDisplay(day.morningRoutine, `${day.date}-morning`).map(
                          (step: any, index: number) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800">
                                {index + 1}
                              </span>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-charcoal-800">{step.products.name}</span>
                                  <div className="flex items-center gap-2">
                                    {editMode[`${day.date}-morning`] ? (
                                      <Select
                                        value={step.product_id}
                                        onValueChange={(value) =>
                                          updateStepProduct(`${day.date}-morning`, index, value)
                                        }
                                      >
                                        <SelectTrigger className="w-48 h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getProductOptions().map((product) => (
                                            <SelectItem key={product.id} value={product.id} className="text-xs">
                                              {product.name} - {product.brand}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : null}
                                    {editMode[`${day.date}-morning`] && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeStep(`${day.date}-morning`, index)}
                                        className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {step.instructions && <p className="text-xs text-charcoal-600">{step.instructions}</p>}
                              </div>
                            </div>
                          ),
                        )}
                        {editMode[`${day.date}-morning`] && (
                          <Button
                            variant="outline"
                            onClick={() => addStep(`${day.date}-morning`)}
                            className="w-full h-10 border-dashed border-stone-300 text-charcoal-600 hover:bg-stone-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Step
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Evening Routine Steps */}
                  {day.eveningRoutine && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 font-medium text-charcoal-800">
                          <Moon className="h-4 w-4 text-purple-500" />
                          Evening Routine Steps
                        </h4>
                        <div className="flex items-center gap-2">
                          {editMode[`${day.date}-evening`] ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEdit(`${day.date}-evening`)}
                                className="h-8 px-3 text-xs border-stone-300 text-charcoal-600 hover:bg-stone-50"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveChanges(`${day.date}-evening`)}
                                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleEditMode(`${day.date}-evening`, day.eveningRoutine)}
                              className="h-8 px-3 text-xs border-stone-300 text-charcoal-600 hover:bg-stone-50"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {getStepsForDisplay(day.eveningRoutine, `${day.date}-evening`).map(
                          (step: any, index: number) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-800">
                                {index + 1}
                              </span>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-charcoal-800">{step.products.name}</span>
                                  <div className="flex items-center gap-2">
                                    {editMode[`${day.date}-evening`] ? (
                                      <Select
                                        value={step.product_id}
                                        onValueChange={(value) =>
                                          updateStepProduct(`${day.date}-evening`, index, value)
                                        }
                                      >
                                        <SelectTrigger className="w-48 h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getProductOptions().map((product) => (
                                            <SelectItem key={product.id} value={product.id} className="text-xs">
                                              {product.name} - {product.brand}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : null}
                                    {editMode[`${day.date}-evening`] && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeStep(`${day.date}-evening`, index)}
                                        className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {step.instructions && <p className="text-xs text-charcoal-600">{step.instructions}</p>}
                              </div>
                            </div>
                          ),
                        )}
                        {editMode[`${day.date}-evening`] && (
                          <Button
                            variant="outline"
                            onClick={() => addStep(`${day.date}-evening`)}
                            className="w-full h-10 border-dashed border-stone-300 text-charcoal-600 hover:bg-stone-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Step
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const isToday = (dateString: string) => {
  const today = new Date().toISOString().split("T")[0]
  return dateString === today
}

const isPastDate = (dateString: string) => {
  const today = new Date().toISOString().split("T")[0]
  return dateString < today
}

const formatDateDisplay = (dateString: string) => {
  const [year, month, day] = dateString.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  })
}
