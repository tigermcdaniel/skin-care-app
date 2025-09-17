"use client"

import { createClient } from "@/integrations/supabase/client"
import { Button } from "@/app/features/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/features/shared/ui/card"
import { Input } from "@/app/features/shared/ui/input"
import { Label } from "@/app/features/shared/ui/label"
import { Textarea } from "@/app/features/shared/ui/textarea"
import { Checkbox } from "@/app/features/shared/ui/checkbox"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const SKIN_TYPES = [
  { id: "normal", label: "Normal" },
  { id: "dry", label: "Dry" },
  { id: "oily", label: "Oily" },
  { id: "combination", label: "Combination" },
  { id: "sensitive", label: "Sensitive" },
]

const SKIN_CONCERNS = [
  { id: "acne", label: "Acne & Breakouts" },
  { id: "aging", label: "Fine Lines & Wrinkles" },
  { id: "dark_spots", label: "Dark Spots & Hyperpigmentation" },
  { id: "dryness", label: "Dryness & Dehydration" },
  { id: "sensitivity", label: "Sensitivity & Redness" },
  { id: "large_pores", label: "Large Pores" },
  { id: "dullness", label: "Dullness & Uneven Texture" },
  { id: "dark_circles", label: "Dark Circles & Puffiness" },
]

const SKIN_GOALS = [
  { id: "clear_skin", label: "Achieve Clear, Blemish-Free Skin" },
  { id: "anti_aging", label: "Prevent & Reduce Signs of Aging" },
  { id: "even_tone", label: "Even Out Skin Tone" },
  { id: "hydration", label: "Improve Skin Hydration" },
  { id: "texture", label: "Smooth Skin Texture" },
  { id: "glow", label: "Achieve Healthy Glow" },
  { id: "maintenance", label: "Maintain Current Skin Health" },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Form data
  const [skinType, setSkinType] = useState("")
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])
  const [skinGoals, setSkinGoals] = useState<string[]>([])
  const [allergies, setAllergies] = useState("")
  const [medications, setMedications] = useState("")
  const [dermatologist, setDermatologist] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
    }
    checkUser()
  }, [router])

  const handleConcernChange = (concernId: string, checked: boolean) => {
    if (checked) {
      setSkinConcerns([...skinConcerns, concernId])
    } else {
      setSkinConcerns(skinConcerns.filter((id) => id !== concernId))
    }
  }

  const handleGoalChange = (goalId: string, checked: boolean) => {
    if (checked) {
      setSkinGoals([...skinGoals, goalId])
    } else {
      setSkinGoals(skinGoals.filter((id) => id !== goalId))
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    console.log("[v0] Starting onboarding submission")
    setIsLoading(true)
    const supabase = createClient()

    try {
      console.log("[v0] Saving profile data:", {
        id: user.id,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        date_of_birth: dateOfBirth || null,
        skin_type: skinType,
        skin_concerns: skinConcerns,
      })

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        date_of_birth: dateOfBirth || null,
        skin_type: skinType,
        skin_concerns: skinConcerns,
      })

      if (error) {
        console.error("[v0] Database error:", error)
        throw error
      }

      console.log("[v0] Profile saved successfully, redirecting to chat")
      router.push(
        "/chat/new-session?prompt=Welcome! I just completed my profile setup. Can you help me get started with my skincare journey?",
      )
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      alert("There was an error saving your profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => setCurrentStep(currentStep + 1)
  const prevStep = () => setCurrentStep(currentStep - 1)

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's Personalize Your Experience</h1>
          <p className="text-gray-600">Tell us about your skin so we can provide the best recommendations</p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-8 rounded-full ${
                    step <= currentStep ? "bg-gradient-to-r from-rose-400 to-teal-400" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Help us understand your skin type and concerns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Label>What's your skin type?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {SKIN_TYPES.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          skinType === type.id ? "border-rose-500 bg-rose-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="skinType"
                          value={type.id}
                          checked={skinType === type.id}
                          onChange={(e) => setSkinType(e.target.value)}
                          className="text-rose-500"
                        />
                        <span className="font-medium">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={nextStep}
                    disabled={!skinType}
                    className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600"
                  >
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>Skin Concerns & Goals</CardTitle>
                <CardDescription>Select all that apply to your current skin situation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>What are your main skin concerns?</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {SKIN_CONCERNS.map((concern) => (
                      <label
                        key={concern.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                      >
                        <Checkbox
                          checked={skinConcerns.includes(concern.id)}
                          onCheckedChange={(checked) => handleConcernChange(concern.id, checked as boolean)}
                        />
                        <span>{concern.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What are your skincare goals?</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {SKIN_GOALS.map((goal) => (
                      <label
                        key={goal.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                      >
                        <Checkbox
                          checked={skinGoals.includes(goal.id)}
                          onCheckedChange={(checked) => handleGoalChange(goal.id, checked as boolean)}
                        />
                        <span>{goal.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600"
                  >
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Help us provide safer, more personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies or Sensitivities (Optional)</Label>
                  <Textarea
                    id="allergies"
                    placeholder="e.g., fragrance, retinol, salicylic acid..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-500">Separate multiple items with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications (Optional)</Label>
                  <Textarea
                    id="medications"
                    placeholder="e.g., tretinoin, birth control, antibiotics..."
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-500">This helps us avoid ingredient interactions</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dermatologist">Dermatologist Name (Optional)</Label>
                  <Input
                    id="dermatologist"
                    placeholder="Dr. Smith at ABC Dermatology"
                    value={dermatologist}
                    onChange={(e) => setDermatologist(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600"
                  >
                    {isLoading ? "Setting up your profile..." : "Complete Setup"}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
