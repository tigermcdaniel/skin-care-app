"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Plus, MapPin, Star, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { GlobalNavigation } from "@/components/global-navigation"

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

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
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
  const pastTreatments = treatments.slice(0, 5)

  if (loading) {
    return (
      <>
        <GlobalNavigation />
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-stone-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <GlobalNavigation />
      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="font-serif text-4xl text-charcoal-900 mb-4">Professional Treatments</h1>
              <p className="text-charcoal-600 text-lg leading-relaxed">Track your aesthetic journey with expert care</p>
            </div>
            <Link href="/treatments/book">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-md font-medium transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Treatment
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <Tabs defaultValue="upcoming" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 bg-stone-100">
                <TabsTrigger
                  value="upcoming"
                  className="data-[state=active]:bg-sage-100 data-[state=active]:text-sage-800"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger
                  value="suggested"
                  className="data-[state=active]:bg-sage-100 data-[state=active]:text-sage-800"
                >
                  Suggested
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-sage-100 data-[state=active]:text-sage-800"
                >
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-sage-100 data-[state=active]:text-sage-800"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-6">
                {upcomingAppointments.length === 0 ? (
                  <Card className="text-center py-16 border-stone-200">
                    <CardContent>
                      <Calendar className="w-16 h-16 mx-auto text-stone-400 mb-6" />
                      <h3 className="font-serif text-xl text-charcoal-900 mb-3">No Upcoming Appointments</h3>
                      <p className="text-charcoal-600 mb-8 max-w-md mx-auto">
                        Schedule your next professional treatment or explore our suggested appointments.
                      </p>
                      <Link href="/treatments/book">
                        <Button className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-md">
                          Schedule Treatment
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingAppointments.map((appointment) => (
                      <Card key={appointment.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{appointment.treatment_type}</CardTitle>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Scheduled
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(appointment.scheduled_date).toLocaleDateString()}
                            </span>
                            {appointment.provider && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {appointment.provider}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {appointment.notes && <p className="text-sm text-gray-600 mb-4">{appointment.notes}</p>}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => completeAppointment(appointment.id)}>
                              Mark Complete
                            </Button>
                            <Link href={`/treatments/${appointment.id}/edit`}>
                              <Button size="sm" variant="ghost">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggested" className="space-y-4">
                {suggestedAppointments.length === 0 ? (
                  <Card className="text-center py-16 border-stone-200">
                    <CardContent>
                      <AlertCircle className="w-16 h-16 mx-auto text-stone-400 mb-6" />
                      <h3 className="font-serif text-xl text-charcoal-900 mb-3">No Suggested Treatments</h3>
                      <p className="text-charcoal-600">
                        Chat with our AI assistant to get personalized treatment recommendations.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {suggestedAppointments.map((appointment) => (
                      <Card key={appointment.id} className="border-l-4 border-l-yellow-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{appointment.treatment_type}</CardTitle>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Suggested
                            </Badge>
                          </div>
                          <CardDescription>AI-recommended treatment</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {appointment.notes && <p className="text-sm text-gray-600 mb-4">{appointment.notes}</p>}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveAppointment(appointment.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              Approve & Schedule
                            </Button>
                            <Button size="sm" variant="outline">
                              Dismiss
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {pastTreatments.length === 0 ? (
                  <Card className="text-center py-16 border-stone-200">
                    <CardContent>
                      <Clock className="w-16 h-16 mx-auto text-stone-400 mb-6" />
                      <h3 className="font-serif text-xl text-charcoal-900 mb-3">No Treatment History</h3>
                      <p className="text-charcoal-600">Your completed treatments will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pastTreatments.map((treatment) => (
                      <Card key={treatment.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{treatment.treatment_type}</CardTitle>
                            <div className="flex items-center gap-2">
                              {treatment.effectiveness_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm">{treatment.effectiveness_rating}/5</span>
                                </div>
                              )}
                              <Badge variant="secondary">
                                {new Date(treatment.date_performed).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                          {treatment.provider && (
                            <CardDescription className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {treatment.provider}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              {treatment.notes && <p className="text-sm text-gray-600 mb-2">{treatment.notes}</p>}
                              {treatment.cost && <p className="text-sm font-medium">${treatment.cost}</p>}
                            </div>
                            <Link href={`/treatments/${treatment.id}`}>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Treatment Frequency</CardTitle>
                      <CardDescription>Your treatment schedule over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-gray-500">Analytics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Effectiveness Ratings</CardTitle>
                      <CardDescription>How well treatments are working</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {treatments
                          .filter((t) => t.effectiveness_rating)
                          .map((treatment) => (
                            <div key={treatment.id} className="flex items-center justify-between">
                              <span className="text-sm">{treatment.treatment_type}</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= treatment.effectiveness_rating
                                        ? "text-yellow-500 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  )
}
