"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/integrations/supabase/client"
import {
  Calendar,
  SquareChevronLeft as SquareChartGantt,
  BookOpen,
  Stethoscope,
  LogOut,
  ClipboardCheck,
} from "lucide-react"
import { useSkincareData, SkincareDataProvider } from "@/app/features/shared/contexts/skincare-data-context"
import { WeeklyRoutineTab } from "@/app/features/routines/weekly-routine-tab"
import { InventoryManagerTab } from "@/app/features/inventory/inventory-manager-tab"
import { SkincareCalendar } from "@/app/features/calendar/skincare-calendar"
import { TreatmentsTab } from "@/app/features/treatments/treatments-tab"
import { CheckInTab } from "@/app/features/check-in/check-in-tab"
import { ChatMessageComponent } from "../components/chat-message"
import { ChatInput } from "../components/chat-input"
import { ChatActionHandlers } from "../lib/chat-action-handlers"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

type TabType = "routines" | "collection" | "calendar" | "treatments" | "checkin" | null

const QUICK_COMMANDS = [
  "What's my morning routine?",
  "Help me build a routine.",
  "What is in my cabinet?",
  "Do i have any upcoming appointments?",
]

function ChatConversationPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showActionTriggers, setShowActionTriggers] = useState(true)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>({} as HTMLDivElement)
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabType | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const [tabPanelWidth, setTabPanelWidth] = useState(384) // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  const {
    routines,
    inventory,
    checkIns,
    goals,
    markRoutineComplete,
    addProductToInventory: addToInventory,
    addGoal,
    refreshData,
    onDataChange,
    removeFromInventory,
  } = useSkincareData()

  const actionHandlers = new ChatActionHandlers()

  useEffect(() => {
    const cleanup = onDataChange(() => {
      // Notify chat that data has changed
      console.log("[v0] Data updated - chat context refreshed")
    })

    return cleanup
  }, [onDataChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return

    setShowActionTriggers(false)

    const imageUrls: string[] = []
    if (selectedImages.length > 0) {
      try {
        const uploadPromises = selectedImages.map(async (image) => {
          const formData = new FormData()
          formData.append("file", image)

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json()
            return url
          }
          return null
        })

        const results = await Promise.all(uploadPromises)
        imageUrls.push(...results.filter((url) => url !== null))
      } catch (error) {
        console.error("Error uploading images:", error)
      }
    }

    const messageContent =
      input.trim() || `I've shared ${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""} with you.`
    const imageText = imageUrls.length > 0 ? `\n\n${imageUrls.map((url) => `[IMAGE: ${url}]`).join("\n")}` : ""

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent + imageText,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    await saveMessage("user", userMessage.content)

    const currentInput = input
    setInput("")
    removeImages() // Updated function name
    setIsLoading(true)

    try {
      const contextData = {
        routines: routines.length,
        inventory: inventory.length,
        recentCheckIns: checkIns.slice(0, 3).map((checkin) => ({
          date: checkin.date,
          skin_condition: checkin.skin_condition_rating,
          morning_routine_completed: checkin.morning_routine_completed,
          evening_routine_completed: checkin.evening_routine_completed,
          notes: checkin.notes,
        })),
        activeGoals: goals.filter((g) => g.status === "active").length,
        currentTab: activeTab,
        tabData: {
          routines:
            activeTab === "routines"
              ? routines.map((r) => ({
                  name: r.name,
                  type: r.type,
                  steps: r.routine_steps?.length || 0,
                  isActive: r.is_active,
                }))
              : null,
          inventory:
            activeTab === "collection"
              ? inventory.map((i) => ({
                  name: i.products.name,
                  brand: i.products.brand,
                  category: i.products.category,
                  amountRemaining: i.amount_remaining,
                  needsReorder: i.amount_remaining <= 20,
                }))
              : null,
        },
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: contextData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: assistantContent,
            created_at: new Date().toISOString(),
          }

          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = assistantMessage
            } else {
              newMessages.push(assistantMessage)
            }
            return newMessages
          })
        }

        await saveMessage("assistant", assistantContent)
      }
    } catch (error) {
      console.error("Error getting chat response:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickCommand = (command: string) => {
    setInput(command)
    setShowActionTriggers(false)
  }

  const handleAddProduct = async (product: any) => {
    try {
      setIsLoading(true)
      await addToInventory(
        product.id || "placeholder",
        `Recommended Product: ${product.name} by ${product.brand}\nCategory: ${product.category}\nDescription: ${product.description}\nKey Ingredients: ${product.key_ingredients?.join(", ") || ""}\nBenefits: ${product.benefits?.join(", ") || ""}`,
      )

      // Show success message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `✓ Added ${product.name} by ${product.brand} to your collection with detailed information.`,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Sorry, I couldn't add ${product.name} to your collection. Please try again.`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRoutine = async (routine: any) => {
    await actionHandlers.acceptRoutineUpdate(routine)
  }

  const handleCompleteRoutine = async (action: any) => {
    await actionHandlers.handleRoutineCompleteAction(action, routines, markRoutineComplete)
  }

  const handleCabinetAction = async (action: any) => {
    try {
      if (action.action === "add") {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error("No authentication session found")
        }

        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "add",
            product_name: action.product_name,
            product_brand: action.product_brand,
            reason: action.reason,
            category: action.category || "skincare",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add product to cabinet")
        }

        const result = await response.json()

        if (result.success) {
          await refreshData()

          const confirmMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `✓ Added ${action.product_name} by ${action.product_brand} to your collection.`,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, confirmMessage])
        } else {
          throw new Error(result.error || "Failed to add product")
        }
      } else if (action.action === "remove") {
        const result = await actionHandlers.handleCabinetAction(action, inventory, removeFromInventory)
        if (result?.success) {
          await refreshData()

          const confirmMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: result.message,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, confirmMessage])
        }
      }
    } catch (error) {
      console.error("Error handling cabinet action:", error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Sorry, there was an error updating your cabinet. Please try again.`,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleAddAppointment = async (action: any) => {
    await actionHandlers.handleAppointmentAction(action)
  }

  const handleCreateGoal = async (goal: any) => {
    await actionHandlers.createGoal(goal, addGoal)
    await refreshData()
  }

  const handleTreatmentSuggestion = async (treatment: any) => {
    console.log("Treatment suggestion clicked:", treatment)
  }

  const handleCheckinAction = async (action: any) => {
    try {
      const result = await actionHandlers.handleCheckinAction(action)
      if (result?.success) {
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: result.message,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, successMessage])
        await saveMessage("assistant", successMessage.content)

        if (result.analysis) {
          const analysisMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `I've analyzed your photos and added them to your daily check-in! Here's what I found:\n\n**Skin Analysis**: ${result.analysis}\n\nWould you like me to suggest any routine adjustments based on this analysis?`,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, analysisMessage])
          await saveMessage("assistant", analysisMessage.content)
        }
      }

      await refreshData()
    } catch (error) {
      console.error("Error adding photos to check-in:", error)
      alert("Failed to add photos to check-in. Please try again.")
    }
  }

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const messageData = {
        user_id: user.id,
        message_type: role,
        ...(role === "user" ? { message: content, response: null } : { message: null, response: content }),
      }

      await supabase.from("chat_history").insert(messageData)
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const loadMessages = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading messages:", error)
        return
      }

      if (data) {
        const mappedMessages = data.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.message_type as "user" | "assistant",
          content: msg.message_type === "user" ? msg.message || "" : msg.response || "",
          created_at: msg.created_at,
        }))

        setMessages(mappedMessages)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [params.id])

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      setInput(initialPrompt)
      setShowActionTriggers(false)
    }
  }, [initialPrompt, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleExpandTab = (tab: TabType) => {
    setActiveTab(tab)
    setIsFullScreen(true)
  }

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab)
    setIsFullScreen(false)
  }

  const handleReturnToChat = () => {
    setIsFullScreen(false)
    setActiveTab("routines")
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const validFiles = files.filter((file) => file.type.startsWith("image/"))

      setSelectedImages((prev) => [...prev, ...validFiles])

      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeImages = () => {
    setSelectedImages([])
    setImagePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return

    const containerWidth = window.innerWidth
    const newWidth = containerWidth - e.clientX

    // Constrain width between 300px and 60% of screen width
    const minWidth = 300
    const maxWidth = containerWidth * 0.6
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

    setTabPanelWidth(constrainedWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }
  }, [isResizing])

  // Fetch user data
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchUser()
  }, [])

  // Fetch appointments
  const [appointments, setAppointments] = useState<any[]>([])
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) return

      const { data, error } = await supabase.from("appointments").select("*").eq("user_id", user.id)

      if (error) {
        console.error("Error fetching appointments:", error)
      } else {
        setAppointments(data || [])
      }
    }

    fetchAppointments()
  }, [user?.id])

  // Fetch checkins
  const [checkins, setCheckins] = useState<any[]>([])
  useEffect(() => {
    const fetchCheckins = async () => {
      if (!user?.id) return

      const { data, error } = await supabase.from("daily_checkins").select("*").eq("user_id", user.id)

      if (error) {
        console.error("Error fetching checkins:", error)
      } else {
        setCheckins(data || [])
      }
    }

    fetchCheckins()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {isFullScreen && (
        <button
          onClick={handleReturnToChat}
          className="fixed left-4 top-4 z-50 bg-sage-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-sage-700 transition-colors flex items-center space-x-2"
        >
          <span>← Open Chat</span>
        </button>
      )}

      <div
        className={`flex-1 flex flex-col ${isFullScreen ? "hidden" : ""} transition-all duration-300`}
        style={{
          marginRight: !isFullScreen && activeTab ? `${tabPanelWidth}px` : "0px",
        }}
      >
        <div className="sticky top-0 z-30 bg-white border-b border-stone-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-serif text-charcoal-900">Skincare Advisor</h1>
            <div className="flex items-center space-x-4">
              {activeTab && (
                <button
                  onClick={() => {
                    setActiveTab("routines")
                    setIsFullScreen(false)
                  }}
                  className="text-sm text-stone-600 hover:text-charcoal-900 transition-colors"
                >
                  Reset View
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-stone-600 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-1 bg-stone-100 p-1 rounded-lg">
            <button
              onClick={() => handleSwitchTab("routines")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "routines"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Routines</span>
            </button>
            <button
              onClick={() => handleSwitchTab("collection")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "collection"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <SquareChartGantt className="w-4 h-4" />
              <span>Cabinet</span>
            </button>
            <button
              onClick={() => handleSwitchTab("calendar")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "calendar"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => handleSwitchTab("treatments")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "treatments"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Treatments</span>
            </button>
            <button
              onClick={() => handleSwitchTab("checkin")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "checkin"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Check-in</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && showActionTriggers && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-serif text-charcoal-900 mb-4">How can I help you today?</h2>
                <p className="text-stone-600 mb-8">Ask me anything about skincare, routines, or products.</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              onAddProduct={handleAddProduct}
              onAcceptRoutine={handleAcceptRoutine}
              onCompleteRoutine={handleCompleteRoutine}
              onCabinetAction={handleCabinetAction}
              onAddAppointment={handleAddAppointment}
              onCheckinAction={handleCheckinAction}
              onCreateGoal={handleCreateGoal}
              onTreatmentSuggestion={handleTreatmentSuggestion}
              isLoading={isLoading}
              checkIns={checkIns}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-stone-100 text-charcoal-900 border border-stone-200 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          selectedImages={selectedImages} // Updated prop name
          imagePreviews={imagePreviews} // Updated prop name
          onImageSelect={handleImageSelect}
          onRemoveImage={removeImage} // Updated prop name
          fileInputRef={fileInputRef}
          quickCommands={QUICK_COMMANDS}
          onQuickCommand={handleQuickCommand}
          showQuickCommands={messages.length === 0}
        />
      </div>

      {activeTab && !isFullScreen && (
        <div
          ref={resizeRef}
          className="fixed top-0 w-1 h-full bg-stone-300 hover:bg-sage-400 cursor-col-resize z-40 transition-colors"
          style={{ right: `${tabPanelWidth}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-stone-400 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      )}

      {activeTab && (
        <div
          className={`${isFullScreen ? "fixed inset-0 z-40" : "fixed right-0 top-0 h-full"} bg-white ${isFullScreen ? "" : "border-l border-stone-200 shadow-lg"} z-50`}
          style={{
            width: isFullScreen ? "100%" : `${tabPanelWidth}px`,
          }}
        >
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-charcoal-900 capitalize">{activeTab}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setActiveTab(null)
                    setIsFullScreen(false)
                  }}
                  className="text-stone-500 hover:text-charcoal-900 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          <div className="h-full overflow-y-auto p-4">
            {activeTab === "routines" && (
              <WeeklyRoutineTab onExpand={() => handleExpandTab("routines")} isFullScreen={isFullScreen} />
            )}
            {activeTab === "collection" && (
              <InventoryManagerTab onExpand={() => handleExpandTab("collection")} isFullScreen={isFullScreen} />
            )}
            {activeTab === "calendar" && (
              <SkincareCalendar
                routines={(routines || []).map(routine => ({
                  ...routine,
                  day_of_week: routine.day_of_week ?? 0
                }))}
                appointments={appointments || []}
                checkins={checkins || []}
                userId={user?.id}
                onExpand={() => handleExpandTab("calendar")}
                isFullScreen={isFullScreen}
              />
            )}
            {activeTab === "treatments" && (
              <TreatmentsTab onExpand={() => handleExpandTab("treatments")} isFullScreen={isFullScreen} />
            )}
            {activeTab === "checkin" && (
              <CheckInTab onExpand={() => handleExpandTab("checkin")} isFullScreen={isFullScreen} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatConversationPage() {
  return (
    <SkincareDataProvider>
      <ChatConversationPageContent />
    </SkincareDataProvider>
  )
}
