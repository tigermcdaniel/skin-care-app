/**
 * API Types
 * 
 * Type definitions for API requests and responses.
 */

/**
 * User data structure for chat context
 */
export interface UserData {
  profile: any
  inventory: any[]
  routines: any[]
  routinesByDay: Record<string, { morning: any; evening: any }>
  weeklyCheckIns: any[]
  recentProgress: any[]
  recentCheckins: any[]
  activeGoals: any[]
  pendingSuggestions: any[]
}

/**
 * Processed message structure for AI processing
 */
export interface ProcessedMessage {
  role: "user" | "assistant" | "system"
  content: string | Array<{ type: string; text: string }>
}

/**
 * Message processing result
 */
export interface MessageProcessingResult {
  processedMessages: ProcessedMessage[]
  imagesForLaterStorage: string[]
}
