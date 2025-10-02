/**
 * Check-in Hook
 * 
 * Custom hook for managing check-in functionality.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/integrations/supabase/client"
import { DailyCheckin, CheckInFormData, PhotoUploadData } from "../types/check-in"

/**
 * Custom hook for check-in functionality
 */
export function useCheckIn(existingCheckin: DailyCheckin | null, userId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [photoNotes, setPhotoNotes] = useState("")
  const [lightingConditions, setLightingConditions] = useState("natural")
  
  const router = useRouter()
  const supabase = createClient()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotoFiles(files)
    
    const previews = files.map(file => URL.createObjectURL(file))
    setPhotoPreviews(previews)
  }

  const removePhoto = (index: number) => {
    const newFiles = photoFiles.filter((_, i) => i !== index)
    const newPreviews = photoPreviews.filter((_, i) => i !== index)
    
    setPhotoFiles(newFiles)
    setPhotoPreviews(newPreviews)
  }

  const analyzePhotos = async () => {
    if (photoFiles.length === 0) return

    setIsAnalyzing(true)
    try {
      const uploadPromises = photoFiles.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        
        if (response.ok) {
          const { url } = await response.json()
          return url
        }
        throw new Error("Upload failed")
      })

      const photoUrls = await Promise.all(uploadPromises)

      const analysisResponse = await fetch("/api/photos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls,
          userId,
          notes: photoNotes,
          lightingConditions,
        }),
      })

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json()
        console.log("Photo analysis:", analysis)
        // Handle analysis results
      }
    } catch (error) {
      console.error("Error analyzing photos:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const submitCheckIn = async (formData: CheckInFormData) => {
    setIsLoading(true)
    try {
      const checkInData = {
        user_id: userId,
        date: new Date().toISOString().split("T")[0],
        ...formData,
      }

      if (existingCheckin) {
        const { error } = await supabase
          .from("daily_checkins")
          .update(checkInData)
          .eq("id", existingCheckin.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("daily_checkins")
          .insert(checkInData)

        if (error) throw error
      }

      // Handle photo uploads if any
      if (photoFiles.length > 0) {
        await analyzePhotos()
      }

      router.push("/progress")
    } catch (error) {
      console.error("Error submitting check-in:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    photoFiles,
    photoPreviews,
    isAnalyzing,
    photoNotes,
    setPhotoNotes,
    lightingConditions,
    setLightingConditions,
    handlePhotoChange,
    removePhoto,
    analyzePhotos,
    submitCheckIn,
  }
}
