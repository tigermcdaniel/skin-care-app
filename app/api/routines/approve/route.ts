import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { generateUUID } from "@/lib/uuid"

export async function POST(request: NextRequest) {
  try {
    const { suggestionId, routineData } = await request.json()
    console.log("[v0] Approving routine suggestion:", suggestionId)

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Routine approved for user:", user.id)

    const { error: suggestionError } = await supabase.from("routine_suggestions").upsert({
      id: suggestionId,
      user_id: user.id,
      title: routineData.title,
      description: routineData.description,
      weekly_schedule: routineData.weeklySchedule,
      status: "approved",
      approved_at: new Date().toISOString(),
      suggestion_type: "weekly",
    })

    if (suggestionError) {
      console.error("[v0] Error saving routine suggestion:", suggestionError)
      return NextResponse.json({ error: "Failed to save routine suggestion" }, { status: 500 })
    }

    await supabase.from("routines").update({ is_active: false }).eq("user_id", user.id)

    const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
    const routinesToCreate = []

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const dayName = days[dayIndex]
      const daySchedule = routineData.weeklySchedule[dayName]

      const dayOfWeek = dayIndex === 0 ? 6 : dayIndex - 1

      if (daySchedule?.morning?.steps?.length > 0) {
        routinesToCreate.push({
          id: generateUUID(),
          user_id: user.id,
          name: `Morning Routine - ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
          type: "morning",
          day_of_week: dayOfWeek, // Saturday=6, Sunday=0, Monday=1, etc.
          is_active: true,
        })
      }

      if (daySchedule?.evening?.steps?.length > 0) {
        routinesToCreate.push({
          id: generateUUID(),
          user_id: user.id,
          name: `Evening Routine - ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
          type: "evening",
          day_of_week: dayOfWeek,
          is_active: true,
        })
      }
    }

    const { error: routineError } = await supabase.from("routines").insert(routinesToCreate)

    if (routineError) {
      console.error("[v0] Error creating routines:", routineError)
      return NextResponse.json({ error: "Failed to create routines" }, { status: 500 })
    }

    const createOrFindProduct = async (productName: string, productBrand: string, category: string) => {
      // First, try to find existing product
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("name", productName)
        .eq("brand", productBrand)
        .single()

      if (existingProduct) {
        return existingProduct.id
      }

      // If not found, create new product
      const newProduct = {
        id: generateUUID(),
        name: productName,
        brand: productBrand,
        category: category,
        description: `${productBrand} ${productName}`,
      }

      const { data: createdProduct, error: productError } = await supabase
        .from("products")
        .insert(newProduct)
        .select("id")
        .single()

      if (productError) {
        console.error("[v0] Error creating product:", productError)
        throw new Error(`Failed to create product: ${productName}`)
      }

      return createdProduct.id
    }

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const dayName = days[dayIndex]
      const daySchedule = routineData.weeklySchedule[dayName]

      const dayOfWeek = dayIndex === 0 ? 6 : dayIndex - 1

      // Find the morning routine for this day
      const morningRoutine = routinesToCreate.find((r) => r.type === "morning" && r.day_of_week === dayOfWeek)

      if (morningRoutine && daySchedule?.morning?.steps?.length > 0) {
        const morningSteps = []

        for (let i = 0; i < daySchedule.morning.steps.length; i++) {
          const step = daySchedule.morning.steps[i]
          const productId = await createOrFindProduct(step.product_name, step.product_brand, step.category)

          morningSteps.push({
            id: generateUUID(),
            routine_id: morningRoutine.id,
            product_id: productId,
            step_order: i + 1,
            instructions: step.instructions || "",
            amount: "As needed",
          })
        }

        const { error: morningStepsError } = await supabase.from("routine_steps").insert(morningSteps)

        if (morningStepsError) {
          console.error("[v0] Error creating morning routine steps:", morningStepsError)
          return NextResponse.json({ error: "Failed to create morning routine steps" }, { status: 500 })
        }
      }

      // Find the evening routine for this day
      const eveningRoutine = routinesToCreate.find((r) => r.type === "evening" && r.day_of_week === dayOfWeek)

      if (eveningRoutine && daySchedule?.evening?.steps?.length > 0) {
        const eveningSteps = []

        for (let i = 0; i < daySchedule.evening.steps.length; i++) {
          const step = daySchedule.evening.steps[i]
          const productId = await createOrFindProduct(step.product_name, step.product_brand, step.category)

          eveningSteps.push({
            id: generateUUID(),
            routine_id: eveningRoutine.id,
            product_id: productId,
            step_order: i + 1,
            instructions: step.instructions || "",
            amount: "As needed",
          })
        }

        const { error: eveningStepsError } = await supabase.from("routine_steps").insert(eveningSteps)

        if (eveningStepsError) {
          console.error("[v0] Error creating evening routine steps:", eveningStepsError)
          return NextResponse.json({ error: "Failed to create evening routine steps" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error approving routine:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
