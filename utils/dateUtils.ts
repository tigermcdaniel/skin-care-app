/**
 * Get the start date of the current week (Saturday)
 * @returns ISO date string for the Saturday that starts the current week
 */
export function getWeekStartDate(): string {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysFromSaturday = currentDay === 0 ? 1 : currentDay + 1 // Days since last Saturday

  const saturday = new Date(today)
  saturday.setDate(today.getDate() - daysFromSaturday)

  return saturday.toISOString().split("T")[0]
}

/**
 * Get all days of the current week starting from Saturday
 * @returns Array of date strings for the current week (Saturday to Friday)
 */
export function getCurrentWeekDays(): string[] {
  const startDate = getWeekStartDate()
  const saturday = new Date(startDate)
  const weekDays: string[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(saturday)
    date.setDate(saturday.getDate() + i)
    weekDays.push(date.toISOString().split("T")[0])
  }

  return weekDays
}

/**
 * Check if a given date is today
 * @param dateString ISO date string
 * @returns boolean indicating if the date is today
 */
export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split("T")[0]
  return dateString === today
}

/**
 * Check if a given date is in the past
 * @param dateString ISO date string
 * @returns boolean indicating if the date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const today = new Date().toISOString().split("T")[0]
  return dateString < today
}

/**
 * Get the day name for a given date
 * @param dateString ISO date string
 * @returns Day name (e.g., "Saturday", "Sunday", etc.)
 */
export function getDayName(dateString: string): string {
  const date = new Date(dateString)
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return dayNames[date.getDay()]
}
