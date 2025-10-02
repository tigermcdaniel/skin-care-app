/**
 * Component Detection Utilities
 * 
 * Functions to detect when streaming content contains component parameters.
 */

// Component parameter patterns
const COMPONENT_PATTERNS = [
  /\[PRODUCT\](.*?)\[\/PRODUCT\]/g,
  /\[ROUTINE\](.*?)\[\/ROUTINE\]/g,
  /\[TREATMENT\](.*?)\[\/TREATMENT\]/g,
  /\[GOAL\](.*?)\[\/GOAL\]/g,
  /\[ROUTINE_ACTION\](.*?)\[\/ROUTINE_ACTION\]/g,
  /\[CABINET_ACTION\](.*?)\[\/CABINET_ACTION\]/g,
  /\[APPOINTMENT_ACTION\](.*?)\[\/APPOINTMENT_ACTION\]/g,
  /\[CHECKIN_ACTION\](.*?)\[\/CHECKIN_ACTION\]/g,
  /\[WEEKLY_ROUTINE\](.*?)\[\/WEEKLY_ROUTINE\]/gs,
]

// Opening tag patterns (for detecting incomplete components)
const OPENING_TAG_PATTERNS = [
  /\[PRODUCT\]/,
  /\[ROUTINE\]/,
  /\[TREATMENT\]/,
  /\[GOAL\]/,
  /\[ROUTINE_ACTION\]/,
  /\[CABINET_ACTION\]/,
  /\[APPOINTMENT_ACTION\]/,
  /\[CHECKIN_ACTION\]/,
  /\[WEEKLY_ROUTINE\]/,
]

/**
 * Checks if content contains any component parameters
 */
export function hasComponentParameters(content: string): boolean {
  return COMPONENT_PATTERNS.some(pattern => pattern.test(content))
}

/**
 * Checks if content contains incomplete component tags (opening tags without closing)
 */
export function hasIncompleteComponents(content: string): boolean {
  return OPENING_TAG_PATTERNS.some(pattern => {
    const openingMatches = content.match(new RegExp(pattern.source, 'g'))
    if (!openingMatches) return false
    
    const closingPattern = pattern.source.replace('[', '[/')
    const closingMatches = content.match(new RegExp(closingPattern, 'g'))
    
    return openingMatches.length > (closingMatches?.length || 0)
  })
}

/**
 * Checks if content is currently streaming component parameters
 */
export function isStreamingComponents(content: string): boolean {
  return hasIncompleteComponents(content) || hasComponentParameters(content)
}

/**
 * Gets the type of component being streamed
 */
export function getStreamingComponentType(content: string): string | null {
  for (const pattern of OPENING_TAG_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern)
      if (match) {
        return match[0].replace(/[\[\]]/g, '').toLowerCase()
      }
    }
  }
  return null
}

/**
 * Extracts text content before any component tags
 */
export function extractTextBeforeComponents(content: string): string {
  // Find the first component tag
  let firstComponentIndex = content.length
  
  for (const pattern of OPENING_TAG_PATTERNS) {
    const match = content.match(pattern)
    if (match && match.index !== undefined) {
      firstComponentIndex = Math.min(firstComponentIndex, match.index)
    }
  }
  
  // Return text before the first component tag
  const textBefore = content.substring(0, firstComponentIndex).trim()
  return textBefore
}

/**
 * Gets a user-friendly message for the component being prepared
 */
export function getComponentLoadingMessage(componentType: string | null): string {
  const messages: Record<string, string> = {
    'product': 'Preparing product recommendations...',
    'routine': 'Building your routine...',
    'treatment': 'Analyzing treatment options...',
    'goal': 'Setting up your goals...',
    'routine_action': 'Preparing routine actions...',
    'cabinet_action': 'Managing your cabinet...',
    'appointment_action': 'Scheduling appointments...',
    'checkin_action': 'Preparing check-in actions...',
    'weekly_routine': 'Creating your weekly routine...',
  }
  
  return messages[componentType || ''] || 'Preparing component...'
}
