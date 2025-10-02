/**
 * Routines Types
 * 
 * Type definitions for routine management functionality.
 */

import { Product, InventoryItem } from "../../shared/types/skincare"

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
  day_of_week: number | null
  created_at: string
  updated_at: string
  routine_steps: RoutineStep[]
}

/**
 * Routine manager props
 */
export interface RoutineManagerProps {
  routines: Routine[]
  inventory: InventoryItem[]
  userId: string
}

/**
 * Routine builder props
 */
export interface RoutineBuilderProps {
  routine?: Routine | null
  inventory: InventoryItem[]
  userId: string
  onClose: () => void
  onSave: () => void
}
