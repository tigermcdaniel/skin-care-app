"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

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

interface ProgressChartProps {
  checkins: DailyCheckin[]
}

export function ProgressChart({ checkins }: ProgressChartProps) {
  // Prepare data for charts
  const chartData = checkins
    .filter((c) => c.skin_condition_rating !== null)
    .reverse()
    .map((checkin) => ({
      date: new Date(checkin.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      skinRating: checkin.skin_condition_rating,
      moodRating: checkin.mood_rating,
      stressLevel: checkin.stress_level,
      sleepHours: checkin.sleep_hours,
      waterIntake: checkin.water_intake,
      routineCompletion: (checkin.morning_routine_completed ? 50 : 0) + (checkin.evening_routine_completed ? 50 : 0),
    }))

  const routineData = checkins
    .reverse()
    .slice(0, 14)
    .map((checkin) => ({
      date: new Date(checkin.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      morning: checkin.morning_routine_completed ? 1 : 0,
      evening: checkin.evening_routine_completed ? 1 : 0,
    }))

  return (
    <div className="space-y-6">
      {/* Skin Condition Trend */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Skin Condition Trend</CardTitle>
          <CardDescription>Track how your skin condition changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 10]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="skinRating"
                  stroke="url(#skinGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#f43f5e", strokeWidth: 2, r: 4 }}
                />
                <defs>
                  <linearGradient id="skinGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No skin condition data available</p>
              <p className="text-sm">Start logging daily check-ins to see your progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routine Completion */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Routine Completion (Last 14 Days)</CardTitle>
          <CardDescription>Track your consistency with morning and evening routines</CardDescription>
        </CardHeader>
        <CardContent>
          {routineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => (value === 1 ? "✓" : "")} />
                <Tooltip
                  formatter={(value, name) => [
                    value === 1 ? "Completed" : "Not Completed",
                    name === "morning" ? "Morning" : "Evening",
                  ]}
                />
                <Bar dataKey="morning" fill="#fbbf24" name="Morning" />
                <Bar dataKey="evening" fill="#8b5cf6" name="Evening" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No routine data available</p>
              <p className="text-sm">Start completing your routines to see your consistency</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifestyle Factors */}
      {chartData.some((d) => d.sleepHours || d.waterIntake) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Sleep Hours</CardTitle>
              <CardDescription>Track your sleep patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.filter((d) => d.sleepHours)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 12]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sleepHours" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Water Intake</CardTitle>
              <CardDescription>Track your daily hydration</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.filter((d) => d.waterIntake)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="waterIntake" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
