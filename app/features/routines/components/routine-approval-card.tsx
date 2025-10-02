"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Moon, Check, X, Calendar, ChevronDown, ChevronUp } from "lucide-react"

interface WeeklyRoutineSuggestion {
  id: string
  title: string
  description: string
  weeklySchedule: {
    [key: string]: {
      morning: {
        steps: Array<{
          product_name: string
          product_brand: string
          instructions: string
          category: string
        }>
      }
      evening: {
        steps: Array<{
          product_name: string
          product_brand: string
          instructions: string
          category: string
        }>
      }
    }
  }
  reasoning: string
  created_at: string
}

interface RoutineApprovalCardProps {
  suggestion: WeeklyRoutineSuggestion
  onApprove: (suggestionId: string) => Promise<void>
  onDeny: (suggestionId: string) => Promise<void>
}

export function RoutineApprovalCard({ suggestion, onApprove, onDeny }: RoutineApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [isDenied, setIsDenied] = useState(false)

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(suggestion.id)
      setIsApproved(true)
    } catch (error) {
      console.error("Error approving routine:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeny = async () => {
    setIsProcessing(true)
    try {
      await onDeny(suggestion.id)
      setIsDenied(true)
    } catch (error) {
      console.error("Error denying routine:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const dayNames = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-serif text-charcoal-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-black" />
              {suggestion.title}
            </CardTitle>
            <p className="text-sm text-charcoal-600">{suggestion.description}</p>
            <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Weekly Routine Suggestion</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-charcoal-600 hover:bg-gray-100"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reasoning */}
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-charcoal-800 mb-2">Why this routine?</h4>
          <p className="text-sm text-charcoal-600">{suggestion.reasoning}</p>
        </div>

        {/* Weekly Schedule Preview */}
        {isExpanded && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-charcoal-800">Weekly Schedule Preview</h4>
            <div className="grid gap-3">
              {dayNames.map((day) => {
                const daySchedule = suggestion.weeklySchedule[day.toLowerCase()]
                if (!daySchedule) return null

                return (
                  <div key={day} className="p-3 bg-white rounded-lg border border-stone-200">
                    <h5 className="text-sm font-medium text-charcoal-800 mb-2">{day}</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Morning */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sun className="h-3 w-3 text-black" />
                          <span className="text-xs font-medium text-charcoal-700">Morning</span>
                        </div>
                        <div className="space-y-1">
                          {daySchedule.morning.steps.slice(0, 3).map((step, index) => (
                            <div key={index} className="text-xs text-charcoal-600">
                              {index + 1}. {step.product_name} - {step.product_brand}
                            </div>
                          ))}
                          {daySchedule.morning.steps.length > 3 && (
                            <div className="text-xs text-charcoal-500">
                              +{daySchedule.morning.steps.length - 3} more steps
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Evening */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Moon className="h-3 w-3 text-black" />
                          <span className="text-xs font-medium text-charcoal-700">Evening</span>
                        </div>
                        <div className="space-y-1">
                          {daySchedule.evening.steps.slice(0, 3).map((step, index) => (
                            <div key={index} className="text-xs text-charcoal-600">
                              {index + 1}. {step.product_name} - {step.product_brand}
                            </div>
                          ))}
                          {daySchedule.evening.steps.length > 3 && (
                            <div className="text-xs text-charcoal-500">
                              +{daySchedule.evening.steps.length - 3} more steps
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isApproved && !isDenied && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-blue-200 hover:bg-blue-300 text-blue-800"
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? "Approving..." : "Approve & Apply"}
            </Button>
            <Button
              onClick={handleDeny}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              {isProcessing ? "Denying..." : "Deny"}
            </Button>
          </div>
        )}

        {isApproved && (
          <div className="flex items-center gap-2 pt-2 text-blue-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Routine approved and applied to your schedule</span>
          </div>
        )}

        {isDenied && (
          <div className="flex items-center gap-2 pt-2 text-gray-600">
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">Routine suggestion denied</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
