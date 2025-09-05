"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Moon, Calendar, Clock, MessageCircle, Expand, Check } from "lucide-react"
import { useSkincareData } from "@/contexts/skincare-data-context"

interface RoutineManagerTabProps {
  onExpand?: () => void
  isFullScreen?: boolean
}

export function RoutineManagerTab({ onExpand, isFullScreen }: RoutineManagerTabProps) {
  const { routines, checkIns, isLoading, markRoutineComplete } = useSkincareData()

  const isRoutineCompletedToday = (routine: any) => {
    const today = new Date().toISOString().split("T")[0]
    const todayCheckIn = checkIns.find((checkIn) => checkIn.date === today)

    if (!todayCheckIn) return false

    const isEveningRoutine =
      routine.type?.toLowerCase().includes("evening") || routine.name?.toLowerCase().includes("evening")

    return isEveningRoutine ? todayCheckIn.evening_routine_completed : todayCheckIn.morning_routine_completed
  }

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case "morning":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "evening":
        return <Moon className="h-4 w-4 text-purple-500" />
      case "weekly":
        return <Calendar className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleMarkComplete = async (routineId: string, routineName: string) => {
    try {
      await markRoutineComplete(routineId, routineName)
      console.log(`${routineName} routine marked as complete!`)
    } catch (error) {
      console.error("Error marking routine complete:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-charcoal-600">Loading your routines...</div>
      </div>
    )
  }

  if (routines.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 mx-auto text-charcoal-400 mb-3" />
        <h3 className="font-serif text-lg text-charcoal-800 mb-2">No active routines</h3>
        <p className="text-charcoal-600 text-sm mb-4">Ask your advisor to help build one</p>
        <Button
          size="sm"
          className="bg-sage-600 hover:bg-sage-700 text-white"
          onClick={() =>
            window.parent.postMessage({ type: "SEND_MESSAGE", message: "Help me create a new skincare routine" }, "*")
          }
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Ask Chat to Build
        </Button>
      </div>
    )
  }

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

      {routines.map((routine: any) => {
        const isCompleted = isRoutineCompletedToday(routine)

        return (
          <Card key={routine.id} className="border-stone-200 bg-stone-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getRoutineIcon(routine.type)}
                  <div>
                    <h3 className="font-serif text-base text-charcoal-800">{routine.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-sage-100 text-sage-800 border-sage-200 text-xs">{routine.type}</Badge>
                      <span className="text-xs text-charcoal-600">{routine.routine_steps?.length || 0} steps</span>
                    </div>
                  </div>
                </div>
              </div>

              {routine.routine_steps && routine.routine_steps.length > 0 && (
                <div className="mb-3">
                  <div className="space-y-1">
                    {routine.routine_steps.map((step: any, index: number) => (
                      <div key={step.id} className="flex items-center gap-2 text-xs text-charcoal-600">
                        <span className="flex-shrink-0 w-4 h-4 bg-sage-100 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span>{step.products.name}</span>
                        {isFullScreen && step.instructions && (
                          <span className="text-charcoal-500">- {step.instructions}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleMarkComplete(routine.id, routine.name)}
                  disabled={isCompleted}
                  className={
                    isCompleted
                      ? "bg-green-600 hover:bg-green-600 text-white cursor-default"
                      : "bg-sage-600 hover:bg-sage-700 text-white"
                  }
                >
                  {isCompleted ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    `Mark ${routine.type} routine complete`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
