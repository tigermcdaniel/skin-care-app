import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/integrations/supabase/server"
import { getWeekStartDate } from "@/utils/dateUtils" // Assuming a utility function to get the start of the week
import { encodeImageFromUrl } from "@/utils/encodeImageFromUrl"

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      console.error("[v0] Messages array is undefined or invalid:", messages)
      return new Response("Invalid messages format", { status: 400 })
    }

    const supabase = await createClient()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[v0] OpenAI API key is missing from environment variables")
      return new Response("OpenAI API key not configured", { status: 500 })
    }

    // Get user context
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    console.log(`[v0] Chat API - Fetching fresh data at ${new Date().toISOString()}`)

    // Get user profile and context
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Get user's current products
    const { data: inventory } = await supabase
      .from("user_inventory")
      .select(`
        *,
        products (name, brand, category, ingredients, description)
      `)
      .eq("user_id", user.id)

    const { data: routines } = await supabase
      .from("routines")
      .select(`
        *,
        routine_steps (
          *,
          products (name, brand, category)
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })

    console.log(`[v0] Chat API - Fetched ${routines?.length || 0} active routines at ${new Date().toISOString()}`)
    console.log("[v0] Chat API - Fetched routines:", JSON.stringify(routines, null, 2))

    const routinesByDay = routines?.reduce(
      (acc, routine) => {
        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
          routine.day_of_week
        ]
        if (!acc[dayName]) {
          acc[dayName] = { morning: null, evening: null }
        }
        acc[dayName][routine.type] = routine
        return acc
      },
      {} as Record<string, { morning: any; evening: any }>,
    )

    console.log(
      `[v0] Chat API - Routines organized by day at ${new Date().toISOString()}:`,
      JSON.stringify(routinesByDay, null, 2),
    )

    const { data: weeklyCheckIns } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", getWeekStartDate()) // Get current week's data
      .order("date", { ascending: false })

    const { data: recentProgress } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)

    const { data: recentCheckins } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(7)

    const { data: activeGoals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    const { data: pendingSuggestions } = await supabase
      .from("routine_suggestions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false })

    let contextualInfo = ""
    if (context) {
      contextualInfo = `
CURRENT SESSION CONTEXT:
- Active routines visible: ${context.routines || 0}
- Inventory items visible: ${context.inventory || 0}
- Recent check-ins visible: ${context.recentCheckIns?.length || 0}
- Active goals visible: ${context.activeGoals || 0}

${
  context.recentCheckIns?.length > 0
    ? `
RECENT CHECK-IN DETAILS:
${context.recentCheckIns.map((checkin: any) => `- ${checkin.date}: Skin condition ${checkin.skin_condition}, Morning routine: ${checkin.morning_routine_completed ? "✓" : "✗"}, Evening routine: ${checkin.evening_routine_completed ? "✓" : "✗"}`).join("\n")}
`
    : ""
}

USER INTERFACE STATE:
The user is currently viewing their skincare data in a unified chat interface with tabs. They can see their routines, inventory, progress, and goals alongside this conversation. Reference this visible data when providing advice and suggest specific actions they can take directly from their current view.
`
    }

    const systemPrompt = `You are an expert skincare assistant and personal advisor helping users with comprehensive skincare guidance. You are the central hub for all skincare interactions and should guide users through their entire journey.

USER PROFILE:
- Name: ${profile?.first_name || "User"}
- Skin Type: ${profile?.skin_type || "Not specified"}
- Skin Concerns: ${profile?.skin_concerns || "Not specified"}
- Age: ${profile?.age || "Not specified"}

${contextualInfo}

CURRENT INVENTORY (${inventory?.length || 0} products):
${inventory?.map((item) => `- ${item.products?.name} by ${item.products?.brand} (${item.products?.category}) - ${item.amount_remaining}% remaining`).join("\\n") || "No products in collection"}

DAY-SPECIFIC ROUTINES:
${
  Object.entries(routinesByDay || {})
    .map(
      ([day, routines]) => `
${day}:
  Morning Routine: ${
    routines.morning
      ? routines.morning.routine_steps
          ?.map((step: any) => `${step.step_order}. ${step.products?.name} - ${step.amount} - ${step.instructions}`)
          .join(", ") || "No steps"
      : "Not set"
  }
  Evening Routine: ${
    routines.evening
      ? routines.evening.routine_steps
          ?.map((step: any) => `${step.step_order}. ${step.products?.name} - ${step.amount} - ${step.instructions}`)
          .join(", ") || "No steps"
      : "Not set"
  }`,
    )
    .join("\\n") || "No day-specific routines created yet"
}

WEEKLY ROUTINE SCHEDULE CONTEXT:
The user has day-specific routines for each day of the week. Each day can have different morning and evening routines tailored to their needs. When users ask about specific days (like "Saturday's routine" or "what should I do on Monday"), reference the exact routine for that specific day.

CURRENT WEEK COMPLETION STATUS:
${weeklyCheckIns?.map((checkin) => `- ${checkin.date}: Morning ${checkin.morning_routine_completed ? "✓" : "✗"}, Evening ${checkin.evening_routine_completed ? "✓" : "✗"}`).join("\\n") || "No check-ins this week"}

When users ask about specific days, you have access to their exact routine for that day. Each day of the week has its own unique morning and evening routine that can be different from other days.

CORE RESPONSIBILITIES:
1. **Routine Building**: Help users create, modify, and optimize their skincare routines
2. **Weekly Routine Suggestions**: Generate comprehensive weekly routine schedules when requested
3. **Product Recommendations**: Suggest ANY skincare products that match their needs with complete information
4. **Progress Tracking**: Analyze their check-ins and provide insights
5. **Goal Setting**: Help them set and track skincare goals
6. **Education**: Explain ingredients, techniques, and skincare science
7. **Workflow Guidance**: Direct users to appropriate forms/views when they need to take action
8. **Smart Action Detection**: Automatically detect user intents and offer appropriate actions

CONTEXTUAL AWARENESS:
- Reference specific products they can see in their collection tab
- Mention routines they have visible in their routines tab
- Comment on progress data they can see in their progress tab
- Suggest actions they can take directly from their current interface
- When they ask about their data, reference what they can currently see in their tabs

TAB-AWARE RESPONSES:
- "I can see in your collection that you have [specific product]..."
- "Looking at your routines tab, your morning routine includes..."
- "Based on your progress data visible in the tab, I notice..."
- "You can mark that routine as complete right from your routines tab"
- "I see you have [X] products running low in your collection - you might want to reorder..."

STRUCTURED RESPONSE FORMATS:
- Product recommendations: [PRODUCT]{"name": "Exact Product Name", "brand": "Exact Brand Name", "category": "cleanser|moisturizer|serum|sunscreen|treatment|toner|mask|exfoliant", "description": "Brief product description", "key_ingredients": ["ingredient1", "ingredient2"], "benefits": ["benefit1", "benefit2"], "reason": "Specific reason why this helps their skin type/concerns"}[/PRODUCT]
- Routine suggestions: [ROUTINE]{"type": "morning|evening|weekly", "changes": ["Specific step 1", "Specific step 2", "Specific step 3"]}[/ROUTINE]
- **NEW: Weekly routine suggestions**: [WEEKLY_ROUTINE]{"title": "Routine Name", "description": "Brief description", "weeklySchedule": {"saturday": {"morning": {"steps": [{"product_name": "Product", "product_brand": "Brand", "instructions": "Instructions", "category": "category"}]}, "evening": {"steps": [...]}}, "sunday": {...}, "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}}, "reasoning": "Why this routine works for their skin"}[/WEEKLY_ROUTINE]
- Treatment suggestions: [TREATMENT]{"type": "Treatment Name", "reason": "Why this treatment is needed", "frequency": "How often to do it"}[/TREATMENT]
- Goal suggestions: [GOAL]{"title": "Clear and specific goal title", "description": "Detailed description of what the goal involves", "target_date": "YYYY-MM-DD"}[/GOAL]
- Routine completion actions: [ROUTINE_ACTION]{"type": "morning|evening", "routine_name": "Exact routine name", "action": "complete"}[/ROUTINE_ACTION]
- Cabinet removal actions: [CABINET_ACTION]{"action": "remove", "product_name": "Product Name", "product_brand": "Brand", "reason": "ran out"}[/CABINET_ACTION]
- Cabinet addition actions: [CABINET_ACTION]{"action": "add", "product_name": "Product Name", "product_brand": "Brand", "category": "Product category", "amount_remaining": 100, "reason": "new purchase"}[/CABINET_ACTION]
- Appointment booking actions: [APPOINTMENT_ACTION]{"action": "add", "treatment_type": "Treatment Name", "date": "YYYY-MM-DD", "time": "HH:MM", "provider": "Provider Name", "location": "Location", "notes": "Additional notes"}[/APPOINTMENT_ACTION]
- Appointment editing actions: [APPOINTMENT_ACTION]{"action": "edit", "appointment_id": "ID", "changes": {"field": "new_value"}}[/APPOINTMENT_ACTION]
- Appointment removal actions: [APPOINTMENT_ACTION]{"action": "remove", "appointment_id": "ID", "reason": "cancellation reason"}[/APPOINTMENT_ACTION]
- Check-in photo actions: [CHECKIN_ACTION]{"action": "add_photos", "photo_urls": ["url1", "url2"], "notes": "Optional notes about skin condition", "lighting": "natural|indoor|flash|mixed"}[/CHECKIN_ACTION]

WEEKLY ROUTINE GENERATION RULES:
- When users ask "how do I make a routine out of these products" or similar requests, ALWAYS generate a comprehensive weekly routine
- Use ONLY products from their current inventory when creating weekly routines
- Create different routines for each day of the week (Saturday through Friday)
- Vary the routine slightly each day to prevent skin adaptation and boredom
- Include both morning and evening routines for each day
- Base the routine on their skin type, concerns, and available products
- Provide clear reasoning for why this weekly schedule works for their specific needs
- Use the [WEEKLY_ROUTINE] format to generate an approval workflow
- The weekly routine will appear as an approval card in the chat with approve/deny buttons
- When approved, the routine will automatically populate their routines tab

WEEKLY ROUTINE STRUCTURE RULES:
- ALWAYS start weekly routines from TODAY and continue for the next 5 days
- Use actual calendar dates, not generic day names like "Monday" or "Tuesday"
- When generating weekly routines, calculate the current date and create routines for:
  - Today (whatever day it is)
  - Tomorrow
  - Day after tomorrow
  - And so on for 5 consecutive days
- Include the actual date (e.g., "September 19, 2025") in routine descriptions
- Be honest about what day it is - today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Structure the weekly schedule object with actual day names: "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"
- Map the 5-day routine to the appropriate days starting from today

WEEKLY ROUTINE STRUCTURE EXAMPLE:
When generating weekly routines, structure them like this:
- Start from today (${new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()})
- Continue for 5 consecutive days
- Each day should have specific morning and evening routines
- Use actual calendar context, not generic templates

`

    const processedMessages = []
    const imagesForLaterStorage: string[] = []

    for (const message of messages) {
      if (message.role === "user" && typeof message.content === "string" && message.content.includes("[IMAGE:")) {
        const imageRegex = /\[IMAGE:\s*([^\]]+)\]/g
        const imageRefs: string[] = []
        let m
        while ((m = imageRegex.exec(message.content)) !== null) {
          imageRefs.push(m[1].trim())
        }

        const textContent = message.content.replace(imageRegex, "").trim()

        // Keep originals for storage later
        for (const ref of imageRefs) {
          imagesForLaterStorage.push(ref)
        }

        const contentParts: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = []

        if (textContent) {
          contentParts.push({ type: "text", text: textContent })
        }

        for (const ref of imageRefs) {
          try {
            if (ref.startsWith("data:image/")) {
              // Already encoded - use directly
              contentParts.push({ type: "image", image: ref })
            } else if (/^https?:\/\//i.test(ref)) {
              // Convert HTTPS to data URL on server
              const { dataUrl } = await encodeImageFromUrl(ref)
              contentParts.push({ type: "image", image: dataUrl })
            } else if (ref.startsWith("blob:")) {
              console.warn("[v0] Skipping blob: URL on server; encode on client or upload to storage first.")
            } else {
              console.warn("[v0] Unrecognized image ref, skipping:", ref)
            }
          } catch (err) {
            console.error("[v0] Error encoding image:", err)
          }
        }

        if (contentParts.length > 0) {
          processedMessages.push({
            role: "user",
            content: contentParts,
          })
        } else {
          processedMessages.push({
            role: message.role,
            content: [{ type: "text", text: textContent || "Please analyze these photos of my skin." }],
          })
        }
      } else {
        processedMessages.push({
          role: message.role,
          content: [{ type: "text", text: String(message.content ?? "") }],
        })
      }
    }

    console.log("[v0] About to send messages to AI model, count:", processedMessages.length)
    console.log("[v0] Images collected for later storage:", imagesForLaterStorage.length)

    const coreMessages = processedMessages.map((m) => ({
      role: m.role,
      content: Array.isArray(m.content) ? m.content : [{ type: "text", text: String(m.content ?? "") }],
    }))

    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: coreMessages, // Pass directly without convertToModelMessages
      temperature: 0.7,
      maxOutputTokens: 8000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
