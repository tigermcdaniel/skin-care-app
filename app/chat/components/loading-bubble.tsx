/**
 * Loading Bubble Component
 * 
 * Animated loading indicator for when components are being prepared.
 */

"use client"

import * as React from "react"

interface LoadingBubbleProps {
  message?: string
}

export function LoadingBubble({ message = "Preparing component..." }: LoadingBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-stone-100 text-charcoal-900 border border-stone-200 p-3 sm:p-4 rounded-lg max-w-xs">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
            <div 
              className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div 
              className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="text-sm text-stone-600">{message}</span>
        </div>
      </div>
    </div>
  )
}
