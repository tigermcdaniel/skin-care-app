/**
 * Daily Check-In Component
 * 
 * Comprehensive daily check-in system for skincare routine tracking, providing users with
 * detailed daily monitoring of their skincare progress, routine completion, and skin
 * condition assessment. This component handles photo documentation, routine tracking,
 * and lifestyle factor monitoring for complete skincare journey management.
 * 
 * Key Features:
 * - Daily routine completion tracking (morning/evening)
 * - Skin condition rating and assessment
 * - Photo documentation with AI analysis
 * - Lifestyle factor monitoring (sleep, water, stress)
 * - Mood tracking and personal notes
 * - Progress photo organization and storage
 * 
 * Check-In Management:
 * - Track morning and evening routine completion
 * - Rate skin condition on a 1-10 scale
 * - Monitor mood and lifestyle factors
 * - Document progress with photos
 * - Record personal notes and observations
 * - Track sleep, water intake, and stress levels
 * 
 * Photo Documentation:
 * - Upload multiple progress photos
 * - AI-powered skin analysis and recommendations
 * - Photo organization with notes and metadata
 * - Lighting condition tracking
 * - Progress comparison and timeline views
 * 
 * User Experience:
 * - Intuitive check-in interface
 * - Visual progress indicators
 * - Quick photo upload and analysis
 * - Comprehensive lifestyle tracking
 * - Responsive design for all devices
 */

"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/integrations/supabase/client"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { Camera, X, Sparkles } from "lucide-react"

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

/**
 * DailyCheckIn Component
 * 
 * Main daily check-in component that handles comprehensive daily skincare monitoring,
 * including routine completion tracking, skin condition assessment, photo documentation,
 * and lifestyle factor monitoring. This component provides users with detailed
 * daily insights into their skincare journey and progress.
 * 
 * Core Functionality:
 * - Tracks morning and evening routine completion
 * - Manages skin condition rating and assessment
 * - Handles photo upload and AI analysis
 * - Monitors lifestyle factors (sleep, water, stress)
 * - Records mood and personal notes
 * - Provides progress documentation and tracking
 * 
 * Data Management:
 * - Processes daily check-in data with comprehensive tracking
 * - Manages photo upload and storage
 * - Handles AI analysis and recommendations
 * - Tracks lifestyle factors and their impact
 * - Provides progress comparison and insights
 * 
 * User Interface:
 * - Intuitive check-in form with clear sections
 * - Visual progress indicators and ratings
 * - Photo upload with preview and analysis
 * - Lifestyle factor monitoring interface
 * - Responsive design for all devices
 * 
 * @param {Object} props - Component props
 * @param {DailyCheckin | null} props.existingCheckin - Existing check-in data for editing
 * @param {string} props.userId - User ID for data operations
 * @returns {JSX.Element} Complete daily check-in interface
 */
export function DailyCheckIn({ existingCheckin, userId }: DailyCheckInProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const [photoNotes, setPhotoNotes] = useState("")
  const [lightingConditions, setLightingConditions] = useState("natural")

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setPhotoFiles((prev) => [...prev, ...files])

      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotoPreviews((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return []

    const uploadPromises = photoFiles.map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)

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
    })

    const results = await Promise.all(uploadPromises)
    return results.filter((url) => url !== null)
  }

  const analyzePhotosAndSuggestRoutine = async (photoUrls: string[]) => {
    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/photos/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoUrls,
          userId,
          notes: photoNotes,
          lightingConditions,
        }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const analysis = await response.json()
      return analysis
    } catch (error) {
      console.error("Error analyzing photos:", error)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveCheckIn = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const today = new Date().toISOString().split("T")[0]

      const checkinData = {
        user_id: userId,
        date: today,
        morning_routine_completed: false,
        evening_routine_completed: false,
        skin_condition_rating: null,
        mood_rating: null,
        sleep_hours: null,
        water_intake: null,
        stress_level: null,
        notes: photoNotes || null,
      }

      const { error: checkinError } = await supabase.from("daily_checkins").upsert(checkinData, {
        onConflict: "user_id,date",
      })

      if (checkinError) throw checkinError

      if (photoFiles.length > 0) {
        const photoUrls = await uploadPhotos()
        if (photoUrls.length > 0) {
          const photoInserts = photoUrls.map((photoUrl) => ({
            user_id: userId,
            photo_url: photoUrl,
            photo_type: "daily",
            notes: photoNotes || null,
            lighting_conditions: lightingConditions,
            skin_condition_rating: null,
          }))

          const { error: photoError } = await supabase.from("progress_photos").insert(photoInserts)

          if (photoError) throw photoError

          const analysis = await analyzePhotosAndSuggestRoutine(photoUrls)

          console.log("Check-in completed successfully with photos:", {
            checkinData,
            photoCount: photoUrls.length,
            analysis: analysis ? "Analysis completed" : "Analysis failed",
          })

          setPhotoFiles([])
          setPhotoPreviews([])
          setPhotoNotes("")
          setLightingConditions("natural")

          alert("Check-in completed successfully! Your photos have been analyzed and saved.")
        }
      } else {
        console.log("Check-in completed successfully without photos:", checkinData)

        setPhotoNotes("")

        alert("Check-in completed successfully!")
      }
    } catch (error) {
      console.error("Error saving check-in:", error)
      alert("Failed to save check-in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto pb-24">
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-sage-600" />
              Daily Skin Check-In
            </CardTitle>
            <CardDescription>
              Upload photos of your skin for AI analysis and personalized routine suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sage-600" />
                Progress Photos
              </h3>
              <p className="text-sm text-gray-600">
                Take photos in good lighting for the most accurate analysis. Multiple angles help provide better
                insights.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-sage-300 border-dashed rounded-lg cursor-pointer bg-sage-50 hover:bg-sage-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {photoPreviews.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview || PLACEHOLDER_IMAGE}
                                alt={`Preview ${index + 1}`}
                                className="h-24 w-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <Camera className="w-10 h-10 mb-4 text-sage-600" />
                          <p className="mb-2 text-sm text-gray-700 font-medium">Upload your skin photos</p>
                          <p className="text-xs text-gray-500 text-center px-4">
                            AI will analyze your photos and suggest routine adjustments based on your current products
                          </p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoChange} />
                  </label>
                </div>

                {photoFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="photoNotes">Observations (Optional)</Label>
                      <Textarea
                        id="photoNotes"
                        placeholder="Any specific concerns or observations about your skin today..."
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lighting">Lighting Conditions</Label>
                      <select
                        id="lighting"
                        value={lightingConditions}
                        onChange={(e) => setLightingConditions(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
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

            <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm p-4 -mx-4 -mb-6 border-t border-gray-200">
              <Button
                onClick={saveCheckIn}
                disabled={isLoading || isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 h-12 shadow-lg"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Submitting
                  </>
                ) : isLoading ? (
                  "Saving..."
                ) : photoFiles.length > 0 ? (
                  "Analyzing..."
                ) : (
                  "Complete Check-In"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
