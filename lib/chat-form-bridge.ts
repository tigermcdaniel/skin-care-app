export interface ChatFormData {
  type: "routine" | "product" | "goal" | "checkin"
  data: any
  context?: string
}

export function encodeChatData(data: ChatFormData): string {
  return encodeURIComponent(JSON.stringify(data))
}

export function decodeChatData(encodedData: string): ChatFormData | null {
  try {
    return JSON.parse(decodeURIComponent(encodedData))
  } catch (error) {
    console.error("Error decoding chat data:", error)
    return null
  }
}

export function buildFormUrlWithChatData(basePath: string, chatData: ChatFormData): string {
  const encodedData = encodeChatData(chatData)
  return `${basePath}?chatData=${encodedData}`
}

// Helper functions for specific form types
export function buildRoutineBuilderUrl(routineData: {
  name?: string
  type?: string
  steps?: Array<{
    productName: string
    brand?: string
    instructions: string
    amount: string
  }>
}): string {
  const prompt = `Help me build a ${routineData.type || "skincare"} routine${routineData.name ? ` called "${routineData.name}"` : ""}`
  return `/chat/new-session?prompt=${encodeURIComponent(prompt)}`
}

export function buildProductRecommendationUrl(
  products: Array<{
    name: string
    brand: string
    reason: string
    category?: string
  }>,
): string {
  const productNames = products.map((p) => `${p.name} by ${p.brand}`).join(", ")
  const prompt = `Tell me more about these recommended products: ${productNames}`
  return `/chat/new-session?prompt=${encodeURIComponent(prompt)}`
}

export function buildGoalSuggestionUrl(
  goals: Array<{
    title: string
    description: string
    targetDate?: string
    category?: string
  }>,
): string {
  const goalTitles = goals.map((g) => g.title).join(", ")
  const prompt = `Help me set up these skincare goals: ${goalTitles}`
  return `/chat/new-session?prompt=${encodeURIComponent(prompt)}`
}
