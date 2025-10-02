/**
 * Chat Sidebar Component
 * 
 * Resizable sidebar for the chat interface with tabbed navigation.
 */

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  SquareChevronLeft as SquareChartGantt,
  BookOpen,
  Stethoscope,
  LogOut,
  ClipboardCheck,
} from "lucide-react"
import { WeeklyRoutineTab } from "@/app/features/routines/components/weekly-routine-tab"
import { InventoryManagerTab } from "@/app/features/inventory/components/inventory-manager-tab"
import { SkincareCalendar } from "@/app/features/calendar/pages/skincare-calendar"
import { TreatmentsTab } from "@/app/features/treatments/components/treatments-tab"
import { CheckInTab } from "@/app/features/check-in/components/check-in-tab"
import { TabType } from "../types/chat"

interface ChatSidebarProps {
  activeTab: TabType
  sidebarWidth: number
  isResizing: boolean
  onTabChange: (tab: TabType) => void
  onSidebarResize: (width: number) => void
  onSignOut: () => void
  setIsResizing: (resizing: boolean) => void
}

export function ChatSidebar({
  activeTab,
  sidebarWidth,
  isResizing,
  onTabChange,
  onSidebarResize,
  onSignOut,
  setIsResizing,
}: ChatSidebarProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = window.innerWidth - e.clientX
    onSidebarResize(newWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Add event listeners for resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  return (
    <div
      className="flex flex-col h-full bg-stone-50 border-r border-stone-200"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif text-charcoal-800">Your Skincare Hub</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-charcoal-600 hover:text-charcoal-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab || "routines"} onValueChange={onTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4">
          <TabsTrigger value="routines" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Routines
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Collection
          </TabsTrigger>
        </TabsList>

        <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Treatments
          </TabsTrigger>
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <SquareChartGantt className="h-4 w-4" />
            Check-in
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="routines" className="h-full m-0">
            <WeeklyRoutineTab />
          </TabsContent>
          <TabsContent value="collection" className="h-full m-0">
            <InventoryManagerTab />
          </TabsContent>
          <TabsContent value="calendar" className="h-full m-0">
            <SkincareCalendar />
          </TabsContent>
          <TabsContent value="treatments" className="h-full m-0">
            <TreatmentsTab />
          </TabsContent>
          <TabsContent value="checkin" className="h-full m-0">
            <CheckInTab />
          </TabsContent>
        </div>
      </Tabs>

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-stone-300 hover:bg-stone-400 cursor-col-resize"
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
