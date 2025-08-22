"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, User, CheckCircle, Circle } from "lucide-react"
import Link from "next/link"

interface Routine {
  id: string
  name: string
  type: string
  is_active: boolean
  routine_steps: Array<{
    id: string
    step_order: number
    instructions: string
    products: {
      name: string
      brand: string
    } | null
  }>
}

interface Appointment {
  id: string
  scheduled_date: string
  treatment_type: string
  provider: string
  status: string
  cost: number | null
  notes: string | null
}

interface DailyCheckin {
  id: string
  date: string
  morning_routine_completed: boolean
  evening_routine_completed: boolean
  skin_condition_rating: number | null
}

interface SkincareCalendarProps {
  routines: Routine[]
  appointments: Appointment[]
  checkins: DailyCheckin[]
  userId: string
}

export function SkincareCalendar({ routines, appointments, checkins, userId }: SkincareCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("calendar")

  // Create a map of check-ins by date for quick lookup
  const checkinsByDate = checkins.reduce(
    (acc, checkin) => {
      acc[checkin.date] = checkin
      return acc
    },
    {} as Record<string, DailyCheckin>,
  )

  // Get events for selected date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    const checkin = checkinsByDate[dateStr]

    const dayAppointments = appointments.filter((apt) => apt.scheduled_date.split("T")[0] === dateStr)

    return {
      checkin,
      appointments: dayAppointments,
      routines: routines.filter((r) => r.is_active),
    }
  }

  const selectedDateEvents = getEventsForDate(selectedDate)

  // Get routine completion status for a date
  const getRoutineStatus = (routine: Routine, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    const checkin = checkinsByDate[dateStr]

    if (!checkin) return "not-tracked"

    if (routine.type === "morning") {
      return checkin.morning_routine_completed ? "completed" : "incomplete"
    } else if (routine.type === "evening") {
      return checkin.evening_routine_completed ? "completed" : "incomplete"
    }

    return "not-tracked"
  }

  // Custom day content for calendar
  const renderDayContent = (date: Date) => {
    const events = getEventsForDate(date)
    const hasAppointment = events.appointments.length > 0
    const hasCompletedRoutine =
      events.checkin && (events.checkin.morning_routine_completed || events.checkin.evening_routine_completed)

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className="text-sm">{date.getDate()}</span>
        <div className="flex gap-1 mt-1">
          {hasAppointment && <div className="w-2 h-2 bg-burgundy-500 rounded-full"></div>}
          {hasCompletedRoutine && <div className="w-2 h-2 bg-sage-500 rounded-full"></div>}
        </div>
      </div>
    )
  }

  const morningRoutines = routines.filter((r) => r.type === "morning")
  const eveningRoutines = routines.filter((r) => r.type === "evening")
  const upcomingAppointments = appointments.slice(0, 5)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="routines">Ritual Schedule</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm bg-stone-50">
                <CardHeader>
                  <CardTitle className="font-serif text-charcoal-800">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </CardTitle>
                  <CardDescription className="text-charcoal-600">
                    Select a date to view your rituals and appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border-0"
                    components={{
                      DayButton: ({ day, ...props }) => (
                        <Button
                          variant="ghost"
                          className="h-12 w-12 p-0 font-normal aria-selected:opacity-100"
                          {...props}
                        >
                          {renderDayContent(day.date)}
                        </Button>
                      ),
                    }}
                  />

                  <div className="mt-4 flex items-center gap-4 text-sm text-charcoal-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-sage-500 rounded-full"></div>
                      <span>Ritual Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-burgundy-500 rounded-full"></div>
                      <span>Appointment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Details */}
            <div className="space-y-4">
              <Card className="border-0 shadow-sm bg-stone-50">
                <CardHeader>
                  <CardTitle className="font-serif text-charcoal-800">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Routines for selected date */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-charcoal-800">Daily Rituals</h4>
                    {selectedDateEvents.routines.map((routine) => {
                      const status = getRoutineStatus(routine, selectedDate)
                      return (
                        <div
                          key={routine.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-stone-200"
                        >
                          <div className="flex items-center gap-3">
                            {status === "completed" ? (
                              <CheckCircle className="h-5 w-5 text-sage-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-stone-400" />
                            )}
                            <div>
                              <p className="font-medium text-charcoal-800">{routine.name}</p>
                              <p className="text-sm text-charcoal-600 capitalize">{routine.type}</p>
                            </div>
                          </div>
                          <Badge
                            variant={status === "completed" ? "default" : "secondary"}
                            className={status === "completed" ? "bg-sage-100 text-sage-800" : ""}
                          >
                            {status === "completed"
                              ? "Complete"
                              : status === "incomplete"
                                ? "Incomplete"
                                : "Not Tracked"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>

                  {/* Appointments for selected date */}
                  {selectedDateEvents.appointments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-charcoal-800">Appointments</h4>
                      {selectedDateEvents.appointments.map((appointment) => (
                        <div key={appointment.id} className="p-3 bg-burgundy-50 rounded-lg border border-burgundy-200">
                          <div className="flex items-start gap-3">
                            <CalendarDays className="h-5 w-5 text-burgundy-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-charcoal-800">{appointment.treatment_type}</p>
                              <div className="flex items-center gap-2 text-sm text-charcoal-600 mt-1">
                                <User className="h-4 w-4" />
                                <span>{appointment.provider}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-charcoal-600">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {new Date(appointment.scheduled_date).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-stone-200">
                    <Button asChild className="w-full bg-sage-600 hover:bg-sage-700 text-white">
                      <Link href="/check-in">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Daily Reflection
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="routines" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Routines */}
            <Card className="border-0 shadow-sm bg-stone-50">
              <CardHeader>
                <CardTitle className="font-serif text-charcoal-800">Morning Rituals</CardTitle>
                <CardDescription className="text-charcoal-600">Start your day with intention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {morningRoutines.map((routine) => (
                  <div key={routine.id} className="p-4 bg-white rounded-lg border border-stone-200">
                    <h4 className="font-medium text-charcoal-800 mb-2">{routine.name}</h4>
                    <div className="space-y-2">
                      {routine.routine_steps.slice(0, 3).map((step) => (
                        <div key={step.id} className="text-sm text-charcoal-600">
                          {step.step_order}. {step.instructions}
                        </div>
                      ))}
                      {routine.routine_steps.length > 3 && (
                        <p className="text-sm text-charcoal-500">+{routine.routine_steps.length - 3} more steps</p>
                      )}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 border-sage-200 text-sage-700 hover:bg-sage-50 bg-transparent"
                    >
                      <Link href={`/routines/${routine.id}`}>View Full Ritual</Link>
                    </Button>
                  </div>
                ))}
                {morningRoutines.length === 0 && (
                  <div className="text-center py-8 text-charcoal-600">
                    <p>No morning rituals configured</p>
                    <Button asChild className="mt-4 bg-sage-600 hover:bg-sage-700 text-white">
                      <Link href="/routines">Create Morning Ritual</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evening Routines */}
            <Card className="border-0 shadow-sm bg-stone-50">
              <CardHeader>
                <CardTitle className="font-serif text-charcoal-800">Evening Rituals</CardTitle>
                <CardDescription className="text-charcoal-600">End your day with care</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {eveningRoutines.map((routine) => (
                  <div key={routine.id} className="p-4 bg-white rounded-lg border border-stone-200">
                    <h4 className="font-medium text-charcoal-800 mb-2">{routine.name}</h4>
                    <div className="space-y-2">
                      {routine.routine_steps.slice(0, 3).map((step) => (
                        <div key={step.id} className="text-sm text-charcoal-600">
                          {step.step_order}. {step.instructions}
                        </div>
                      ))}
                      {routine.routine_steps.length > 3 && (
                        <p className="text-sm text-charcoal-500">+{routine.routine_steps.length - 3} more steps</p>
                      )}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 border-sage-200 text-sage-700 hover:bg-sage-50 bg-transparent"
                    >
                      <Link href={`/routines/${routine.id}`}>View Full Ritual</Link>
                    </Button>
                  </div>
                ))}
                {eveningRoutines.length === 0 && (
                  <div className="text-center py-8 text-charcoal-600">
                    <p>No evening rituals configured</p>
                    <Button asChild className="mt-4 bg-sage-600 hover:bg-sage-700 text-white">
                      <Link href="/routines">Create Evening Ritual</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card className="border-0 shadow-sm bg-stone-50">
            <CardHeader>
              <CardTitle className="font-serif text-charcoal-800">Upcoming Appointments</CardTitle>
              <CardDescription className="text-charcoal-600">
                Your scheduled treatments and consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 bg-white rounded-lg border border-stone-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-charcoal-800 mb-2">{appointment.treatment_type}</h4>
                          <div className="space-y-1 text-sm text-charcoal-600">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              <span>
                                {new Date(appointment.scheduled_date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(appointment.scheduled_date).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{appointment.provider}</span>
                            </div>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-charcoal-600 mt-2 italic">{appointment.notes}</p>
                          )}
                        </div>
                        <Badge
                          variant={appointment.status === "confirmed" ? "default" : "secondary"}
                          className={appointment.status === "confirmed" ? "bg-sage-100 text-sage-800" : ""}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-charcoal-600">
                  <CalendarDays className="h-12 w-12 text-charcoal-400 mx-auto mb-4" />
                  <p>No upcoming appointments</p>
                  <Button asChild className="mt-4 bg-sage-600 hover:bg-sage-700 text-white">
                    <Link href="/treatments">Schedule Treatment</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
