/**
 * Check-in Types
 * 
 * Type definitions for check-in functionality.
 */

/**
 * Daily check-in data structure
 */
export interface DailyCheckin {
  id: string
  user_id: string
  date: string
  morning_routine_completed: boolean
  evening_routine_completed: boolean
  skin_condition_rating: number | null
  mood_rating: number | null
  notes: string | null
  sleep_hours: number | null
  water_intake: number | null
  stress_level: number | null
  created_at: string
}

/**
 * Check-in form data
 */
export interface CheckInFormData {
  morning_routine_completed: boolean
  evening_routine_completed: boolean
  skin_condition_rating: number | null
  mood_rating: number | null
  notes: string
  sleep_hours: number | null
  water_intake: number | null
  stress_level: number | null
  photoNotes: string
  lightingConditions: string
}

/**
 * Photo upload data
 */
export interface PhotoUploadData {
  files: File[]
  previews: string[]
  notes: string
  lightingConditions: string
}
