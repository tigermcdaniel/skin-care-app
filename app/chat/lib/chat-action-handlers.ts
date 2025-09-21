import { createClient } from "@/integrations/supabase/client"

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

interface RoutineAction {
  type: "morning" | "evening"
  routine_name: string
  action: "complete"
}

interface CabinetAction {
  action: "add" | "remove" | "update" // Added "update" action type
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
  location?: string // Optional location field
  notes?: string
}

interface GoalSuggestion {
  title: string
  description: string
  target_date: string
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

interface WeeklyRoutineApproval {
  action: "approve" | "deny"
  suggestion_id: string
}

export class ChatActionHandlers {
  private supabase = createClient()

  async acceptRoutineUpdate(routine: RoutineUpdate) {
    try {
      console.log("[v0] Accepting routine update:", routine)

      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        alert("Please log in to update your routine")
        return
      }

      const { data: existingRoutines, error: fetchError } = await this.supabase
        .from("routines")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("type", routine.type)
        .eq("is_active", true)

      if (fetchError) {
        console.error("[v0] Error fetching routine:", fetchError)
        alert("Failed to find your existing routine. Please try again.")
        return
      }

      let routineId: string
      let routineName: string

      if (!existingRoutines || existingRoutines.length === 0) {
        const { data: newRoutine, error: createError } = await this.supabase
          .from("routines")
          .insert({
            user_id: user.id,
            name: `${routine.type.charAt(0).toUpperCase() + routine.type.slice(1)} Routine`,
            type: routine.type,
            is_active: true,
          })
          .select("id, name")
          .single()

        if (createError || !newRoutine) {
          console.error("[v0] Error creating routine:", createError)
          alert("Failed to create routine. Please try again.")
          return
        }

        routineId = newRoutine.id
        routineName = newRoutine.name
      } else {
        const existingRoutine = existingRoutines[0]
        routineId = existingRoutine.id
        routineName = existingRoutine.name
      }

      const { data: existingProduct, error: productError } = await this.supabase
        .from("products")
        .select("id")
        .limit(1)
        .single()

      if (productError || !existingProduct) {
        console.error("[v0] Error finding existing product:", productError)
        alert("Unable to find products in database. Please contact support.")
        return
      }

      const placeholderProductId = existingProduct.id

      const { data: existingSteps, error: stepsError } = await this.supabase
        .from("routine_steps")
        .select("step_order")
        .eq("routine_id", routineId)
        .order("step_order", { ascending: false })
        .limit(1)

      if (stepsError) {
        console.error("[v0] Error fetching routine steps:", stepsError)
      }

      const nextStepOrder = existingSteps && existingSteps.length > 0 ? existingSteps[0].step_order + 1 : 1

      const newSteps = routine.changes.map((change, index) => ({
        routine_id: routineId,
        step_order: nextStepOrder + index,
        instructions: change,
        product_id: placeholderProductId,
        amount: "As needed",
      }))

      const { error: insertError } = await this.supabase.from("routine_steps").insert(newSteps)

      if (insertError) {
        console.error("[v0] Error inserting routine steps:", insertError)
        alert("Failed to update routine. Please try again.")
        return
      }

      const updatedName = routineName.includes("(Updated)") ? routineName : `${routineName} (Updated)`

      const { error: updateError } = await this.supabase
        .from("routines")
        .update({
          name: updatedName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", routineId)

      if (updateError) {
        console.error("[v0] Error updating routine:", updateError)
        alert("Failed to update routine name. Please try again.")
        return
      }

      console.log("[v0] Successfully updated routine")
      alert(
        `${routine.type.charAt(0).toUpperCase() + routine.type.slice(1)} routine updated successfully! Check your routines to see the changes.`,
      )

      window.dispatchEvent(new CustomEvent("refreshSkincareData"))
    } catch (error) {
      console.error("[v0] Error updating routine:", error)
      alert("Failed to update routine. Please try again.")
    }
  }

  async addProductToInventory(product: ProductRecommendation, amountRemaining = 100) {
    try {
      // Look for an existing product that matches or is similar
      const { data: existingProduct } = await this.supabase
        .from("products")
        .select("id")
        .eq("name", product.name)
        .eq("brand", product.brand)
        .single()

      let productId = existingProduct?.id

      // If no exact match, try to find a similar product in the same category
      if (!productId) {
        const { data: similarProducts } = await this.supabase
          .from("products")
          .select("id")
          .eq("category", product.category)
          .limit(1)

        if (similarProducts && similarProducts.length > 0) {
          productId = similarProducts[0].id
        }
      }

      // If still no product found, create a new product entry
      if (!productId) {
        const { data: newProduct, error: productError } = await this.supabase
          .from("products")
          .insert({
            name: product.name,
            brand: product.brand,
            category: product.category,
            description: product.description,
            key_ingredients: product.key_ingredients.join(", "),
            benefits: product.benefits.join(", "),
          })
          .select("id")
          .single()

        if (productError || !newProduct) {
          console.error("Error creating new product:", productError)
          throw new Error("Failed to create new product")
        }

        productId = newProduct.id
      }

      const userId = (await this.supabase.auth.getUser()).data.user?.id
      const { data: existingInventory } = await this.supabase
        .from("user_inventory")
        .select("id, notes")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .single()

      // Add to user's inventory with detailed notes about the actual product
      const productNotes = `Recommended Product: ${product.name} by ${product.brand}
Category: ${product.category}
Description: ${product.description}
Key Ingredients: ${product.key_ingredients.join(", ")}
Benefits: ${product.benefits.join(", ")}`

      if (existingInventory) {
        // Update existing entry with new notes
        const { error: updateError } = await this.supabase
          .from("user_inventory")
          .update({
            notes: productNotes,
            amount_remaining: amountRemaining, // Reset to full
          })
          .eq("id", existingInventory.id)

        if (updateError) throw updateError
      } else {
        // Insert new inventory entry
        const { error: inventoryError } = await this.supabase.from("user_inventory").insert({
          user_id: userId,
          product_id: productId,
          amount_remaining: amountRemaining,
          purchase_date: new Date().toISOString().split("T")[0],
          notes: productNotes,
        })

        if (inventoryError) throw inventoryError
      }

      return { success: true, actionText: existingInventory ? "updated" : "added" }
    } catch (error) {
      console.error("Error adding product to inventory:", error)
      throw error
    }
  }

  async handleRoutineCompleteAction(
    routineAction: RoutineAction,
    routines: any[],
    markRoutineComplete: (id: string, name: string) => Promise<void>,
  ) {
    try {
      // Find the routine by type
      const routine = routines.find((r) => r.type === routineAction.type && r.is_active)
      if (!routine) {
        alert(`No active ${routineAction.type} routine found`)
        return
      }

      await markRoutineComplete(routine.id, routine.name)
      alert(`${routineAction.type.charAt(0).toUpperCase() + routineAction.type.slice(1)} routine marked as complete!`)
    } catch (error) {
      console.error("Error completing routine:", error)
      alert("Failed to mark routine as complete. Please try again.")
    }
  }

  async handleCabinetAction(
    action: CabinetAction,
    inventory: any[],
    removeFromInventory: (id: string) => Promise<void>,
  ) {
    try {
      if (action.action === "remove") {
        // Find the product in inventory and remove it
        const productToRemove = inventory?.find(
          (item) =>
            item.products?.name.toLowerCase() === action.product_name.toLowerCase() &&
            item.products?.brand.toLowerCase() === action.product_brand.toLowerCase(),
        )

        if (productToRemove) {
          await removeFromInventory(productToRemove.id)
          return {
            success: true,
            message: `✓ Removed ${action.product_name} by ${action.product_brand} from your cabinet.`,
          }
        }
      } else if (action.action === "add" || action.action === "update") {
        // Handle both add and update actions
        // Check if product already exists in inventory for update actions
        const existingInventoryItem = inventory?.find(
          (item) =>
            item.products?.name.toLowerCase() === action.product_name.toLowerCase() ||
            (item.products?.brand.toLowerCase() === action.product_brand.toLowerCase() &&
              item.products?.category === action.category),
        )

        const finalAction = action.action === "update" || existingInventoryItem ? "update" : "add"

        // Create a ProductRecommendation object from the CabinetAction
        const productRecommendation: ProductRecommendation = {
          name: action.product_name,
          brand: action.product_brand,
          category: action.category || "skincare",
          description: `AI-recommended product: ${action.reason}`,
          key_ingredients: [],
          benefits: [],
          reason: action.reason,
        }

        // Use addProductToInventory which handles both existing and AI-researched products
        const result = await this.addProductToInventory(productRecommendation, action.amount_remaining || 100)
        const actionText = finalAction === "update" ? "updated" : "added"
        return {
          success: true,
          message: `✓ ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${action.product_name} by ${action.product_brand} in your collection with detailed information.`,
        }
      }
    } catch (error) {
      console.error("Error handling cabinet action:", error)
      throw error
    }
  }

  async handleCheckinAction(action: any) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split("T")[0]

      // Create or update daily check-in
      const checkinData = {
        user_id: user.id,
        date: today,
        morning_routine_completed: false,
        evening_routine_completed: false,
        skin_condition_rating: null,
        mood_rating: null,
        sleep_hours: null,
        water_intake: null,
        stress_level: null,
        notes: action.notes || null,
      }

      const { error: checkinError } = await this.supabase.from("daily_checkins").upsert(checkinData, {
        onConflict: "user_id,date",
      })

      if (checkinError) throw checkinError

      // Add photos to progress_photos table
      if (action.photo_urls && action.photo_urls.length > 0) {
        const photoInserts = action.photo_urls.map((photoUrl: string) => ({
          user_id: user.id,
          photo_url: photoUrl,
          photo_type: "daily",
          notes: action.notes || null,
          lighting_conditions: action.lighting || "natural",
          skin_condition_rating: null,
        }))

        const { error: photoError } = await this.supabase.from("progress_photos").insert(photoInserts)
        if (photoError) throw photoError

        // Trigger photo analysis
        try {
          const analysisResponse = await fetch("/api/photos/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              photoUrls: action.photo_urls,
              userId: user.id,
              notes: action.notes,
              lightingConditions: action.lighting || "natural",
            }),
          })

          if (analysisResponse.ok) {
            const analysis = await analysisResponse.json()
            return {
              success: true,
              message: `Perfect! I've added your photos to today's check-in. Your photos are being analyzed for personalized insights.`,
              analysis: analysis.analysis.summary,
            }
          }
        } catch (analysisError) {
          console.error("Error analyzing photos:", analysisError)
        }
      }

      return {
        success: true,
        message: `Perfect! I've added your photos to today's check-in. ${action.photo_urls?.length > 0 ? "Your photos are being analyzed for personalized insights." : ""}`,
      }
    } catch (error) {
      console.error("Error adding photos to check-in:", error)
      throw error
    }
  }

  async handleAppointmentAction(action: AppointmentAction) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        alert("Please log in to add appointments")
        return
      }

      console.log("[v0] Original appointment action:", action)
      console.log("[v0] Date string:", action.date)
      console.log("[v0] Time string:", action.time)

      const appointmentDate = new Date(`${action.date}T${action.time}:00`)
      console.log("[v0] Created Date object:", appointmentDate)
      console.log("[v0] Date object toString:", appointmentDate.toString())
      console.log("[v0] Date object toLocaleDateString:", appointmentDate.toLocaleDateString())

      const scheduledDate = appointmentDate.toISOString()
      console.log("[v0] Final scheduled_date for database:", scheduledDate)

      const { error } = await this.supabase.from("appointments").insert({
        user_id: user.id,
        treatment_type: action.treatment_type,
        scheduled_date: scheduledDate, // Use ISO string with timezone info
        provider: action.provider,
        location: action.location || null,
        notes: action.notes || "",
        status: "scheduled",
      })

      if (error) {
        console.error("Error adding appointment:", error)
        alert("Failed to add appointment. Please try again.")
      } else {
        console.log("[v0] Appointment added successfully to database")
        alert("Appointment added successfully!")
        // Refresh data context
        window.dispatchEvent(new CustomEvent("refreshSkincareData"))
      }
    } catch (error) {
      console.error("Error adding appointment:", error)
      alert("Failed to add appointment. Please try again.")
    }
  }

  async createGoal(goal: GoalSuggestion, addGoal: (goal: any) => Promise<void>) {
    try {
      await addGoal({
        title: goal.title,
        description: goal.description,
        target_date: goal.target_date,
        status: "active",
      })

      console.log("[v0] Goal created successfully:", goal.title)
    } catch (error) {
      console.error("Error creating goal:", error)
    }
  }

  async submitWeeklyRoutineForApproval(suggestion: WeeklyRoutineSuggestion) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        alert("Please log in to submit routine suggestions")
        return
      }

      // Store the suggestion in the database with pending status
      const { data: suggestionRecord, error: insertError } = await this.supabase
        .from("routine_suggestions")
        .insert({
          user_id: user.id,
          title: suggestion.title,
          description: suggestion.description,
          weekly_schedule: suggestion.weeklySchedule,
          reasoning: suggestion.reasoning,
          status: "pending_approval",
          suggestion_type: "weekly",
        })
        .select("id")
        .single()

      if (insertError || !suggestionRecord) {
        console.error("[v0] Error submitting routine suggestion:", insertError)
        alert("Failed to submit routine suggestion. Please try again.")
        return null
      }

      console.log("[v0] Weekly routine suggestion submitted for approval")
      return suggestionRecord.id
    } catch (error) {
      console.error("[v0] Error submitting weekly routine suggestion:", error)
      alert("Failed to submit routine suggestion. Please try again.")
      return null
    }
  }

  async approveWeeklyRoutine(suggestionId: string) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        alert("Please log in to approve routines")
        return
      }

      // Get the suggestion details
      const { data: suggestion, error: fetchError } = await this.supabase
        .from("routine_suggestions")
        .select("*")
        .eq("id", suggestionId)
        .eq("user_id", user.id)
        .single()

      if (fetchError || !suggestion) {
        console.error("[v0] Error fetching routine suggestion:", fetchError)
        alert("Failed to find routine suggestion. Please try again.")
        return
      }

      // Deactivate existing routines
      await this.supabase.from("routines").update({ is_active: false }).eq("user_id", user.id)

      // Create new morning and evening routines
      const { data: morningRoutine, error: morningError } = await this.supabase
        .from("routines")
        .insert({
          user_id: user.id,
          name: `${suggestion.title} - Morning`,
          type: "morning",
          is_active: true,
        })
        .select("id")
        .single()

      const { data: eveningRoutine, error: eveningError } = await this.supabase
        .from("routines")
        .insert({
          user_id: user.id,
          name: `${suggestion.title} - Evening`,
          type: "evening",
          is_active: true,
        })
        .select("id")
        .single()

      if (morningError || eveningError || !morningRoutine || !eveningRoutine) {
        console.error("[v0] Error creating routines:", morningError, eveningError)
        alert("Failed to create routines. Please try again.")
        return
      }

      // Create routine steps for each day (using the first day's schedule as template)
      const firstDay = Object.keys(suggestion.weekly_schedule)[0]
      const daySchedule = suggestion.weekly_schedule[firstDay]

      // Create morning routine steps
      if (daySchedule.morning.steps.length > 0) {
        const morningSteps = daySchedule.morning.steps.map((step, index) => ({
          routine_id: morningRoutine.id,
          step_order: index + 1,
          instructions: step.instructions,
          product_id: null, // Will be set when user customizes
          amount: "As needed",
        }))

        await this.supabase.from("routine_steps").insert(morningSteps)
      }

      // Create evening routine steps
      if (daySchedule.evening.steps.length > 0) {
        const eveningSteps = daySchedule.evening.steps.map((step, index) => ({
          routine_id: eveningRoutine.id,
          step_order: index + 1,
          instructions: step.instructions,
          product_id: null, // Will be set when user customizes
          amount: "As needed",
        }))

        await this.supabase.from("routine_steps").insert(eveningSteps)
      }

      // Mark suggestion as approved
      await this.supabase
        .from("routine_suggestions")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", suggestionId)

      console.log("[v0] Weekly routine approved and applied successfully")
      alert("Weekly routine approved and applied! Check your routines tab to see the new schedule.")

      // Refresh the data context
      window.dispatchEvent(new CustomEvent("refreshSkincareData"))
    } catch (error) {
      console.error("[v0] Error approving weekly routine:", error)
      alert("Failed to approve routine. Please try again.")
    }
  }

  async denyWeeklyRoutine(suggestionId: string) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        alert("Please log in to deny routines")
        return
      }

      // Mark suggestion as denied
      const { error } = await this.supabase
        .from("routine_suggestions")
        .update({ status: "denied", denied_at: new Date().toISOString() })
        .eq("id", suggestionId)
        .eq("user_id", user.id)

      if (error) {
        console.error("[v0] Error denying routine suggestion:", error)
        alert("Failed to deny routine suggestion. Please try again.")
        return
      }

      console.log("[v0] Weekly routine suggestion denied")
      alert("Routine suggestion denied. You can ask for a new suggestion anytime!")
    } catch (error) {
      console.error("[v0] Error denying weekly routine:", error)
      alert("Failed to deny routine. Please try again.")
    }
  }

  async handleWeeklyRoutineApproval(approval: WeeklyRoutineApproval, onApprovalComplete?: () => void) {
    try {
      if (approval.action === "approve") {
        await this.approveWeeklyRoutine(approval.suggestion_id)
      } else if (approval.action === "deny") {
        await this.denyWeeklyRoutine(approval.suggestion_id)
      }

      if (onApprovalComplete) {
        onApprovalComplete()
      }
    } catch (error) {
      console.error("Error handling weekly routine approval:", error)
      throw error
    }
  }
}
