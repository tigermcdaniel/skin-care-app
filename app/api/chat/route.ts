import { createClient } from "@/integrations/supabase/server"
import { fetchUserData } from "@/lib/chat/user-data-fetcher"
import { processMessages } from "@/lib/chat/message-processor"
import { generateSystemPrompt } from "@/lib/chat/system-prompt-generator"
import { generateAIResponse } from "@/lib/chat/ai-client"
/**
 * Handles POST requests to the chat API endpoint for AI-powered skincare conversations
 * 
 * This endpoint processes user messages and generates context-aware responses from the AI skincare advisor.
 * It fetches comprehensive user data including routines, inventory, check-ins, and goals to provide
 * personalized skincare advice. The response is streamed in real-time for better user experience.
 * 
 * Request Processing:
 * - Validates message format and user authentication
 * - Fetches user's complete skincare profile from Supabase
 * - Retrieves active routines, product inventory, recent check-ins, and goals
 * - Processes any uploaded images for skin analysis
 * - Constructs comprehensive context for AI model
 * - Streams AI response in real-time chunks
 * 
 * Context Data Retrieved:
 * - User profile information and skin type
 * - Active routines with completion status
 * - Product inventory with usage tracking
 * - Recent check-ins with photos and notes
 * - Current goals and progress tracking
 * - Appointment history and upcoming treatments
 * 
 * @param {Request} req - HTTP request object containing messages array, context data, and optional images
 * @returns {Promise<Response>} Streaming text response from OpenAI GPT-4o model with skincare advice
 * 
 * @throws {Error} When messages array is missing or invalid format
 * @throws {Error} When OpenAI API key is not configured
 * @throws {Error} When user authentication fails or user not found
 * @throws {Error} When database query fails to retrieve user data
 * @throws {Error} When AI model fails to generate response or exceeds rate limits
 */
export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      console.error("[v0] Messages array is undefined or invalid:", messages)
      return new Response("Invalid messages format", { status: 400 })
    }

    const supabase = await createClient()

    // Get user context
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    console.log(`[v0] Chat API - Fetching fresh data at ${new Date().toISOString()}`)

    // Fetch all user data
    const userData = await fetchUserData(user.id)
    
    console.log(`[v0] Chat API - Fetched ${userData.routines?.length || 0} active routines at ${new Date().toISOString()}`)
    console.log("[v0] Chat API - Fetched routines:", JSON.stringify(userData.routines, null, 2))
    console.log(
      `[v0] Chat API - Routines organized by day at ${new Date().toISOString()}:`,
      JSON.stringify(userData.routinesByDay, null, 2),
    )

    // Process messages (handle images, etc.)
    const { processedMessages, imagesForLaterStorage } = await processMessages(messages)

    console.log("[v0] About to send messages to AI model, count:", processedMessages.length)
    console.log("[v0] Images collected for later storage:", imagesForLaterStorage.length)

    // Generate system prompt
    const systemPrompt = generateSystemPrompt(userData, context)

    // Generate AI response
    return await generateAIResponse(systemPrompt, processedMessages)
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
