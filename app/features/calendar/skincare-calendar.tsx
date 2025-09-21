/**
 * Skincare Calendar Component
 * 
 * Comprehensive calendar interface for managing skincare routines, appointments, and daily check-ins.
 * This component provides a unified view of all skincare-related activities, allowing users to
 * track their progress, manage appointments, and maintain consistent skincare routines.
 * 
 * Key Features:
 * - Interactive calendar with routine scheduling and tracking
 * - Daily routine completion status and progress indicators
 * - Appointment management with treatment details
 * - Check-in tracking with skin condition ratings
 * - Routine step visualization and completion tracking
 * - Responsive design for mobile and desktop
 * 
 * Data Management:
 * - Displays routines organized by day of the week
 * - Shows appointment schedules and treatment details
 * - Tracks daily check-ins and skin condition ratings
 * - Manages routine completion status and progress
 * - Provides visual indicators for routine adherence
 * 
 * User Experience:
 * - Intuitive calendar interface with clear visual hierarchy
 * - Quick access to routine details and completion status
 * - Appointment scheduling and management
 * - Progress tracking with visual feedback
 * - Mobile-optimized responsive design
 */

"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, User, CheckCircle, Circle, Expand } from "lucide-react"
import Link from "next/link"

interface Routine {
  id: string
  name: string
  type: string
  is_active: boolean
  routine_steps: Array<{
    id: string
    step_order: number
    instructions: string | null
    products: {
      name: string
      brand: string
    } | null
  }>
  day_of_week: number // New property to indicate the day of the week
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
  routines?: Routine[]
  appointments?: Appointment[]
  checkins?: DailyCheckin[]
  userId?: string
  onExpand?: () => void
  isFullScreen?: boolean
}

/**
 * SkincareCalendar Component
 * 
 * Main calendar component that renders the complete skincare management interface.
 * This component orchestrates the display of routines, appointments, and check-ins
 * in a unified calendar view, providing users with comprehensive skincare tracking.
 * 
 * Component Features:
 * - Renders interactive calendar with skincare data overlay
 * - Displays routine schedules and completion status
 * - Shows appointment information and treatment details
 * - Tracks daily check-ins and skin condition ratings
 * - Provides visual indicators for routine adherence
 * - Manages calendar navigation and date selection
 * 
 * Data Integration:
 * - Processes routine data with day-of-week organization
 * - Integrates appointment schedules and treatment details
 * - Handles check-in data with completion status
 * - Manages routine step visualization and tracking
 * - Provides real-time updates for data changes
 * 
 * @param {Object} props - Component props
 * @param {Routine[]} props.routines - Array of user routines with step details
 * @param {Appointment[]} props.appointments - Array of scheduled appointments
 * @param {DailyCheckin[]} props.checkins - Array of daily check-in records
 * @param {string} props.userId - User ID for data filtering
 * @param {Function} props.onExpand - Callback for expanding calendar view
 * @param {boolean} props.isFullScreen - Whether calendar is in full-screen mode
 * @returns {JSX.Element} Complete calendar interface with skincare data
 */
export function SkincareCalendar({
  routines,
  appointments,
  checkins,
  userId,
  onExpand,
  isFullScreen,
}: SkincareCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("calendar")

  const safeCheckins = checkins || []
  const safeRoutines = routines || []
  const safeAppointments = appointments || []

  // Create a map of check-ins by date for quick lookup
  const checkinsByDate = safeCheckins.reduce(
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

    const dayOfWeek = date.getDay()

    const dayAppointments = safeAppointments.filter((apt) => apt.scheduled_date.split("T")[0] === dateStr)

    // For the selected date, show routines that were actually tracked/completed
    // If it's today or future, show active routines for this specific day
    // If it's past and has check-in data, show routines that were tracked for this day
    const today = new Date().toISOString().split("T")[0]
    let relevantRoutines: Routine[] = []

    if (dateStr >= today) {
      relevantRoutines = safeRoutines.filter((r) => r.is_active && r.day_of_week === dayOfWeek)
    } else if (checkin) {
      const trackedRoutines = safeRoutines.filter((routine) => {
        // Only include routines for this specific day of week
        if (routine.day_of_week !== dayOfWeek) return false

        if (routine.type === "morning" && checkin.morning_routine_completed) return true
        if (routine.type === "evening" && checkin.evening_routine_completed) return true
        return false
      })

      // If no routines were completed but check-in exists, show what was available for this day
      if (trackedRoutines.length === 0) {
        relevantRoutines = safeRoutines.filter((r) => r.is_active && r.day_of_week === dayOfWeek)
      } else {
        relevantRoutines = trackedRoutines
      }
    } else {
      relevantRoutines = safeRoutines.filter((r) => r.is_active && r.day_of_week === dayOfWeek)
    }

    return {
      checkin,
      appointments: dayAppointments,
      routines: relevantRoutines,
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

    const dateStr = date.toISOString().split("T")[0]

    const hasCheckin = !!events.checkin

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className="text-sm">{date.getDate()}</span>
        <div className="flex gap-1 mt-1">
          {hasAppointment && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
          {hasCheckin && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
        </div>
      </div>
    )
  }

  const morningRoutines = safeRoutines.filter((r) => r.type === "morning")
  const eveningRoutines = safeRoutines.filter((r) => r.type === "evening")
  const upcomingAppointments = safeAppointments.slice(0, isFullScreen ? 10 : 5)

  return (
    <div className="space-y-6">
      {!isFullScreen && onExpand && (
        <div className="flex justify-end mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onExpand}
            className="border-stone-200 text-charcoal-600 hover:bg-stone-50 bg-transparent"
          >
            <Expand className="h-3 w-3 mr-1" />
            Expand
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className={`grid grid-cols-1 ${isFullScreen ? "lg:grid-cols-2" : ""} gap-6`}>
            {/* Calendar */}
            <div className={isFullScreen ? "lg:col-span-1" : ""}>
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
                  <div className={isFullScreen ? "" : "scale-90 origin-top"}>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border-0"
                      components={{
                        DayButton: ({ day, ...props }) => (
                          <Button
                            variant="ghost"
                            className={`${isFullScreen ? "h-12 w-12" : "h-10 w-10"} p-0 font-normal aria-selected:opacity-100`}
                            {...props}
                          >
                            {renderDayContent(day.date)}
                          </Button>
                        ),
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-charcoal-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Check-ins Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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
                    <h4 className="font-medium text-charcoal-800">Daily Routines</h4>
                    {selectedDateEvents.routines.map((routine) => {
                      const status = getRoutineStatus(routine, selectedDate)
                      return (
                        <div key={routine.id} className="p-4 bg-white rounded-lg border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {status === "completed" ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
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
                              className={status === "completed" ? "bg-green-100 text-green-800" : ""}
                            >
                              {status === "completed"
                                ? "Complete"
                                : status === "incomplete"
                                  ? "Incomplete"
                                  : "Not Tracked"}
                            </Badge>
                          </div>

                          {routine.routine_steps && routine.routine_steps.length > 0 && (
                            <div className="space-y-2 pl-8">
                              <h5 className="text-sm font-medium text-charcoal-700">Routine Steps:</h5>
                              <div className="space-y-1">
                                {routine.routine_steps
                                  .sort((a, b) => a.step_order - b.step_order)
                                  .slice(0, isFullScreen ? 8 : 5)
                                  .map((step) => (
                                    <div key={step.id} className="flex items-start gap-2 text-sm">
                                      <span className="text-charcoal-500 font-medium min-w-[20px]">
                                        {step.step_order}.
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-charcoal-600">
                                          {step.instructions || "No instructions provided"}
                                        </p>
                                        {step.products && (
                                          <p className="text-charcoal-500 text-xs mt-1">
                                            Product: {step.products.brand} {step.products.name}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                {routine.routine_steps.length > (isFullScreen ? 8 : 5) && (
                                  <p className="text-sm text-charcoal-500 pl-6">
                                    +{routine.routine_steps.length - (isFullScreen ? 8 : 5)} more steps
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
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
                            <p
                              className={`text-sm text-charcoal-600 mt-2 italic ${isFullScreen ? "" : "line-clamp-2"}`}
                            >
                              {appointment.notes}
                            </p>
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
