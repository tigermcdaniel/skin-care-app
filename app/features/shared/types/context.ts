/**
 * Context Types
 * 
 * Type definitions for React context and state management.
 */

import { Product, Routine, InventoryItem, CheckIn, Goal } from './skincare'

/**
 * Skincare Data Context Type
 * 
 * Centralized state management for all skincare-related data.
 */
export interface SkincareDataContextType {
  // Data
  user: any | null
  routines: Routine[]
  inventory: InventoryItem[]
  checkIns: CheckIn[]
  goals: Goal[]
  isLoading: boolean

  // Actions
  refreshData: () => Promise<void>
  updateRoutine: (routineId: string, updates: Partial<Routine>) => Promise<void>
  markRoutineComplete: (routineId: string, routineName: string) => Promise<void>
  updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>) => Promise<void>
  addProductToInventory: (productId: string, notes?: string) => Promise<void>
  markProductAsUsed: (itemId: string, currentAmount: number) => Promise<void>
  deleteProductFromInventory: (itemId: string) => Promise<void>
  removeFromInventory: (itemId: string) => Promise<void> // Alias for deleteProductFromInventory
  addCheckIn: (checkIn: Omit<CheckIn, "id" | "user_id" | "created_at">) => Promise<void>
  addGoal: (goal: Omit<Goal, "id" | "user_id" | "created_at">) => Promise<void>

  // Events
  onDataChange: (callback: () => void) => () => void
}
