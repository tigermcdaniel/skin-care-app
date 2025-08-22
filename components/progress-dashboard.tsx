"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoGallery } from "@/components/photo-gallery"
import { ProgressChart } from "@/components/progress-chart"
import { GoalsManager } from "@/components/goals-manager"
import { Camera, TrendingUp, Target } from "lucide-react"
import Link from "next/link"

interface ProgressPhoto {
  id: string
  user_id: string
  photo_url: string
  photo_type: string
  notes: string | null
  lighting_conditions: string | null
  skin_condition_rating: number | null
  created_at: string
}

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

interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  status: string
  progress: number
  created_at: string
  updated_at: string
}

interface ProgressDashboardProps {
  photos: ProgressPhoto[]
  checkins: DailyCheckin[]
  goals: Goal[]
  userId: string
}

export function ProgressDashboard({ photos, checkins, goals, userId }: ProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate stats
  const totalPhotos = photos.length
  const recentPhotos = photos.slice(0, 6)
  const activeGoals = goals.filter((g) => g.status === "active")
  const completedGoals = goals.filter((g) => g.status === "completed")

  // Calculate routine completion rate for last 7 days
  const last7Days = checkins.slice(0, 7)
  const routineCompletionRate =
    last7Days.length > 0
      ? Math.round(
          (last7Days.filter((c) => c.morning_routine_completed || c.evening_routine_completed).length /
            last7Days.length) *
            100,
        )
      : 0

  // Calculate average skin condition rating
  const ratingsWithValues = checkins.filter((c) => c.skin_condition_rating !== null)
  const avgSkinRating =
    ratingsWithValues.length > 0
      ? Math.round(
          (ratingsWithValues.reduce((sum, c) => sum + (c.skin_condition_rating || 0), 0) / ratingsWithValues.length) *
            10,
        ) / 10
      : 0

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-sage-500 rounded-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal-800">{totalPhotos}</p>
                <p className="text-sm text-charcoal-600">Progress Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-rose-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal-800">{routineCompletionRate}%</p>
                <p className="text-sm text-charcoal-600">Ritual Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-burgundy-500 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal-800">{activeGoals.length}</p>
                <p className="text-sm text-charcoal-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-charcoal-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{avgSkinRating}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal-800">/10</p>
                <p className="text-sm text-charcoal-600">Avg Skin Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-stone-50">
        <CardHeader>
          <CardTitle className="font-serif text-charcoal-800">Quick Actions</CardTitle>
          <CardDescription className="text-charcoal-600">Track your progress and manage your goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-sage-600 hover:bg-sage-700 text-white">
              <Link href="/check-in">
                <Camera className="h-4 w-4 mr-2" />
                Daily Reflection
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-sage-200 text-sage-700 hover:bg-sage-50 bg-transparent">
              <Link href="/progress?tab=photos">
                <TrendingUp className="h-4 w-4 mr-2" />
                View All Photos
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-sage-200 text-sage-700 hover:bg-sage-50 bg-transparent">
              <Link href="/progress?tab=goals">
                <Target className="h-4 w-4 mr-2" />
                Manage Goals
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Photos */}
          <Card className="border-0 shadow-sm bg-stone-50">
            <CardHeader>
              <CardTitle className="font-serif text-charcoal-800">Recent Progress Photos</CardTitle>
              <CardDescription className="text-charcoal-600">Your latest skin progress captures</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {recentPhotos.map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.photo_url || "/placeholder.svg"}
                        alt="Progress photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No progress photos yet</p>
                  <Button asChild className="mt-4">
                    <Link href="/check-in">Take Your First Photo</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card className="border-0 shadow-sm bg-stone-50">
            <CardHeader>
              <CardTitle className="font-serif text-charcoal-800">Active Goals</CardTitle>
              <CardDescription className="text-charcoal-600">Track your skincare objectives</CardDescription>
            </CardHeader>
            <CardContent>
              {activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{goal.title}</h4>
                        <span className="text-sm text-gray-600">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      {goal.target_date && (
                        <p className="text-sm text-gray-500">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active goals</p>
                  <Button
                    asChild
                    className="mt-4 bg-transparent border-sage-200 text-sage-700 hover:bg-sage-50"
                    variant="outline"
                  >
                    <Link href="/progress?tab=goals">Create Your First Goal</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <PhotoGallery photos={photos} userId={userId} />
        </TabsContent>

        <TabsContent value="analytics">
          <ProgressChart checkins={checkins} />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsManager goals={goals} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
