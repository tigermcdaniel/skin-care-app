import { streamText } from "ai"
import { groq } from "@ai-sdk/groq"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const supabase = await createClient()

    // Get user context
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get user profile and context
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Get user's current products
    const { data: inventory } = await supabase
      .from("user_inventory")
      .select(`
        *,
        products (name, brand, category, ingredients)
      `)
      .eq("user_id", user.id)

    // Get user's routines
    const { data: routines } = await supabase
      .from("routines")
      .select(`
        *,
        routine_steps (
          *,
          products (name, brand)
        )
      `)
      .eq("user_id", user.id)

    // Get recent progress
    const { data: recentProgress } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    const systemPrompt = `You are an expert skincare assistant helping users with personalized advice. Here's the user's context:

SKIN PROFILE:
- Skin Type: ${profile?.skin_type || "Not specified"}
- Skin Concerns: ${profile?.skin_concerns || "Not specified"}
- Age: ${profile?.age || "Not specified"}

CURRENT PRODUCTS (${inventory?.length || 0} items):
${inventory?.map((item) => `- ${item.products?.name} by ${item.products?.brand} (${item.products?.category})`).join("\n") || "No products in inventory"}

CURRENT ROUTINES:
${
  routines
    ?.map(
      (routine) => `
${routine.type.toUpperCase()} ROUTINE:
${routine.routine_steps?.map((step: any) => `  ${step.step_order}. ${step.products?.name} - ${step.instructions}`).join("\n") || "  No steps defined"}
`,
    )
    .join("\n") || "No routines set up"
}

RECENT PROGRESS:
${recentProgress?.map((progress) => `- ${progress.created_at}: Skin condition ${progress.skin_condition}/10, Notes: ${progress.notes || "None"}`).join("\n") || "No recent progress logged"}

INSTRUCTIONS:
1. Provide personalized skincare advice based on their profile and current products
2. When recommending products, use this format: [PRODUCT]{"name": "Product Name", "brand": "Brand", "reason": "Why this product helps"}[/PRODUCT]
3. When suggesting routine changes, use this format: [ROUTINE]{"type": "morning", "changes": ["Change 1", "Change 2"]}[/ROUTINE]
4. When suggesting treatments, use this format: [TREATMENT]{"type": "Treatment Name", "reason": "Why needed", "frequency": "How often"}[/TREATMENT]
5. Be encouraging and supportive
6. Ask follow-up questions to better understand their concerns
7. Reference their current products and routines when giving advice
8. Consider their skin type and concerns in all recommendations

Respond naturally and conversationally while incorporating the structured data when making specific recommendations.`

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
