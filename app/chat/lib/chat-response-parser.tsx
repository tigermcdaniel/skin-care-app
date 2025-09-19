export interface ProductRecommendation {
  name: string
  brand: string
  category: string
  description: string
  key_ingredients: string[]
  benefits: string[]
  reason: string
}

export interface RoutineUpdate {
  type: "morning" | "evening"
  changes: string[]
}

export interface TreatmentSuggestion {
  type: string
  reason: string
  frequency: string
}

export interface GoalSuggestion {
  title: string
  description: string
  target_date: string
}

export interface RoutineAction {
  type: "morning" | "evening"
  routine_name: string
  action: "complete"
}

export interface CabinetAction {
  action: "add" | "remove"
  product_name: string
  product_brand: string
  category?: string
  amount_remaining?: number
  reason: string
}

export type AppointmentAction = {
  action: "add"
  treatment_type: string
  date: string
  time: string
  provider: string
  location: string
  notes?: string
}

export interface ParsedResponse {
  products: ProductRecommendation[]
  routines: RoutineUpdate[]
  treatments: TreatmentSuggestion[]
  goals: GoalSuggestion[]
  routineActions: RoutineAction[]
  cabinetActions: CabinetAction[]
  appointmentActions: AppointmentAction[]
}

export function parseStructuredResponse(content: string): ParsedResponse {
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

export function parseCheckinActions(content: string) {
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

export function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>")
}

export function cleanMessageContent(content: string) {
  return content
    .replace(/\[PRODUCT\]([^{].*?)\[\/PRODUCT\]/g, "$1")
    .replace(/\[PRODUCT\]\{.*?\}\[\/PRODUCT\]/g, "")
    .replace(/\[ROUTINE\].*?\[\/ROUTINE\]/g, "")
    .replace(/\[TREATMENT\].*?\[\/TREATMENT\]/g, "")
    .replace(/\[GOAL\].*?\[\/GOAL\]/g, "")
    .replace(/\[ROUTINE_ACTION\].*?\[\/ROUTINE_ACTION\]/g, "")
    .replace(/\[CABINET_ACTION\].*?\[\/CABINET_ACTION\]/g, "")
    .trim()
}
