"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Camera } from "lucide-react"

interface DailyCheckin {
  id: string
  user_id: string
  date: string
  morning_routine_completed: boolean
  evening_routine_completed: boolean
  skin_condition_rating: number | null
  mood_rating: number | null
  notes: string | null
  sleep_hours: number | null
  water_intake: number | null
  stress_level: number | null
  created_at: string
}

interface DailyCheckInProps {
  existingCheckin: DailyCheckin | null
  userId: string
}

export function DailyCheckIn({ existingCheckin, userId }: DailyCheckInProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const router = useRouter()

  // Form state
  const [morningCompleted, setMorningCompleted] = useState(existingCheckin?.morning_routine_completed || false)
  const [eveningCompleted, setEveningCompleted] = useState(existingCheckin?.evening_routine_completed || false)
  const [skinRating, setSkinRating] = useState([existingCheckin?.skin_condition_rating || 5])
  const [moodRating, setMoodRating] = useState([existingCheckin?.mood_rating || 3])
  const [sleepHours, setSleepHours] = useState(existingCheckin?.sleep_hours?.toString() || "")
  const [waterIntake, setWaterIntake] = useState(existingCheckin?.water_intake?.toString() || "")
  const [stressLevel, setStressLevel] = useState([existingCheckin?.stress_level || 3])
  const [notes, setNotes] = useState(existingCheckin?.notes || "")
  const [photoNotes, setPhotoNotes] = useState("")
  const [lightingConditions, setLightingConditions] = useState("natural")

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null

    const formData = new FormData()
    formData.append("file", photoFile)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading photo:", error)
      return null
    }
  }

  const saveCheckIn = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const today = new Date().toISOString().split("T")[0]

      // Save daily check-in
      const checkinData = {
        user_id: userId,
        date: today,
        morning_routine_completed: morningCompleted,
        evening_routine_completed: eveningCompleted,
        skin_condition_rating: skinRating[0],
        mood_rating: moodRating[0],
        sleep_hours: sleepHours ? Number.parseFloat(sleepHours) : null,
        water_intake: waterIntake ? Number.parseInt(waterIntake) : null,
        stress_level: stressLevel[0],
        notes: notes || null,
      }

      const { error: checkinError } = await supabase.from("daily_checkins").upsert(checkinData, {
        onConflict: "user_id,date",
      })

      if (checkinError) throw checkinError

      // Upload and save photo if provided
      if (photoFile) {
        const photoUrl = await uploadPhoto()
        if (photoUrl) {
          const { error: photoError } = await supabase.from("progress_photos").insert({
            user_id: userId,
            photo_url: photoUrl,
            photo_type: "daily",
            notes: photoNotes || null,
            lighting_conditions: lightingConditions,
            skin_condition_rating: skinRating[0],
          })

          if (photoError) throw photoError
        }
      }

      router.push("/progress")
    } catch (error) {
      console.error("Error saving check-in:", error)
      alert("Failed to save check-in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return "text-red-600"
    if (rating <= 6) return "text-yellow-600"
    return "text-green-600"
  }

  const getRatingLabel = (rating: number, type: "skin" | "mood" | "stress") => {
    if (type === "skin") {
      if (rating <= 2) return "Very Poor"
      if (rating <= 4) return "Poor"
      if (rating <= 6) return "Fair"
      if (rating <= 8) return "Good"
      return "Excellent"
    }
    if (type === "mood") {
      if (rating <= 1) return "Very Low"
      if (rating <= 2) return "Low"
      if (rating <= 3) return "Neutral"
      if (rating <= 4) return "Good"
      return "Excellent"
    }
    if (type === "stress") {
      if (rating <= 1) return "Very Low"
      if (rating <= 2) return "Low"
      if (rating <= 3) return "Moderate"
      if (rating <= 4) return "High"
      return "Very High"
    }
    return ""
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Today's Check-In</CardTitle>
          <CardDescription>
            {existingCheckin ? "Update your daily progress" : "Track your skin condition and routine progress"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Routine Completion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Routine Completion</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <Checkbox checked={morningCompleted} onCheckedChange={setMorningCompleted} />
                <span>Morning routine completed</span>
              </label>
              <label className="flex items-center space-x-3">
                <Checkbox checked={eveningCompleted} onCheckedChange={setEveningCompleted} />
                <span>Evening routine completed</span>
              </label>
            </div>
          </div>

          {/* Skin Condition Rating */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Skin Condition</h3>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getRatingColor(skinRating[0])}`}>{skinRating[0]}</span>
                <span className="text-gray-500">/10</span>
                <p className="text-sm text-gray-600">{getRatingLabel(skinRating[0], "skin")}</p>
              </div>
            </div>
            <Slider value={skinRating} onValueChange={setSkinRating} max={10} min={1} step={1} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Very Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Mood Rating */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mood</h3>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getRatingColor(moodRating[0])}`}>{moodRating[0]}</span>
                <span className="text-gray-500">/5</span>
                <p className="text-sm text-gray-600">{getRatingLabel(moodRating[0], "mood")}</p>
              </div>
            </div>
            <Slider value={moodRating} onValueChange={setMoodRating} max={5} min={1} step={1} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Very Low</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Lifestyle Factors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lifestyle Factors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sleep">Sleep Hours</Label>
                <Input
                  id="sleep"
                  type="number"
                  placeholder="8.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  step="0.5"
                  min="0"
                  max="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="water">Water Intake (glasses)</Label>
                <Input
                  id="water"
                  type="number"
                  placeholder="8"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(e.target.value)}
                  min="0"
                  max="20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Stress Level</Label>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getRatingColor(6 - stressLevel[0])}`}>{stressLevel[0]}</span>
                  <span className="text-gray-500">/5</span>
                  <p className="text-sm text-gray-600">{getRatingLabel(stressLevel[0], "stress")}</p>
                </div>
              </div>
              <Slider value={stressLevel} onValueChange={setStressLevel} max={5} min={1} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>
          </div>

          {/* Progress Photo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Progress Photo (Optional)</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {photoPreview ? (
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> a progress photo
                        </p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
              </div>

              {photoFile && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="photoNotes">Photo Notes</Label>
                    <Textarea
                      id="photoNotes"
                      placeholder="Any observations about your skin today..."
                      value={photoNotes}
                      onChange={(e) => setPhotoNotes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lighting">Lighting Conditions</Label>
                    <select
                      id="lighting"
                      value={lightingConditions}
                      onChange={(e) => setLightingConditions(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="natural">Natural Light</option>
                      <option value="indoor">Indoor Light</option>
                      <option value="flash">Flash</option>
                      <option value="mixed">Mixed Lighting</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling about your skin today? Any changes or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={saveCheckIn}
            disabled={isLoading}
            className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium transition-colors duration-200 h-12"
            size="lg"
          >
            {isLoading ? "Saving..." : existingCheckin ? "Update Check-In" : "Save Check-In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
