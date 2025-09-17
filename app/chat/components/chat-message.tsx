"use client"

import type React from "react"
import { Bot, CheckCircle, Circle, Stethoscope, ClipboardCheck, Minus, Plus, Calendar, Camera } from "lucide-react"

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

interface ChatMessageProps {
  message: ChatMessage
  onAddProduct: (product: ProductRecommendation) => void
  onAcceptRoutine: (routine: RoutineUpdate) => void
  onCompleteRoutine: (action: RoutineAction) => void
  onCabinetAction: (action: CabinetAction) => void
  onAddAppointment: (action: AppointmentAction) => void
  onCheckinAction: (action: any) => void
  onCreateGoal: (goal: GoalSuggestion) => void
  onTreatmentSuggestion: (treatment: TreatmentSuggestion) => void
  isLoading: boolean
  checkIns?: any[]
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

  return { products, routines, treatments, goals, routineActions, cabinetActions, appointmentActions }
}

const parseCheckinActions = (content: string) => {
  const checkinRegex = /\[CHECKIN_ACTION\]\{(.*?)\}\[\/CHECKIN_ACTION\]/g
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
}: ChatMessageProps) {
  if (message.role === "assistant") {
    const { products, routines, treatments, goals, routineActions, cabinetActions, appointmentActions } =
      parseStructuredResponse(message.content)

    return (
      <div className="flex space-x-3">
        <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-sage-600" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-stone-200">
            <div className="prose prose-sm max-w-none">
              {parseCheckinActions(message.content).map((action, index) => (
                <button
                  key={`checkin-${index}`}
                  onClick={() => onCheckinAction(action)}
                  className="inline-flex items-center px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors text-sm font-medium"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add to Daily Check-in
                </button>
              ))}

              <div
                className="text-sm text-charcoal-800 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(
                    message.content
                      .replace(/\[PRODUCT\]\{.*?\}\[\/PRODUCT\]/g, "")
                      .replace(/\[ROUTINE\]\{.*?\}\[\/ROUTINE\]/g, "")
                      .replace(/\[TREATMENT\]\{.*?\}\[\/TREATMENT\]/g, "")
                      .replace(/\[GOAL\]\{.*?\}\[\/GOAL\]/g, "")
                      .replace(/\[ROUTINE_ACTION\]\{.*?\}\[\/ROUTINE_ACTION\]/g, "")
                      .replace(/\[CABINET_ACTION\]\{.*?\}\[\/CABINET_ACTION\]/g, "")
                      .replace(/\[APPOINTMENT_ACTION\]\{.*?\}\[\/APPOINTMENT_ACTION\]/g, "")
                      .replace(/\[CHECKIN_ACTION\]\{.*?\}\[\/CHECKIN_ACTION\]/g, "")
                      .replace(/\[PRODUCT\]([^[]+)\[\/PRODUCT\]/g, "$1"),
                  ),
                }}
              />
            </div>
          </div>

          {products.length > 0 && (
            <div className="space-y-2">
              {products.map((product, index) => (
                <div key={index} className="bg-sage-50 rounded-lg p-3 border border-sage-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-charcoal-900">{product.name}</h4>
                      <p className="text-sm text-charcoal-600 mb-1">by {product.brand}</p>
                      <p className="text-xs text-charcoal-500 mb-2">{product.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.key_ingredients.map((ingredient, i) => (
                          <span key={i} className="text-xs bg-white px-2 py-1 rounded-full text-charcoal-600">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-sage-700 italic">{product.reason}</p>
                    </div>
                    <button
                      onClick={() => onAddProduct(product)}
                      disabled={isLoading}
                      className="ml-3 px-3 py-1 bg-sage-600 hover:bg-sage-700 text-white text-xs rounded-md transition-colors disabled:opacity-50"
                    >
                      Add to Collection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {routines.length > 0 && (
            <div className="space-y-2">
              {routines.map((routine, index) => (
                <button
                  key={index}
                  onClick={() => onAcceptRoutine(routine)}
                  className="w-full bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
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
                  className="w-full bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
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
                  className="w-full bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
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
                    ? todayCheckin?.morning_routine_completed ?? false
                    : todayCheckin?.evening_routine_completed ?? false

                return (
                  <button
                    key={index}
                    onClick={() => onCompleteRoutine(action)}
                    disabled={isCompleted}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                      isCompleted
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-sage-600 hover:bg-sage-700 text-white"
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
              {cabinetActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onCabinetAction(action)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    action.action === "remove"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {action.action === "remove" ? (
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
              ))}
            </div>
          )}

          {appointmentActions.length > 0 && (
            <div className="space-y-2">
              {appointmentActions.map((action, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-charcoal-900">{action.treatment_type}</h4>
                      <p className="text-sm text-charcoal-600">
                        {new Date(action.date).toLocaleDateString()} at {action.time}
                      </p>
                      <p className="text-sm text-charcoal-600">{action.provider}</p>
                      <p className="text-xs text-charcoal-500">{action.location}</p>
                      {action.notes && <p className="text-xs text-charcoal-500 mt-1">{action.notes}</p>}
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
            ? "bg-sage-600 text-white"
            : "bg-stone-100 text-charcoal-900 border border-stone-200"
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
            .trim()}
        </p>
      </div>
    </div>
  )
}
