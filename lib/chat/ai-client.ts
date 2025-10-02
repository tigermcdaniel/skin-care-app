import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { ProcessedMessage } from "./types/api"

/**
 * Handles AI model interaction and streaming response
 */
export async function generateAIResponse(
  systemPrompt: string,
  messages: ProcessedMessage[]
): Promise<ReadableStream> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  const coreMessages = messages.map((m) => ({
    role: m.role,
    content: Array.isArray(m.content) ? m.content : [{ type: "text", text: String(m.content ?? "") }],
  }))

  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: coreMessages,
    temperature: 0.7,
    maxOutputTokens: 8000,
  })

  return result.toTextStreamResponse()
}
