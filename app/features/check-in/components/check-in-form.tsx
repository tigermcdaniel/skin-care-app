/**
 * Check-in Form Component
 * 
 * Handles the main check-in form with routine completion and lifestyle tracking.
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { CheckInFormData } from "../types/check-in"

interface CheckInFormProps {
  existingCheckin: any | null
  onSubmit: (data: CheckInFormData) => void
  isLoading: boolean
}

export function CheckInForm({ existingCheckin, onSubmit, isLoading }: CheckInFormProps) {
  const [formData, setFormData] = useState<CheckInFormData>({
    morning_routine_completed: existingCheckin?.morning_routine_completed || false,
    evening_routine_completed: existingCheckin?.evening_routine_completed || false,
    skin_condition_rating: existingCheckin?.skin_condition_rating || null,
    mood_rating: existingCheckin?.mood_rating || null,
    notes: existingCheckin?.notes || "",
    sleep_hours: existingCheckin?.sleep_hours || null,
    water_intake: existingCheckin?.water_intake || null,
    stress_level: existingCheckin?.stress_level || null,
    photoNotes: "",
    lightingConditions: "natural",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const updateFormData = (updates: Partial<CheckInFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Routine Completion */}
      <Card className="border-0 shadow-sm bg-stone-50">
        <CardHeader>
          <CardTitle className="font-serif text-charcoal-800">Routine Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="morning"
              checked={formData.morning_routine_completed}
              onCheckedChange={(checked) => 
                updateFormData({ morning_routine_completed: !!checked })
              }
            />
            <Label htmlFor="morning" className="text-sm font-medium text-charcoal-700">
              Morning Routine Completed
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="evening"
              checked={formData.evening_routine_completed}
              onCheckedChange={(checked) => 
                updateFormData({ evening_routine_completed: !!checked })
              }
            />
            <Label htmlFor="evening" className="text-sm font-medium text-charcoal-700">
              Evening Routine Completed
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Skin Condition Rating */}
      <Card className="border-0 shadow-sm bg-stone-50">
        <CardHeader>
          <CardTitle className="font-serif text-charcoal-800">Skin Condition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-charcoal-700">
              Rate your skin condition (1-10)
            </Label>
            <Slider
              value={[formData.skin_condition_rating || 5]}
              onValueChange={([value]) => updateFormData({ skin_condition_rating: value })}
              max={10}
              min={1}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-charcoal-500 mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Factors */}
      <Card className="border-0 shadow-sm bg-stone-50">
        <CardHeader>
          <CardTitle className="font-serif text-charcoal-800">Lifestyle Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-charcoal-700">
              Sleep Hours: {formData.sleep_hours || 8}
            </Label>
            <Slider
              value={[formData.sleep_hours || 8]}
              onValueChange={([value]) => updateFormData({ sleep_hours: value })}
              max={12}
              min={0}
              step={0.5}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-charcoal-700">
              Water Intake (glasses): {formData.water_intake || 8}
            </Label>
            <Slider
              value={[formData.water_intake || 8]}
              onValueChange={([value]) => updateFormData({ water_intake: value })}
              max={20}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-charcoal-700">
              Stress Level: {formData.stress_level || 5}
            </Label>
            <Slider
              value={[formData.stress_level || 5]}
              onValueChange={([value]) => updateFormData({ stress_level: value })}
              max={10}
              min={1}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-charcoal-500 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-0 shadow-sm bg-stone-50">
        <CardHeader>
          <CardTitle className="font-serif text-charcoal-800">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How are you feeling today? Any observations about your skin?"
            value={formData.notes}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isLoading ? "Saving..." : "Save Check-in"}
      </Button>
    </form>
  )
}
