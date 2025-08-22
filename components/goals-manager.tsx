"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Target, Edit, Trash2, CheckCircle } from "lucide-react"

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

interface GoalsManagerProps {
  goals: Goal[]
  userId: string
}

export function GoalsManager({ goals, userId }: GoalsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [progress, setProgress] = useState(0)

  const openDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal)
      setTitle(goal.title)
      setDescription(goal.description || "")
      setTargetDate(goal.target_date || "")
      setProgress(goal.progress)
    } else {
      setEditingGoal(null)
      setTitle("")
      setDescription("")
      setTargetDate("")
      setProgress(0)
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingGoal(null)
    setTitle("")
    setDescription("")
    setTargetDate("")
    setProgress(0)
  }

  const saveGoal = async () => {
    if (!title.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        target_date: targetDate || null,
        progress,
        status: progress >= 100 ? "completed" : "active",
      }

      if (editingGoal) {
        const { error } = await supabase
          .from("goals")
          .update({ ...goalData, updated_at: new Date().toISOString() })
          .eq("id", editingGoal.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("goals").insert({
          ...goalData,
          user_id: userId,
        })

        if (error) throw error
      }

      closeDialog()
      router.refresh()
    } catch (error) {
      console.error("Error saving goal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("goals").delete().eq("id", goalId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting goal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("goals")
        .update({
          progress: newProgress,
          status: newProgress >= 100 ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating goal progress:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const activeGoals = goals.filter((g) => g.status === "active")
  const completedGoals = goals.filter((g) => g.status === "completed")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Skincare Goals</h2>
          <p className="text-gray-600">Set and track your skincare objectives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
              <DialogDescription>Set a specific skincare objective to work towards</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Clear acne breakouts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal in more detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress ({progress}%)</Label>
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number.parseInt(e.target.value))}
                  className="w-full"
                />
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={saveGoal}
                  disabled={isLoading || !title.trim()}
                  className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600"
                >
                  {isLoading ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <Card key={goal.id} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && <CardDescription className="mt-1">{goal.description}</CardDescription>}
                    </div>
                    <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-600">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {goal.target_date && (
                    <div className="text-sm text-gray-600">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(goal)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress + 10))}
                      disabled={goal.progress >= 100}
                      className="text-green-600"
                    >
                      +10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Completed Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="border-0 shadow-lg bg-green-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <CardTitle className="text-lg text-green-800">{goal.title}</CardTitle>
                        {goal.description && <CardDescription className="mt-1">{goal.description}</CardDescription>}
                      </div>
                    </div>
                    <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-green-700">
                    Completed on {new Date(goal.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals set yet</h3>
          <p className="text-gray-600 mb-4">Create your first skincare goal to start tracking your progress</p>
          <Button
            onClick={() => openDialog()}
            className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </div>
      )}
    </div>
  )
}
