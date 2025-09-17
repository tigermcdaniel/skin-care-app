"use client"

import { Card, CardContent } from "@/app/features/shared/ui/card"
import { Button } from "@/app/features/shared/ui/button"
import { Badge } from "@/app/features/shared/ui/badge"
import { Calendar, Camera, MessageCircle, Target, Expand } from "lucide-react"
import { useSkincareData } from "@/app/features/shared/contexts/skincare-data-context"

interface ProgressDashboardTabProps {
  onExpand?: () => void
  isFullScreen?: boolean
  onSendMessage?: (message: string) => void
}

export function ProgressDashboardTab({ onExpand, isFullScreen, onSendMessage }: ProgressDashboardTabProps) {
  const { checkIns, goals, isLoading } = useSkincareData()

  const getConditionColor = (condition: string) => {
    if (!condition) {
      return "bg-stone-100 text-stone-800 border-stone-200"
    }

    switch (condition.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200"
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "poor":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-stone-100 text-stone-800 border-stone-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-charcoal-600">Loading your progress...</div>
      </div>
    )
  }

  const activeGoals = goals.filter((g) => g.status === "active")

  return (
    <div className="space-y-4">
      {!isFullScreen && onExpand && (
        <div className="flex justify-end mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onExpand}
            className="border-stone-200 text-charcoal-600 hover:bg-stone-50 bg-transparent"
          >
            <Expand className="h-3 w-3 mr-1" />
            Expand
          </Button>
        </div>
      )}

      <div>
        <h3 className="font-serif text-base text-charcoal-800 mb-3">Recent Check-ins</h3>
        {checkIns.length === 0 ? (
          <Card className="border-stone-200 bg-stone-50">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto text-charcoal-400 mb-2" />
              <p className="text-sm text-charcoal-600 mb-3">No check-ins yet</p>
              <Button
                size="sm"
                onClick={() => window.open("/check-in", "_blank")}
                className="bg-sage-600 hover:bg-sage-700 text-white"
              >
                <Camera className="h-3 w-3 mr-1" />
                Start Check-in
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {checkIns.slice(0, isFullScreen ? 10 : 3).map((checkIn) => (
              <Card key={checkIn.id} className="border-stone-200 bg-stone-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-charcoal-700">{new Date(checkIn.date).toLocaleDateString()}</span>
                      <Badge className={`text-xs ${getConditionColor(checkIn.skin_condition)}`}>
                        {checkIn.skin_condition}
                      </Badge>
                      {(checkIn.morning_routine_completed || checkIn.evening_routine_completed) && (
                        <Badge className="bg-sage-100 text-sage-800 border-sage-200 text-xs">Routine ✓</Badge>
                      )}
                    </div>
                  </div>
                  {checkIn.notes && (
                    <p className={`text-xs text-charcoal-600 mt-1 ${isFullScreen ? "" : "line-clamp-1"}`}>
                      {checkIn.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-serif text-base text-charcoal-800 mb-3">Active Goals</h3>
        {activeGoals.length === 0 ? (
          <Card className="border-stone-200 bg-stone-50">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto text-charcoal-400 mb-2" />
              <p className="text-sm text-charcoal-600 mb-3">No active goals</p>
              <Button
                size="sm"
                onClick={() => {
                  if (onSendMessage) {
                    onSendMessage("Help me set skincare goals based on my current progress and skin condition")
                  }
                }}
                className="bg-sage-600 hover:bg-sage-700 text-white"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Ask Chat to Set Goals
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeGoals.map((goal) => (
              <Card key={goal.id} className="border-stone-200 bg-stone-50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium text-charcoal-800 ${isFullScreen ? "" : "line-clamp-1"}`}>
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className={`text-xs text-charcoal-600 mt-1 ${isFullScreen ? "" : "line-clamp-1"}`}>
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-charcoal-500">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">{goal.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
