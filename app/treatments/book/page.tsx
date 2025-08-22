"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

const TREATMENT_TYPES = [
  "Botox",
  "Dermal Fillers",
  "Chemical Peel",
  "Microneedling",
  "Laser Treatment",
  "IPL Photofacial",
  "HydraFacial",
  "Facial",
  "Microdermabrasion",
  "LED Light Therapy",
  "Other",
]

export default function BookTreatmentPage() {
  const [formData, setFormData] = useState({
    treatment_type: "",
    provider: "",
    scheduled_date: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        treatment_type: formData.treatment_type,
        provider: formData.provider,
        scheduled_date: formData.scheduled_date,
        status: "scheduled",
        notes: formData.notes,
      })

      if (error) throw error

      router.push("/treatments")
    } catch (error) {
      console.error("Error booking treatment:", error)
      alert("Error booking treatment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/treatments">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Treatments
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Treatment</h1>
        <p className="text-gray-600">Schedule your next skincare treatment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Treatment Details
          </CardTitle>
          <CardDescription>Fill in the details for your upcoming treatment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="treatment_type">Treatment Type</Label>
              <Select value={formData.treatment_type} onValueChange={(value) => handleChange("treatment_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment type" />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider/Clinic</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => handleChange("provider", e.target.value)}
                placeholder="Enter provider or clinic name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => handleChange("scheduled_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional notes about the treatment..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !formData.treatment_type || !formData.scheduled_date}
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                {loading ? "Booking..." : "Book Treatment"}
              </Button>
              <Link href="/treatments">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
