/**
 * Progress Types
 * 
 * Type definitions for progress tracking functionality.
 */

/**
 * Progress photo for skin tracking
 */
export interface ProgressPhoto {
  id: string
  user_id: string
  photo_url: string
  photo_type: string
  notes: string | null
  lighting_conditions: string | null
  skin_condition_rating: number | null
  created_at: string
}

/**
 * Daily check-in data for progress tracking
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
 * User-defined skincare goals and objectives
 */
export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  status: string
  progress: number
  created_at: string
  updated_at: string
}

/**
 * Progress dashboard props
 */
export interface ProgressDashboardProps {
  photos: ProgressPhoto[]
  checkins: DailyCheckin[]
  goals: Goal[]
  userId: string
}

/**
 * Goals manager props
 */
export interface GoalsManagerProps {
  goals: Goal[]
  userId: string
}
