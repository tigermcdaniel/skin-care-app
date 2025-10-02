/**
 * Chat Types
 * 
 * Type definitions for chat functionality and messaging.
 */

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

/**
 * Tab types for the chat interface
 */
export type TabType = "routines" | "collection" | "calendar" | "treatments" | "checkin" | null

/**
 * Quick command suggestions
 */
export const QUICK_COMMANDS = [
  "What's my morning routine?",
  "Help me build a routine.",
  "What is in my cabinet?",
  "Do i have any upcoming appointments?",
  "Let's add a product to my cabinet.",
]
