"use client"
import { Bot, CheckCircle, Stethoscope, ClipboardCheck, Minus, Plus, Calendar, Camera, Check } from "lucide-react"
import { RoutineApprovalCard } from "@/app/features/routines/components/routine-approval-card"
import { LoadingBubble } from "./loading-bubble"
import { isStreamingComponents, getStreamingComponentType, getComponentLoadingMessage, extractTextBeforeComponents } from "../lib/component-detector"
import { useState, useEffect, useRef, useMemo } from "react"

import { generateUUID } from "@/lib/uuid"


interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface ProductRecommendation {
  name: string
  brand: string
  category: string
  description: string
  key_ingredients: string[]
  benefits: string[]
  reason: string
}

interface RoutineUpdate {
  type: "morning" | "evening"
  changes: string[]
}

interface TreatmentSuggestion {
  type: string
  reason: string
  frequency: string
}

interface GoalSuggestion {
  title: string
  description: string
  target_date: string
}

interface RoutineAction {
  type: "morning" | "evening"
  routine_name: string
  action: "complete"
}

interface CabinetAction {
  action: "add" | "remove"
  product_name: string
  product_brand: string
  category?: string
  amount_remaining?: number
  reason: string
}

type AppointmentAction = {
  action: "add"
  treatment_type: string
  date: string
  time: string
  provider: string
  location: string
  notes?: string
}

interface WeeklyRoutineSuggestion {
  title: string
  description: string
  weeklySchedule: {
    [key: string]: {
      morning: {
        steps: Array<{
          product_name: string
          product_brand: string
          instructions: string
          category: string
        }>
      }
      evening: {
        steps: Array<{
          product_name: string
          product_brand: string
          instructions: string
          category: string
        }>
      }
    }
  }
  reasoning: string
}

interface ChatMessageProps {
  message: ChatMessage
  onAddProduct: (product: ProductRecommendation, index?: number) => void
  onAcceptRoutine: (routine: RoutineUpdate) => void
  onCompleteRoutine: (action: RoutineAction) => void
  onCabinetAction: (action: CabinetAction) => void
  onAddAppointment: (action: AppointmentAction) => void
  onCheckinAction: (action: any) => void
  onCreateGoal: (goal: GoalSuggestion) => void
  onTreatmentSuggestion: (treatment: TreatmentSuggestion) => void
  isLoading: boolean
  checkIns?: any[]
  inventory?: any[]
}

const formatMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>")
}

const parseStructuredResponse = (content: string) => {
  const products: ProductRecommendation[] = []
  const routines: RoutineUpdate[] = []
  const treatments: TreatmentSuggestion[] = []
  const goals: GoalSuggestion[] = []
  const routineActions: RoutineAction[] = []
  const cabinetActions: CabinetAction[] = []
  const appointmentActions: AppointmentAction[] = []
  const weeklyRoutines: WeeklyRoutineSuggestion[] = []

  // Parse products
  const productMatches = content.match(/\[PRODUCT\](.*?)\[\/PRODUCT\]/g)
  if (productMatches) {
    productMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[PRODUCT\]/, "").replace(/\[\/PRODUCT\]/, "")
        const product = JSON.parse(jsonStr)
        products.push(product)
      } catch (e) {
        console.error("Failed to parse product:", e)
      }
    })
  }

  // Parse routines
  const routineMatches = content.match(/\[ROUTINE\](.*?)\[\/ROUTINE\]/g)
  if (routineMatches) {
    routineMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[ROUTINE\]/, "").replace(/\[\/ROUTINE\]/, "")
        const routine = JSON.parse(jsonStr)
        routines.push(routine)
      } catch (e) {
        console.error("Failed to parse routine:", e)
      }
    })
  }

  // Parse treatments
  const treatmentMatches = content.match(/\[TREATMENT\](.*?)\[\/TREATMENT\]/g)
  if (treatmentMatches) {
    treatmentMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[TREATMENT\]/, "").replace(/\[\/TREATMENT\]/, "")
        const treatment = JSON.parse(jsonStr)
        treatments.push(treatment)
      } catch (e) {
        console.error("Failed to parse treatment:", e)
      }
    })
  }

  // Parse goals
  const goalMatches = content.match(/\[GOAL\](.*?)\[\/GOAL\]/g)
  if (goalMatches) {
    goalMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[GOAL\]/, "").replace(/\[\/GOAL\]/, "")
        const goal = JSON.parse(jsonStr)
        goals.push(goal)
      } catch (e) {
        console.error("Failed to parse goal:", e)
      }
    })
  }

  // Parse routine actions
  const routineActionMatches = content.match(/\[ROUTINE_ACTION\](.*?)\[\/ROUTINE_ACTION\]/g)
  if (routineActionMatches) {
    routineActionMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[ROUTINE_ACTION\]/, "").replace(/\[\/ROUTINE_ACTION\]/, "")
        const routineAction = JSON.parse(jsonStr)
        routineActions.push(routineAction)
      } catch (e) {
        console.error("Failed to parse routine action:", e)
      }
    })
  }

  // Parse cabinet actions
  const cabinetActionMatches = content.match(/\[CABINET_ACTION\](.*?)\[\/CABINET_ACTION\]/g)
  if (cabinetActionMatches) {
    cabinetActionMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[CABINET_ACTION\]/, "").replace(/\[\/CABINET_ACTION\]/, "")
        const cabinetAction = JSON.parse(jsonStr)
        cabinetActions.push(cabinetAction)
      } catch (e) {
        console.error("Failed to parse cabinet action:", e)
      }
    })
  }

  const appointmentActionMatches = content.match(/\[APPOINTMENT_ACTION\](.*?)\[\/APPOINTMENT_ACTION\]/g)
  if (appointmentActionMatches) {
    appointmentActionMatches.forEach((match) => {
      try {
        const jsonStr = match.replace(/\[APPOINTMENT_ACTION\]/, "").replace(/\[\/APPOINTMENT_ACTION\]/, "")
        const appointmentAction = JSON.parse(jsonStr)
        appointmentActions.push(appointmentAction)
      } catch (e) {
        console.error("Failed to parse appointment action:", e)
      }
    })
  }

  const weeklyRoutineMatches = content.match(/\[WEEKLY_ROUTINE\](.*?)\[\/WEEKLY_ROUTINE\]/gs)

  if (weeklyRoutineMatches) {
    weeklyRoutineMatches.forEach((match, index) => {
      try {
        const jsonStr = match
          .replace(/\[WEEKLY_ROUTINE\]/, "")
          .replace(/\[\/WEEKLY_ROUTINE\]/, "")
          .trim()
        const weeklyRoutine = JSON.parse(jsonStr)
        weeklyRoutines.push(weeklyRoutine)
      } catch (e) {
        console.error("Failed to parse weekly routine:", e)
      }
    })
  }

  return { products, routines, treatments, goals, routineActions, cabinetActions, appointmentActions, weeklyRoutines }
}

const parseCheckinActions = (content: string) => {
  const checkinRegex = /\[CHECKIN_ACTION\](\{.*?\})\[\/CHECKIN_ACTION\]/g
  const actions = []
  let match

  while ((match = checkinRegex.exec(content)) !== null) {
    try {
      const actionData = JSON.parse(match[1])
      actions.push(actionData)
    } catch (error) {
      console.error("Error parsing checkin action:", error)
    }
  }

  return actions
}

export function ChatMessageComponent({
  message,
  onAddProduct,
  onAcceptRoutine,
  onCompleteRoutine,
  onCabinetAction,
  onAddAppointment,
  onCheckinAction,
  onCreateGoal,
  onTreatmentSuggestion,
  isLoading,
  checkIns,
  inventory = [],
}: ChatMessageProps) {
  const [completedCabinetActions, setCompletedCabinetActions] = useState<Set<string>>(new Set())


  // Memoize inventory data to prevent unnecessary re-renders
  const inventoryData = useMemo(() => inventory, [inventory])


  const handleApproveRoutine = async (suggestionId: string, routineData: WeeklyRoutineSuggestion) => {
    try {
      const response = await fetch("/api/routines/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suggestionId, routineData }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve routine")
      }

      window.dispatchEvent(new CustomEvent("refreshSkincareData"))
    } catch (error) {
      console.error("Error approving routine:", error)
    }
  }

  const handleDenyRoutine = async (suggestionId: string) => {
    try {
      const response = await fetch("/api/routines/deny", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suggestionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to deny routine")
      }
    } catch (error) {
      console.error("Error denying routine:", error)
    }
  }

  const handleCabinetActionWithConfirmation = async (action: CabinetAction, index: number) => {
    const actionKey = `${action.product_name}-${action.product_brand}-${index}`

    try {
      await onCabinetAction(action)
      setCompletedCabinetActions((prev) => new Set(prev).add(actionKey))

      setTimeout(() => {
        setCompletedCabinetActions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(actionKey)
          return newSet
        })
      }, 3000)
    } catch (error) {
      console.error("Cabinet action failed:", error)
    }
  }

  const isProductInInventory = (product: ProductRecommendation) => {
    if (!inventoryData || inventoryData.length === 0) return false
    
    return inventoryData.some(item => 
      item.products?.name?.toLowerCase() === product.name.toLowerCase() &&
      item.products?.brand?.toLowerCase() === product.brand.toLowerCase()
    )
  }

  const isProductCompleted = (product: ProductRecommendation, index: number) => {
    // Check if the product has been marked as added in the message content
    return (product as any).added === true
  }

  const handleProductAdditionWithConfirmation = async (product: ProductRecommendation, index: number) => {
    try {
      await onAddProduct(product, index)
    } catch (error) {
      console.error("Product addition failed:", error)
    }
  }

  if (message.role === "assistant") {
    // Check if we're currently streaming components
    const isStreaming = isStreamingComponents(message.content)
    const componentType = getStreamingComponentType(message.content)
    const loadingMessage = getComponentLoadingMessage(componentType)
    const textBeforeComponents = extractTextBeforeComponents(message.content)

    const {
      products,
      routines,
      treatments,
      goals,
      routineActions,
      cabinetActions,
      appointmentActions,
      weeklyRoutines,
    } = parseStructuredResponse(message.content)

    return (
      <div className="flex space-x-3">
        <div className="flex-1 space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <div className="prose prose-sm max-w-none">
              {parseCheckinActions(message.content).map((action, index) => (
                <button
                  key={`checkin-${index}`}
                  onClick={() => onCheckinAction(action)}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add to Daily Check-in
                </button>
              ))}

              <div
                className="text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(
                    // If streaming components, show only the text before components
                    // Otherwise, show the full content with components removed
                    isStreaming && isLoading 
                      ? textBeforeComponents
                      : message.content
                        .replace(/\[PRODUCT\]\{.*?\}\[\/PRODUCT\]/g, "")
                        .replace(/\[ROUTINE\]\{.*?\}\[\/ROUTINE\]/g, "")
                        .replace(/\[TREATMENT\]\{.*?\}\[\/TREATMENT\]/g, "")
                        .replace(/\[GOAL\]\{.*?\}\[\/GOAL\]/g, "")
                        .replace(/\[ROUTINE_ACTION\]\{.*?\}\[\/ROUTINE_ACTION\]/g, "")
                        .replace(/\[CABINET_ACTION\]\{.*?\}\[\/CABINET_ACTION\]/g, "")
                        .replace(/\[APPOINTMENT_ACTION\]\{.*?\}\[\/APPOINTMENT_ACTION\]/g, "")
                        .replace(/\[CHECKIN_ACTION\]\{.*?\}\[\/CHECKIN_ACTION\]/g, "")
                        .replace(/\[WEEKLY_ROUTINE\].*?\[\/WEEKLY_ROUTINE\]/gs, "")
                        .replace(/\[PRODUCT\]([^[]+)\[\/PRODUCT\]/g, "$1"),
                  ),
                }}
              />
            </div>
          </div>

          {/* Show loading animation when streaming components */}
          {isStreaming && isLoading && (
            <LoadingBubble message={loadingMessage} />
          )}

          {weeklyRoutines.length > 0 && (
            <div className="space-y-3">
              {weeklyRoutines.map((weeklyRoutine, index) => (
                <RoutineApprovalCard
                  key={index}
                  suggestion={{
                    ...weeklyRoutine,
                    id: generateUUID(),
                    created_at: new Date().toISOString(),
                  }}
                  onApprove={(suggestionId) => handleApproveRoutine(suggestionId, weeklyRoutine)}
                  onDeny={handleDenyRoutine}
                />
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="space-y-2">
              {products.map((product, index) => {
                const productKey = `${product.name}-${product.brand}-${index}`
                const isCompleted = isProductCompleted(product, index)
                
                
                return (
                  <div key={`${product.name}-${product.brand}-${index}`} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-1">by {product.brand}</p>
                        <p className="text-xs text-muted-foreground mb-2">{product.description}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.key_ingredients.map((ingredient, i) => (
                            <span
                              key={i}
                              className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground italic">{product.reason}</p>
                      </div>
                      <button
                        onClick={() => handleProductAdditionWithConfirmation(product, index)}
                        disabled={isCompleted || isLoading}
                        className={`ml-3 px-3 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                          isCompleted
                            ? "bg-gray-400 text-white cursor-default"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <span>Add to Collection</span>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {routines.length > 0 && (
            <div className="space-y-2">
              {routines.map((routine, index) => (
                <button
                  key={index}
                  onClick={() => onAcceptRoutine(routine)}
                  className="w-full bg-blue-200 hover:bg-blue-300 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Changes</span>
                </button>
              ))}
            </div>
          )}

          {treatments.length > 0 && (
            <div className="space-y-2">
              {treatments.map((treatment, index) => (
                <button
                  key={index}
                  onClick={() => onTreatmentSuggestion(treatment)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>{treatment.type}</span>
                </button>
              ))}
            </div>
          )}

          {goals.length > 0 && (
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <button
                  key={index}
                  onClick={() => onCreateGoal(goal)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Create Goal</span>
                </button>
              ))}
            </div>
          )}

          {routineActions.length > 0 && (
            <div className="space-y-2">
              {routineActions.map((action, index) => {
                const today = new Date().toISOString().split("T")[0]
                const todayCheckin = checkIns?.find((c) => c.date === today)
                const isCompleted =
                  action.type === "morning"
                    ? (todayCheckin?.morning_routine_completed ?? false)
                    : (todayCheckin?.evening_routine_completed ?? false)

                return (
                  <button
                    key={index}
                    onClick={() => onCompleteRoutine(action)}
                    disabled={isCompleted}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                      isCompleted
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-200 hover:bg-blue-300 text-blue-800"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isCompleted ? "Completed" : `Mark ${action.type} routine complete`}</span>
                  </button>
                )
              })}
            </div>
          )}

          {cabinetActions.length > 0 && (
            <div className="space-y-2">
              {cabinetActions.map((action, index) => {
                const actionKey = `${action.product_name}-${action.product_brand}-${index}`
                const isCompleted = completedCabinetActions.has(actionKey)

                return (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{action.product_name}</h4>
                        <p className="text-sm text-muted-foreground mb-1">by {action.product_brand}</p>
                        {action.category && <p className="text-xs text-muted-foreground mb-2">{action.category}</p>}
                        <p className="text-xs text-muted-foreground italic">{action.reason}</p>
                        {action.amount_remaining !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Amount remaining: {action.amount_remaining}%
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCabinetActionWithConfirmation(action, index)}
                        disabled={isCompleted}
                        className={`ml-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 self-end ${
                          isCompleted
                            ? "bg-gray-400 text-white cursor-default"
                            : action.action === "remove"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-blue-200 hover:bg-blue-300 text-blue-800"
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Added</span>
                          </>
                        ) : action.action === "remove" ? (
                          <>
                            <Minus className="w-4 h-4" />
                            <span>Remove from Cabinet</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add to Cabinet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {appointmentActions.length > 0 && (
            <div className="space-y-2">
              {appointmentActions.map((action, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{action.treatment_type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(action.date).toLocaleDateString()} at {action.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{action.provider}</p>
                      <p className="text-xs text-muted-foreground">{action.location}</p>
                      {action.notes && <p className="text-xs text-muted-foreground mt-1">{action.notes}</p>}
                    </div>
                    <button
                      onClick={() => onAddAppointment(action)}
                      disabled={isLoading}
                      className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Add Appointment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl p-4 rounded-lg ${
          message.role === "user"
            ? "bg-gray-200 text-gray-800"
            : "bg-muted text-foreground border border-border"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {message.content
            .replace(/\[PRODUCT\]([^{].*?)\[\/PRODUCT\]/g, "$1")
            .replace(/\[PRODUCT\]\{.*?\}\[\/PRODUCT\]/g, "")
            .replace(/\[ROUTINE\].*?\[\/ROUTINE\]/g, "")
            .replace(/\[TREATMENT\].*?\[\/TREATMENT\]/g, "")
            .replace(/\[GOAL\].*?\[\/GOAL\]/g, "")
            .replace(/\[ROUTINE_ACTION\].*?\[\/ROUTINE_ACTION\]/g, "")
            .replace(/\[CABINET_ACTION\].*?\[\/CABINET_ACTION\]/g, "")
            .replace(/\[WEEKLY_ROUTINE\].*?\[\/WEEKLY_ROUTINE\]/gs, "")
            .trim()}
        </p>
      </div>
    </div>
  )
}
