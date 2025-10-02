/**
 * Quick Commands Component
 * 
 * Displays quick command suggestions for the chat interface.
 */

"use client"

import { Button } from "@/components/ui/button"
import { QUICK_COMMANDS } from "../types/chat"

interface QuickCommandsProps {
  onCommandClick: (command: string) => void
}

export function QuickCommands({ onCommandClick }: QuickCommandsProps) {
  return (
    <div className="p-4 border-t border-stone-200">
      <h3 className="text-sm font-medium text-charcoal-700 mb-3">Quick Commands</h3>
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((command, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onCommandClick(command)}
            className="text-xs border-stone-200 text-charcoal-600 hover:bg-stone-50"
          >
            {command}
          </Button>
        ))}
      </div>
    </div>
  )
}
