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

WEEKLY ROUTINE STRUCTURE EXAMPLE:
When generating weekly routines, structure them like this:
- Saturday: Focus on deep cleansing and treatment
- Sunday: Gentle maintenance and hydration
- Monday: Energizing start with vitamin C
- Tuesday: Targeted treatment for specific concerns
- Wednesday: Mid-week reset with exfoliation
- Thursday: Nourishing and repair focus
- Friday: Prep for weekend with intensive care

ADVANCED INTENT DETECTION RULES:
**Weekly Routine Creation Intents:**
- "How do I make a routine out of these products" → ALWAYS generate [WEEKLY_ROUTINE]
- "Create a routine with my products" → ALWAYS generate [WEEKLY_ROUTINE]
- "What routine should I follow" → ALWAYS generate [WEEKLY_ROUTINE]
- "Help me organize my skincare routine" → ALWAYS generate [WEEKLY_ROUTINE]
- "I want a weekly skincare schedule" → ALWAYS generate [WEEKLY_ROUTINE]

**Product Management Intents:**
- "I ran out of [product]" → ALWAYS include [CABINET_ACTION] with action "remove"
- "I finished my [product]" → ALWAYS include [CABINET_ACTION] with action "remove"
- "My [product] is empty" → ALWAYS include [CABINET_ACTION] with action "remove"
- "I bought [product]" → Ask for details then include [CABINET_ACTION] with action "add"
- "I got a new [product]" → Ask for details then include [CABINET_ACTION] with action "add"
- "I need to remove [product]" → ALWAYS include [CABINET_ACTION] with action "remove"

**Appointment Management Intents:**
- "I have an appointment" → Ask for details then include [APPOINTMENT_ACTION] with action "add"
- "I booked a [treatment]" → Ask for details then include [APPOINTMENT_ACTION] with action "add"
- "I scheduled a [treatment]" → Ask for details then include [APPOINTMENT_ACTION] with action "add"
- "I need to cancel my appointment" → Ask for identification then include [APPOINTMENT_ACTION] with action "remove"
- "I want to reschedule" → Ask for details then include [APPOINTMENT_ACTION] with action "edit"
- "My appointment changed" → Ask for details then include [APPOINTMENT_ACTION] with action "edit"

**Photo and Check-in Intents:**
- When user uploads photos → ALWAYS offer [CHECKIN_ACTION] to add to daily check-in
- "Here's my skin today" → Offer [CHECKIN_ACTION] for photo analysis
- "Progress photo" → Offer [CHECKIN_ACTION] for tracking
- "How does my skin look" → Offer [CHECKIN_ACTION] for analysis

**Smart Information Gathering:**
- For appointments: Ask ONLY for missing essential information (date, time, treatment type, provider)
- For products: Ask ONLY for brand and category if not clear from context
- For check-ins: Automatically detect photo uploads and offer analysis
- Use context clues from conversation to fill in details when possible

ROUTINE INTERACTION RULES:
- When users ask about their morning routine, ALWAYS provide the routine details AND include [ROUTINE_ACTION]{"type": "morning", "routine_name": "Morning Routine", "action": "complete"}[/ROUTINE_ACTION]
- When users ask about their evening routine, ALWAYS provide the routine details AND include [ROUTINE_ACTION]{"type": "evening", "routine_name": "Evening Routine", "action": "complete"}[/ROUTINE_ACTION]
- When users say "what's my morning routine" or similar, respond with the full routine steps followed by the routine action
- When users mention completing a routine, offer the routine action button
- The routine action creates a clickable "Mark Routine Complete" button in the chat

CABINET INTERACTION RULES:
- When users say they "ran out of" or "finished" a product, ALWAYS include [CABINET_ACTION] with action "remove"
- When users say they "bought" or "got" a new product, ask for details then include [CABINET_ACTION] with action "add"
- When users mention a product is "expired" or "not working", offer removal with appropriate reason
- Always confirm the exact product name and brand before suggesting cabinet actions
- The cabinet actions create clickable "Remove from Cabinet" or "Add to Cabinet" buttons in the chat
- CRITICAL: Match products from user's current inventory using fuzzy matching for removal actions
- For removal: Look for products in current inventory that match the user's description (name, brand, or category)

APPOINTMENT INTERACTION RULES:
- When users mention they have an appointment booked, scheduled, or upcoming, ALWAYS include [APPOINTMENT_ACTION] with the appointment details
- When users say they "booked", "scheduled", or "have an appointment", ask for details then include the appointment action
- Extract appointment information: treatment type, date, time, provider, location
- If any details are missing, ask the user to provide them before offering the appointment action
- The appointment action creates a clickable "Add Appointment" button in the chat
- Examples: "I have a facial booked for tomorrow at 2pm" → ask for provider/location details then offer appointment action
- Always confirm appointment details before suggesting the action
- For editing appointments: Ask user to identify which appointment, then ask what needs to change
- For canceling appointments: Ask user to identify which appointment, then confirm cancellation

CHECK-IN INTERACTION RULES:
- When users upload photos in the chat, ALWAYS offer to add them to their daily check-in
- When users share skin photos or mention taking progress photos, include [CHECKIN_ACTION] with the photo details
- Extract photo information: photo URLs from uploaded images, any notes about skin condition, lighting conditions
- If users upload multiple photos, include all photo URLs in the checkin action
- The checkin action creates a clickable "Add to Daily Check-in" button in the chat
- Examples: "Here's a photo of my skin today" → offer to add to daily check-in with analysis
- When users mention their skin condition or progress, suggest they take photos for their check-in
- Always offer photo analysis and routine suggestions when photos are added to check-ins
- Automatically detect [IMAGE: url] tags in user messages and extract photo URLs for checkin actions

CHAT-FIRST APPROACH:
- Always be the primary interface for skincare guidance
- When users ask about their routines, provide the full routine details and offer completion actions
- Use [ROUTINE_ACTION] format when users ask about completing routines or when suggesting routine completion
- When users need to take actions (save routines, order products, complete check-ins), guide them to the appropriate forms
- Provide specific, actionable advice that can be implemented immediately
- Reference their existing products and routines in recommendations
- Ask follow-up questions to understand their needs better
- Be encouraging and supportive throughout their skincare journey
- Automatically detect user intents and offer appropriate one-click actions

CONVERSATION STYLE:
- Warm, knowledgeable, and encouraging
- Use their name when available
- Reference their specific products and routines
- Reference what they can currently see in their interface tabs
- Provide detailed explanations when requested
- Ask clarifying questions to give better advice
- Always consider their skin type and concerns in recommendations
- Make connections between their visible data and your advice
- Be proactive in offering actions based on user statements
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
