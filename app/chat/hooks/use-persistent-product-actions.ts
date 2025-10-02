"use client"

import { useState, useEffect, useCallback } from 'react'
import { ButtonStateManager } from '@/lib/button-state-manager'

export function usePersistentProductActions() {
  const [completedActions, setCompletedActions] = useState<string[]>([])

  useEffect(() => {
    const manager = ButtonStateManager.getInstance()
    
    // Initialize with current state
    setCompletedActions(manager.getAllActions())

    // Listen for state changes via custom events
    const handleStateChange = (event: CustomEvent) => {
      setCompletedActions(event.detail.completedActions)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('product-state-changed', handleStateChange as EventListener)
      
      return () => {
        window.removeEventListener('product-state-changed', handleStateChange as EventListener)
      }
    }
  }, [])

  const addAction = useCallback((productKey: string) => {
    const manager = ButtonStateManager.getInstance()
    manager.addAction(productKey)
  }, [])

  const hasAction = useCallback((productKey: string) => {
    const manager = ButtonStateManager.getInstance()
    return manager.hasAction(productKey)
  }, [])

  return {
    completedActions: new Set(completedActions),
    addAction,
    hasAction
  }
}
