/**
 * Skincare Data Hook
 * 
 * Custom hook for accessing skincare data context.
 * Provides type-safe access to the skincare data context.
 */

import { useContext } from "react"
import { SkincareDataContext } from "../contexts/skincare-data-context"

/**
 * Hook to access skincare data context
 * @returns Skincare data context
 * @throws Error if used outside of SkincareDataProvider
 */
export function useSkincareData() {
  const context = useContext(SkincareDataContext)
  if (context === undefined) {
    throw new Error("useSkincareData must be used within a SkincareDataProvider")
  }
  return context
}
