"use client"

import { useState } from "react"
import { DailyCheckIn } from "./daily-check-in"
import { useSkincareData } from "@/app/features/shared/contexts/skincare-data-context"
import { Expand, MessageCircle } from "lucide-react"
import { Button } from "@/app/features/shared/ui/button"

interface CheckInTabProps {
  onExpand?: () => void
  isFullScreen?: boolean
  onChatMessage?: (message: string) => void
}

export function CheckInTab({ onExpand, isFullScreen, onChatMessage }: CheckInTabProps) {
  const { user } = useSkincareData()
  const [todayCheckin, setTodayCheckin] = useState(null) // This would normally be fetched

  const handleAskChat = () => {
    if (onChatMessage) {
      onChatMessage("I want to complete my daily check-in. Can you guide me through it?")
    }
  }

  return (
    <div className={`${isFullScreen ? "h-screen overflow-y-auto" : "h-full"} bg-stone-50`}>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-charcoal-900">Daily Check-In</h2>
          <p className="text-sm text-stone-600">Track your skin condition and routine progress</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAskChat}
            className="text-sage-600 hover:text-sage-700 hover:bg-sage-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask Chat
          </Button>
          {!isFullScreen && onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="text-stone-500 hover:text-charcoal-900 hover:bg-stone-100"
            >
              <Expand className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {user ? (
          <DailyCheckIn existingCheckin={todayCheckin} userId={user.id} />
        ) : (
          <div className="text-center py-8">
            <p className="text-stone-600">Please log in to complete your daily check-in.</p>
          </div>
        )}
      </div>
    </div>
  )
}
