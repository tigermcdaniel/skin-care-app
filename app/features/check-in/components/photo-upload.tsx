/**
 * Photo Upload Component
 * 
 * Handles photo upload and preview for check-ins.
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, X, Sparkles } from "lucide-react"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { PhotoUploadData } from "../types/check-in"

interface PhotoUploadProps {
  photoFiles: File[]
  photoPreviews: string[]
  photoNotes: string
  lightingConditions: string
  isAnalyzing: boolean
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (index: number) => void
  onNotesChange: (notes: string) => void
  onLightingChange: (lighting: string) => void
  onAnalyze: () => void
}

export function PhotoUpload({
  photoFiles,
  photoPreviews,
  photoNotes,
  lightingConditions,
  isAnalyzing,
  onPhotoChange,
  onRemovePhoto,
  onNotesChange,
  onLightingChange,
  onAnalyze,
}: PhotoUploadProps) {
  return (
    <Card className="border-0 shadow-sm bg-stone-50">
      <CardHeader>
        <CardTitle className="font-serif text-charcoal-800">Progress Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Upload */}
        <div>
          <Label htmlFor="photos" className="text-sm font-medium text-charcoal-700">
            Upload Photos
          </Label>
          <input
            id="photos"
            type="file"
            multiple
            accept="image/*"
            onChange={onPhotoChange}
            className="mt-2 block w-full text-sm text-charcoal-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Photo Previews */}
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-stone-200"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => onRemovePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Photo Notes */}
        <div>
          <Label htmlFor="photoNotes" className="text-sm font-medium text-charcoal-700">
            Photo Notes
          </Label>
          <Textarea
            id="photoNotes"
            placeholder="Add notes about these photos..."
            value={photoNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Lighting Conditions */}
        <div>
          <Label htmlFor="lighting" className="text-sm font-medium text-charcoal-700">
            Lighting Conditions
          </Label>
          <Select value={lightingConditions} onValueChange={onLightingChange}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="natural">Natural Light</SelectItem>
              <SelectItem value="artificial">Artificial Light</SelectItem>
              <SelectItem value="mixed">Mixed Lighting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Analyze Button */}
        {photoFiles.length > 0 && (
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Photos...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Photos with AI
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
