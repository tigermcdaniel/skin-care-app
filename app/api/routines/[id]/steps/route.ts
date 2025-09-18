import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { steps } = await request.json()
    const routineId = params.id

    console.log("[v0] Updating routine steps for routine:", routineId)

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

    // Verify the routine belongs to the user
    const { data: routine, error: routineError } = await supabase
      .from("routines")
      .select("id")
      .eq("id", routineId)
      .eq("user_id", user.id)
      .single()

    if (routineError || !routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 })
    }

    // Delete existing steps
    const { error: deleteError } = await supabase.from("routine_steps").delete().eq("routine_id", routineId)

    if (deleteError) {
      console.error("[v0] Error deleting existing steps:", deleteError)
      return NextResponse.json({ error: "Failed to delete existing steps" }, { status: 500 })
    }

    // Insert new steps if any
    if (steps && steps.length > 0) {
      const stepsToInsert = steps.map((step: any, index: number) => ({
        routine_id: routineId,
        product_id: step.product_id,
        step_order: index + 1,
        instructions: step.instructions || null,
        amount: step.amount || null,
      }))

      const { error: insertError } = await supabase.from("routine_steps").insert(stepsToInsert)

      if (insertError) {
        console.error("[v0] Error inserting new steps:", insertError)
        return NextResponse.json({ error: "Failed to insert new steps" }, { status: 500 })
      }
    }

    console.log("[v0] Successfully updated routine steps")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating routine steps:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
