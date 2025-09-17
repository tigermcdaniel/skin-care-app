import { groq } from "@ai-sdk/groq"
import { openai } from "@ai-sdk/openai"

// AI Provider configurations
export const aiProviders = {
  groq: groq,
  openai: openai,
} as const

// Model configurations
export const models = {
  groq: {
    versatile: "llama-3.3-70b-versatile",
  },
  openai: {
    gpt4o: "gpt-4o",
  },
} as const

// Helper function to get configured models
export function getModel(provider: keyof typeof aiProviders, model: string) {
  return aiProviders[provider](model)
}
