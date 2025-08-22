"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { GripVertical, Plus, X, Search } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  category: string
}

interface InventoryItem {
  id: string
  product_id: string
  products: Product
}

interface RoutineStep {
  id?: string
  product_id: string
  step_order: number
  instructions: string
  amount: string
  products: Product
}

interface Routine {
  id: string
  name: string
  type: string
  is_active: boolean
  routine_steps: RoutineStep[]
}

interface RoutineBuilderProps {
  routine?: Routine | null
  inventory: InventoryItem[]
  userId: string
  onClose: () => void
  onSave: () => void
}

export function RoutineBuilder({ routine, inventory, userId, onClose, onSave }: RoutineBuilderProps) {
  const [routineName, setRoutineName] = useState(routine?.name || "")
  const [routineType, setRoutineType] = useState(routine?.type || "morning")
  const [steps, setSteps] = useState<RoutineStep[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (routine?.routine_steps) {
      const sortedSteps = [...routine.routine_steps].sort((a, b) => a.step_order - b.step_order)
      setSteps(
        sortedSteps.map((step) => ({
          id: step.id,
          product_id: step.product_id,
          step_order: step.step_order,
          instructions: step.instructions || "",
          amount: step.amount || "",
          products: step.products,
        })),
      )
    }
  }, [routine])

  const filteredInventory = inventory.filter(
    (item) =>
      item.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.products.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.products.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addStep = (inventoryItem: InventoryItem) => {
    const newStep: RoutineStep = {
      product_id: inventoryItem.product_id,
      step_order: steps.length + 1,
      instructions: "",
      amount: "",
      products: inventoryItem.products,
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    // Reorder steps
    const reorderedSteps = newSteps.map((step, i) => ({ ...step, step_order: i + 1 }))
    setSteps(reorderedSteps)
  }

  const updateStep = (index: number, field: keyof RoutineStep, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newSteps = Array.from(steps)
    const [reorderedItem] = newSteps.splice(result.source.index, 1)
    newSteps.splice(result.destination.index, 0, reorderedItem)

    // Update step orders
    const reorderedSteps = newSteps.map((step, index) => ({ ...step, step_order: index + 1 }))
    setSteps(reorderedSteps)
  }

  const saveRoutine = async () => {
    if (!routineName.trim()) {
      alert("Please enter a routine name")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      let routineId = routine?.id

      if (routine) {
        // Update existing routine
        const { error: routineError } = await supabase
          .from("routines")
          .update({
            name: routineName,
            type: routineType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", routine.id)

        if (routineError) throw routineError

        // Delete existing steps
        const { error: deleteError } = await supabase.from("routine_steps").delete().eq("routine_id", routine.id)

        if (deleteError) throw deleteError
      } else {
        // Create new routine
        const { data: newRoutine, error: routineError } = await supabase
          .from("routines")
          .insert({
            user_id: userId,
            name: routineName,
            type: routineType,
            is_active: true,
          })
          .select()
          .single()

        if (routineError) throw routineError
        routineId = newRoutine.id
      }

      // Insert new steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((step) => ({
          routine_id: routineId,
          product_id: step.product_id,
          step_order: step.step_order,
          instructions: step.instructions || null,
          amount: step.amount || null,
        }))

        const { error: stepsError } = await supabase.from("routine_steps").insert(stepsToInsert)

        if (stepsError) throw stepsError
      }

      onSave()
    } catch (error) {
      console.error("Error saving routine:", error)
      alert("Failed to save routine. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 bg-stone-50 p-6 rounded-lg">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-serif text-2xl text-charcoal-900 mb-2">
          {routine ? "Refine Your Ritual" : "Craft New Ritual"}
        </h2>
        <p className="text-stone-600 text-sm">Design your personalized skincare ceremony</p>
      </div>

      {/* Routine Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="routineName" className="text-charcoal-800 font-medium">
            Ritual Name
          </Label>
          <Input
            id="routineName"
            placeholder="e.g., Morning Awakening"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            className="border-stone-300 focus:border-sage-500 focus:ring-sage-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="routineType" className="text-charcoal-800 font-medium">
            Ceremony Type
          </Label>
          <Select value={routineType} onValueChange={setRoutineType}>
            <SelectTrigger className="border-stone-300 focus:border-sage-500 focus:ring-sage-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-stone-200">
              <SelectItem value="morning">Morning Awakening</SelectItem>
              <SelectItem value="evening">Evening Restoration</SelectItem>
              <SelectItem value="weekly">Weekly Treatment</SelectItem>
              <SelectItem value="custom">Custom Ceremony</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg text-charcoal-900 mb-2">Select Your Essentials</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
              <Input
                placeholder="Search your collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-stone-300 focus:border-sage-500 focus:ring-sage-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredInventory.map((item) => {
              const isAlreadyAdded = steps.some((step) => step.product_id === item.product_id)

              return (
                <Card key={item.id} className="p-3 border-stone-200 bg-white hover:bg-stone-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-charcoal-900">{item.products.name}</p>
                      <p className="text-xs text-stone-600">{item.products.brand}</p>
                      <Badge variant="outline" className="text-xs mt-1 border-sage-300 text-sage-700">
                        {item.products.category}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addStep(item)}
                      disabled={isAlreadyAdded}
                      className={
                        isAlreadyAdded
                          ? "bg-stone-100 text-stone-400 hover:bg-stone-100"
                          : "bg-sage-600 hover:bg-sage-700 text-white"
                      }
                    >
                      {isAlreadyAdded ? "Added" : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Routine Steps */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-charcoal-900">Ritual Steps ({steps.length})</h3>

          {steps.length === 0 ? (
            <div className="text-center py-8 text-stone-500 bg-white rounded-lg border border-stone-200">
              <p className="font-medium">No steps added yet</p>
              <p className="text-sm">Select essentials from your collection to craft your ritual</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="routine-steps">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3 max-h-96 overflow-y-auto"
                  >
                    {steps.map((step, index) => (
                      <Draggable
                        key={`${step.product_id}-${index}`}
                        draggableId={`${step.product_id}-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-4 border-stone-200 bg-white"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-shrink-0 w-6 h-6 bg-sage-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-charcoal-900">{step.products.name}</p>
                                  <p className="text-xs text-stone-600">{step.products.brand}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeStep(index)}
                                  className="text-rose-600 hover:text-rose-700 border-stone-300 hover:border-rose-300"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-charcoal-800">Amount</Label>
                                  <Input
                                    placeholder="e.g., 2-3 drops"
                                    value={step.amount}
                                    onChange={(e) => updateStep(index, "amount", e.target.value)}
                                    className="text-sm border-stone-300 focus:border-sage-500 focus:ring-sage-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-charcoal-800">Application</Label>
                                  <Input
                                    placeholder="e.g., Apply to damp skin"
                                    value={step.instructions}
                                    onChange={(e) => updateStep(index, "instructions", e.target.value)}
                                    className="text-sm border-stone-300 focus:border-sage-500 focus:ring-sage-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-stone-300 text-charcoal-700 hover:bg-stone-50 bg-transparent"
        >
          Cancel
        </Button>
        <Button
          onClick={saveRoutine}
          disabled={isLoading || !routineName.trim()}
          className="bg-sage-600 hover:bg-sage-700 text-white font-medium"
        >
          {isLoading ? "Crafting..." : routine ? "Refine Ritual" : "Create Ritual"}
        </Button>
      </div>
    </div>
  )
}
