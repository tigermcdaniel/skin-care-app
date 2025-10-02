/**
 * Skincare Data Context
 * 
 * Centralized state management for all skincare-related data.
 * This file contains only the context definition and exports.
 */

"use client"

import { createContext } from "react"
import { SkincareDataContextType } from "../types/context"

export const SkincareDataContext = createContext<SkincareDataContextType | undefined>(undefined)

// Export the provider and hook from separate files
export { SkincareDataProvider } from "./skincare-data-provider"
export { useSkincareData } from "../hooks/use-skincare-data"
