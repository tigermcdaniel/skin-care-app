"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/integrations/supabase/client"
import { Button } from "@/app/features/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/features/shared/ui/card"
import { Badge } from "@/app/features/shared/ui/badge"
import { Calendar, Clock, MapPin, Star, CheckCircle, AlertCircle, Expand } from "lucide-react"

interface Treatment {
  id: string
  treatment_type: string
  provider: string
  date_performed: string
  cost: number
  notes: string
  effectiveness_rating: number
  created_at: string
}

interface Appointment {
  id: string
  treatment_type: string
  provider: string
  scheduled_date: string
  status: "scheduled" | "suggested" | "completed" | "cancelled"
  notes: string
  created_at: string
}

interface TreatmentsTabProps {
  onExpand?: () => void
  isFullScreen?: boolean
}

export function TreatmentsTab({ onExpand, isFullScreen = false }: TreatmentsTabProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"upcoming" | "suggested" | "history">("upcoming")
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load treatments
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from("treatments")
        .select("*")
        .eq("user_id", user.id)
        .order("date_performed", { ascending: false })

      if (treatmentsError) throw treatmentsError

      // Load appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true })

      if (appointmentsError) throw appointmentsError

      setTreatments(treatmentsData || [])
      setAppointments(appointmentsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const approveAppointment = async (appointmentId: string) => {
    try {
      await supabase.from("appointments").update({ status: "scheduled" }).eq("id", appointmentId)
      loadData()
    } catch (error) {
      console.error("Error approving appointment:", error)
    }
  }

  const completeAppointment = async (appointmentId: string) => {
    try {
      await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId)
      loadData()
    } catch (error) {
      console.error("Error completing appointment:", error)
    }
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "scheduled" && new Date(apt.scheduled_date) >= new Date(),
  )
  const suggestedAppointments = appointments.filter((apt) => apt.status === "suggested")
  const pastTreatments = treatments.slice(0, isFullScreen ? 10 : 3)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-stone-200 rounded w-1/2"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-stone-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${isFullScreen ? "max-w-6xl mx-auto" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-charcoal-900">Treatments</h3>
        <div className="flex items-center space-x-2">
          {!isFullScreen && onExpand && (
            <button
              onClick={onExpand}
              className="p-1 text-stone-500 hover:text-charcoal-900 transition-colors"
              title="Expand"
            >
              <Expand className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-stone-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveView("upcoming")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === "upcoming" ? "bg-white text-sage-700 shadow-sm" : "text-stone-600 hover:text-charcoal-900"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveView("suggested")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === "suggested" ? "bg-white text-sage-700 shadow-sm" : "text-stone-600 hover:text-charcoal-900"
          }`}
        >
          Suggested
        </button>
        <button
          onClick={() => setActiveView("history")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === "history" ? "bg-white text-sage-700 shadow-sm" : "text-stone-600 hover:text-charcoal-900"
          }`}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeView === "upcoming" && (
          <>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                <p className="text-sm">No upcoming appointments</p>
                <button
                  onClick={() => {
                    if (window.parent) {
                      window.parent.postMessage(
                        { type: "CHAT_COMMAND", command: "Schedule a treatment appointment" },
                        "*",
                      )
                    }
                  }}
                  className="mt-2 text-xs text-sage-600 hover:text-sage-700 underline"
                >
                  Ask chat to schedule one
                </button>
              </div>
            ) : (
              upcomingAppointments.slice(0, isFullScreen ? 10 : 3).map((appointment) => (
                <Card key={appointment.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{appointment.treatment_type}</CardTitle>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Scheduled
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {new Date(appointment.scheduled_date).toLocaleDateString()}
                      {appointment.provider && ` • ${appointment.provider}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => completeAppointment(appointment.id)}>
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}

        {activeView === "suggested" && (
          <>
            {suggestedAppointments.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                <p className="text-sm">No suggested treatments</p>
                <button
                  onClick={() => {
                    if (window.parent) {
                      window.parent.postMessage(
                        { type: "CHAT_COMMAND", command: "What treatments do you recommend for me?" },
                        "*",
                      )
                    }
                  }}
                  className="mt-2 text-xs text-sage-600 hover:text-sage-700 underline"
                >
                  Ask chat for recommendations
                </button>
              </div>
            ) : (
              suggestedAppointments.slice(0, isFullScreen ? 10 : 3).map((appointment) => (
                <Card key={appointment.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{appointment.treatment_type}</CardTitle>
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Suggested
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">AI-recommended treatment</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {appointment.notes && (
                      <p className="text-xs text-stone-600 mb-2 line-clamp-2">{appointment.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveAppointment(appointment.id)}
                        className="bg-sage-600 hover:bg-sage-700"
                      >
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}

        {activeView === "history" && (
          <>
            {pastTreatments.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                <p className="text-sm">No treatment history</p>
              </div>
            ) : (
              pastTreatments.map((treatment) => (
                <Card key={treatment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{treatment.treatment_type}</CardTitle>
                      <div className="flex items-center gap-2">
                        {treatment.effectiveness_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{treatment.effectiveness_rating}/5</span>
                          </div>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {new Date(treatment.date_performed).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    {treatment.provider && (
                      <CardDescription className="text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {treatment.provider}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        {treatment.notes && !isFullScreen && (
                          <p className="text-xs text-stone-600 mb-1 line-clamp-1">{treatment.notes}</p>
                        )}
                        {treatment.notes && isFullScreen && (
                          <p className="text-xs text-stone-600 mb-1">{treatment.notes}</p>
                        )}
                        {treatment.cost && <p className="text-xs font-medium">${treatment.cost}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
