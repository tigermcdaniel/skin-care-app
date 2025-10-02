/**
 * Core Skincare Types
 * 
 * Centralized type definitions for all skincare-related data structures.
 * These types are used across the entire application for consistency.
 */

/**
 * Product interface representing skincare products in the system
 */
export interface Product {
  id: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  description: string | null
  price: number | null
  size: string | null
}

/**
 * Individual step within a skincare routine
 */
export interface RoutineStep {
  id: string
  routine_id: string
  product_id: string
  step_order: number
  instructions: string | null
  amount: string | null
  products: Product
}

/**
 * Skincare routine with day-specific scheduling support
 */
export interface Routine {
  id: string
  user_id: string
  name: string
  type: string
  is_active: boolean
  day_of_week: number | null // Added day_of_week field for day-specific routines
  created_at: string
  updated_at: string
  routine_steps: RoutineStep[]
}

/**
 * User's product inventory with usage tracking
 */
export interface InventoryItem {
  id: string
  user_id: string
  product_id: string
  purchase_date: string | null
  expiry_date: string | null
  amount_remaining: number
  notes: string | null
  created_at: string
  updated_at: string
  products: Product
}

/**
 * Daily check-in data for progress tracking
 */
export interface CheckIn {
  id: string
  user_id: string
  date: string
  skin_condition_rating: number | null
  morning_routine_completed: boolean | null
  evening_routine_completed: boolean | null
  mood_rating: number | null
  stress_level: number | null
  sleep_hours: number | null
  water_intake: number | null
  notes: string | null
}

/**
 * User-defined skincare goals and objectives
 */
export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string
  status: string
  created_at: string
}

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
 * Appointment for treatments and consultations
 */
export interface Appointment {
  id: string
  user_id: string
  scheduled_date: string
  treatment_type: string
  provider: string
  status: string
  cost: number | null
  notes: string | null
  created_at: string
}
