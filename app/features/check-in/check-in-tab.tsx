"use client"

import { useState } from "react"
import { DailyCheckIn } from "./daily-check-in"
import { useSkincareData } from "@/app/features/shared/contexts/skincare-data-context"
import { Expand, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CheckInTabProps {
  onChatMessage?: (message: string) => void
}

export function CheckInTab({ onChatMessage }: CheckInTabProps) {
  const { user } = useSkincareData()
  const [todayCheckin, setTodayCheckin] = useState(null) // This would normally be fetched

  const handleAskChat = () => {
    if (onChatMessage) {
      onChatMessage("I want to complete my daily check-in. Can you guide me through it?")
    }
  }

  return (
    <div className="h-full bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-charcoal-900">Daily Check-In</h2>
          <p className="text-sm text-stone-600">Track your skin condition and routine progress</p>
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
