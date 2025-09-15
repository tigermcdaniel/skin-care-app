"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Calendar,
  SquareChevronLeft as SquareChartGantt,
  BookOpen,
  BarChart3,
  Stethoscope,
  LogOut,
  ImageIcon,
  ClipboardCheck,
  Bot,
  CheckCircle,
  Minus,
  Plus,
  Camera,
} from "lucide-react"
import { useSkincareData, SkincareDataProvider } from "@/contexts/skincare-data-context"
import { RoutineManagerTab } from "@/components/routine-manager-tab"
import { InventoryManagerTab } from "@/components/inventory-manager-tab"
import { ProgressDashboardTab } from "@/components/progress-dashboard-tab"
import { SkincareCalendar } from "@/components/skincare-calendar"
import { TreatmentsTab } from "@/components/treatments-tab"
import { CheckInTab } from "@/components/check-in-tab"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface ProductRecommendation {
  name: string
  brand: string
  category: string
  description: string
  key_ingredients: string[]
  benefits: string[]
  reason: string
}

interface RoutineUpdate {
  type: "morning" | "evening"
  changes: string[]
}

interface TreatmentSuggestion {
  type: string
  reason: string
  frequency: string
}

interface GoalSuggestion {
  title: string
  description: string
  target_date: string
}

interface RoutineAction {
  type: "morning" | "evening"
  routine_name: string
  action: "complete"
}

interface CabinetAction {
  action: "add" | "remove"
  product_name: string
  product_brand: string
  category?: string
  amount_remaining?: number
  reason: string
}

type AppointmentAction = {
  action: "add"
  treatment_type: string
  date: string
  time: string
  provider: string
  location: string
  notes?: string
}

type TabType = "routines" | "collection" | "products" | "progress" | "calendar" | "treatments" | "checkin" | null

const QUICK_COMMANDS = [
  "What's my morning routine?",
  "Show me products running low",
  "How is my skin progress?",
  "Recommend products for dry skin",
  "Help me with breakouts",
]

const ACTION_TRIGGERS: any[] = []

const formatMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>")
}

function ChatConversationPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showActionTriggers, setShowActionTriggers] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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

  useEffect(() => {
    const cleanup = onDataChange(() => {
      // Notify chat that data has changed
      console.log("[v0] Data updated - chat context refreshed")
    })

    return cleanup
  }, [onDataChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return

    setShowActionTriggers(false)

    let imageUrl = null
    if (selectedImage) {
      try {
        const formData = new FormData()
        formData.append("file", selectedImage)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json()
          imageUrl = url
        }
      } catch (error) {
        console.error("Error uploading image:", error)
      }
    }

    const messageContent = input.trim() || "I've shared an image with you."
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: imageUrl ? `${messageContent}\n\n[IMAGE: ${imageUrl}]` : messageContent,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    await saveMessage("user", userMessage.content)

    const currentInput = input
    setInput("")
    removeImage()
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
          progress:
            activeTab === "progress"
              ? {
                  recentCheckIns: checkIns.slice(0, 5),
                  activeGoals: goals.filter((g) => g.status === "active"),
                }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleQuickCommand = (command: string) => {
    setInput(command)
    setShowActionTriggers(false)
  }

  const handleActionTrigger = (trigger: (typeof ACTION_TRIGGERS)[0]) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `I'm opening your ${trigger.label.toLowerCase()} for you. You can reference this information and come back to chat for any questions or actions.`,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, systemMessage])

    router.push(trigger.href)
  }

  const acceptRoutineUpdate = async (routine: RoutineUpdate) => {
    try {
      console.log("[v0] Accepting routine update:", routine)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Please log in to update your routine")
        return
      }

      const { data: existingRoutines, error: fetchError } = await supabase
        .from("routines")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("type", routine.type)
        .eq("is_active", true)

      if (fetchError) {
        console.error("[v0] Error fetching routine:", fetchError)
        alert("Failed to find your existing routine. Please try again.")
        return
      }

      let routineId: string
      let routineName: string

      if (!existingRoutines || existingRoutines.length === 0) {
        const { data: newRoutine, error: createError } = await supabase
          .from("routines")
          .insert({
            user_id: user.id,
            name: `${routine.type.charAt(0).toUpperCase() + routine.type.slice(1)} Routine`,
            type: routine.type,
            is_active: true,
          })
          .select("id, name")
          .single()

        if (createError || !newRoutine) {
          console.error("[v0] Error creating routine:", createError)
          alert("Failed to create routine. Please try again.")
          return
        }

        routineId = newRoutine.id
        routineName = newRoutine.name
      } else {
        const existingRoutine = existingRoutines[0]
        routineId = existingRoutine.id
        routineName = existingRoutine.name
      }

      const { data: existingProduct, error: productError } = await supabase
        .from("products")
        .select("id")
        .limit(1)
        .single()

      if (productError || !existingProduct) {
        console.error("[v0] Error finding existing product:", productError)
        alert("Unable to find products in database. Please contact support.")
        return
      }

      const placeholderProductId = existingProduct.id

      const { data: existingSteps, error: stepsError } = await supabase
        .from("routine_steps")
        .select("step_order")
        .eq("routine_id", routineId)
        .order("step_order", { ascending: false })
        .limit(1)

      if (stepsError) {
        console.error("[v0] Error fetching routine steps:", stepsError)
      }

      const nextStepOrder = existingSteps && existingSteps.length > 0 ? existingSteps[0].step_order + 1 : 1

      const newSteps = routine.changes.map((change, index) => ({
        routine_id: routineId,
        step_order: nextStepOrder + index,
        instructions: change,
        product_id: placeholderProductId,
        amount: "As needed",
      }))

      const { error: insertError } = await supabase.from("routine_steps").insert(newSteps)

      if (insertError) {
        console.error("[v0] Error inserting routine steps:", insertError)
        alert("Failed to update routine. Please try again.")
        return
      }

      const updatedName = routineName.includes("(Updated)") ? routineName : `${routineName} (Updated)`

      const { error: updateError } = await supabase
        .from("routines")
        .update({
          name: updatedName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", routineId)

      if (updateError) {
        console.error("[v0] Error updating routine:", updateError)
        alert("Failed to update routine name. Please try again.")
        return
      }

      console.log("[v0] Successfully updated routine")
      alert(
        `${routine.type.charAt(0).toUpperCase() + routine.type.slice(1)} routine updated successfully! Check your routines to see the changes.`,
      )
    } catch (error) {
      console.error("[v0] Error updating routine:", error)
      alert("Failed to update routine. Please try again.")
    }
  }

  const addProductToInventory = async (product: ProductRecommendation, amountRemaining = 100) => {
    try {
      setIsLoading(true)

      // Look for an existing product that matches or is similar
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("name", product.name)
        .eq("brand", product.brand)
        .single()

      let productId = existingProduct?.id

      // If no exact match, try to find a similar product in the same category
      if (!productId) {
        const { data: similarProducts } = await supabase
          .from("products")
          .select("id")
          .eq("category", product.category)
          .limit(1)

        if (similarProducts && similarProducts.length > 0) {
          productId = similarProducts[0].id
        }
      }

      // If still no product found, create a new product entry
      if (!productId) {
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            name: product.name,
            brand: product.brand,
            category: product.category,
            description: product.description,
            key_ingredients: product.key_ingredients.join(", "),
            benefits: product.benefits.join(", "),
          })
          .select("id")
          .single()

        if (productError || !newProduct) {
          console.error("Error creating new product:", productError)
          throw new Error("Failed to create new product")
        }

        productId = newProduct.id
      }

      const userId = (await supabase.auth.getUser()).data.user?.id
      const { data: existingInventory } = await supabase
        .from("user_inventory")
        .select("id, notes")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .single()

      // Add to user's inventory with detailed notes about the actual product
      const productNotes = `Recommended Product: ${product.name} by ${product.brand}
Category: ${product.category}
Description: ${product.description}
Key Ingredients: ${product.key_ingredients.join(", ")}
Benefits: ${product.benefits.join(", ")}`

      if (existingInventory) {
        // Update existing entry with new notes
        const { error: updateError } = await supabase
          .from("user_inventory")
          .update({
            notes: productNotes,
            amount_remaining: amountRemaining, // Reset to full
          })
          .eq("id", existingInventory.id)

        if (updateError) throw updateError
      } else {
        // Insert new inventory entry
        const { error: inventoryError } = await supabase.from("user_inventory").insert({
          user_id: userId,
          product_id: productId,
          amount_remaining: amountRemaining,
          purchase_date: new Date().toISOString().split("T")[0],
          notes: productNotes,
        })

        if (inventoryError) throw inventoryError
      }

      // Refresh data
      await refreshData()

      // Show success message
      const actionText = existingInventory ? "updated" : "added"
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Great! I've ${actionText} ${product.name} by ${product.brand} in your collection with detailed information. You can see it in your Collection tab.`,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Error adding product to inventory:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Sorry, I couldn't add ${product.name} to your collection. Please try again.`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoutineCompleteAction = async (routineAction: RoutineAction) => {
    try {
      // Find the routine by type
      const routine = routines.find((r) => r.type === routineAction.type && r.is_active)
      if (!routine) {
        alert(`No active ${routineAction.type} routine found`)
        return
      }

      await markRoutineComplete(routine.id, routine.name)
      alert(`${routineAction.type.charAt(0).toUpperCase() + routineAction.type.slice(1)} routine marked as complete!`)
    } catch (error) {
      console.error("Error completing routine:", error)
      alert("Failed to mark routine as complete. Please try again.")
    }
  }

  const handleCabinetAction = async (action: CabinetAction) => {
    try {
      if (action.action === "remove") {
        // Find the product in inventory and remove it
        const productToRemove = inventory?.find(
          (item) =>
            item.products?.name.toLowerCase() === action.product_name.toLowerCase() &&
            item.products?.brand.toLowerCase() === action.product_brand.toLowerCase(),
        )

        if (productToRemove) {
          await removeFromInventory(productToRemove.id)

          const confirmMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `✓ Removed ${action.product_name} by ${action.product_brand} from your cabinet.`,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, confirmMessage])
        }
      } else if (action.action === "add") {
        // Create a ProductRecommendation object from the CabinetAction
        const productRecommendation: ProductRecommendation = {
          name: action.product_name,
          brand: action.product_brand,
          category: action.category || "skincare",
          description: `AI-recommended product: ${action.reason}`,
          key_ingredients: [],
          benefits: [],
          reason: action.reason,
        }

        // Use addProductToInventory which handles both existing and AI-researched products
        await addProductToInventory(productRecommendation, action.amount_remaining || 100)

        const confirmMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `✓ Added ${action.product_name} by ${action.product_brand} to your collection with detailed information.`,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, confirmMessage])
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
        const mappedMessages = data.map((msg) => ({
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

  const parseStructuredResponse = (content: string) => {
    const products: ProductRecommendation[] = []
    const routines: RoutineUpdate[] = []
    const treatments: TreatmentSuggestion[] = []
    const goals: GoalSuggestion[] = []
    const routineActions: RoutineAction[] = []
    const cabinetActions: CabinetAction[] = []
    const appointmentActions: AppointmentAction[] = []

    // Parse products
    const productMatches = content.match(/\[PRODUCT\](.*?)\[\/PRODUCT\]/g)
    if (productMatches) {
      productMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[PRODUCT\]/, "").replace(/\[\/PRODUCT\]/, "")
          const product = JSON.parse(jsonStr)
          products.push(product)
        } catch (e) {
          console.error("Failed to parse product:", e)
        }
      })
    }

    // Parse routines
    const routineMatches = content.match(/\[ROUTINE\](.*?)\[\/ROUTINE\]/g)
    if (routineMatches) {
      routineMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[ROUTINE\]/, "").replace(/\[\/ROUTINE\]/, "")
          const routine = JSON.parse(jsonStr)
          routines.push(routine)
        } catch (e) {
          console.error("Failed to parse routine:", e)
        }
      })
    }

    // Parse treatments
    const treatmentMatches = content.match(/\[TREATMENT\](.*?)\[\/TREATMENT\]/g)
    if (treatmentMatches) {
      treatmentMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[TREATMENT\]/, "").replace(/\[\/TREATMENT\]/, "")
          const treatment = JSON.parse(jsonStr)
          treatments.push(treatment)
        } catch (e) {
          console.error("Failed to parse treatment:", e)
        }
      })
    }

    // Parse goals
    const goalMatches = content.match(/\[GOAL\](.*?)\[\/GOAL\]/g)
    if (goalMatches) {
      goalMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[GOAL\]/, "").replace(/\[\/GOAL\]/, "")
          const goal = JSON.parse(jsonStr)
          goals.push(goal)
        } catch (e) {
          console.error("Failed to parse goal:", e)
        }
      })
    }

    // Parse routine actions
    const routineActionMatches = content.match(/\[ROUTINE_ACTION\](.*?)\[\/ROUTINE_ACTION\]/g)
    if (routineActionMatches) {
      routineActionMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[ROUTINE_ACTION\]/, "").replace(/\[\/ROUTINE_ACTION\]/, "")
          const routineAction = JSON.parse(jsonStr)
          routineActions.push(routineAction)
        } catch (e) {
          console.error("Failed to parse routine action:", e)
        }
      })
    }

    // Parse cabinet actions
    const cabinetActionMatches = content.match(/\[CABINET_ACTION\](.*?)\[\/CABINET_ACTION\]/g)
    if (cabinetActionMatches) {
      cabinetActionMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[CABINET_ACTION\]/, "").replace(/\[\/CABINET_ACTION\]/, "")
          const cabinetAction = JSON.parse(jsonStr)
          cabinetActions.push(cabinetAction)
        } catch (e) {
          console.error("Failed to parse cabinet action:", e)
        }
      })
    }

    const appointmentActionMatches = content.match(/\[APPOINTMENT_ACTION\](.*?)\[\/APPOINTMENT_ACTION\]/g)
    if (appointmentActionMatches) {
      appointmentActionMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/\[APPOINTMENT_ACTION\]/, "").replace(/\[\/APPOINTMENT_ACTION\]/, "")
          const appointmentAction = JSON.parse(jsonStr)
          appointmentActions.push(appointmentAction)
        } catch (e) {
          console.error("Failed to parse appointment action:", e)
        }
      })
    }

    return { products, routines, treatments, goals, routineActions, cabinetActions, appointmentActions }
  }

  const parseCheckinActions = (content: string) => {
    const checkinRegex = /\[CHECKIN_ACTION\]\{(.*?)\}\[\/CHECKIN_ACTION\]/g
    const actions = []
    let match

    while ((match = checkinRegex.exec(content)) !== null) {
      try {
        const actionData = JSON.parse(match[1])
        actions.push(actionData)
      } catch (error) {
        console.error("Error parsing checkin action:", error)
      }
    }

    return actions
  }

  const handleCheckinAction = async (action: any) => {
    try {
      const { user } = await supabase.auth.getUser()
      if (!user.data.user) return

      const today = new Date().toISOString().split("T")[0]

      // Create or update daily check-in
      const checkinData = {
        user_id: user.data.user.id,
        date: today,
        morning_routine_completed: false,
        evening_routine_completed: false,
        skin_condition_rating: null,
        mood_rating: null,
        sleep_hours: null,
        water_intake: null,
        stress_level: null,
        notes: action.notes || null,
      }

      const { error: checkinError } = await supabase.from("daily_checkins").upsert(checkinData, {
        onConflict: "user_id,date",
      })

      if (checkinError) throw checkinError

      // Add photos to progress_photos table
      if (action.photo_urls && action.photo_urls.length > 0) {
        const photoInserts = action.photo_urls.map((photoUrl: string) => ({
          user_id: user.data.user.id,
          photo_url: photoUrl,
          photo_type: "daily",
          notes: action.notes || null,
          lighting_conditions: action.lighting || "natural",
          skin_condition_rating: null,
        }))

        const { error: photoError } = await supabase.from("progress_photos").insert(photoInserts)
        if (photoError) throw photoError

        // Trigger photo analysis
        try {
          const analysisResponse = await fetch("/api/analyze-photos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              photoUrls: action.photo_urls,
              userId: user.data.user.id,
              notes: action.notes,
              lightingConditions: action.lighting || "natural",
            }),
          })

          if (analysisResponse.ok) {
            const analysis = await analysisResponse.json()

            // Add AI analysis message to chat
            const analysisMessage: ChatMessage = {
              id: Date.now().toString(),
              role: "assistant",
              content: `I've analyzed your photos and added them to your daily check-in! Here's what I found:\n\n**Skin Analysis**: ${analysis.analysis.summary}\n\nWould you like me to suggest any routine adjustments based on this analysis?`,
              created_at: new Date().toISOString(),
            }

            setMessages((prev) => [...prev, analysisMessage])
            await saveMessage("assistant", analysisMessage.content)
          }
        } catch (analysisError) {
          console.error("Error analyzing photos:", analysisError)
        }
      }

      // Refresh data
      refreshData()

      // Show success message
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Perfect! I've added your photos to today's check-in. ${action.photo_urls?.length > 0 ? "Your photos are being analyzed for personalized insights." : ""}`,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, successMessage])
      await saveMessage("assistant", successMessage.content)
    } catch (error) {
      console.error("Error adding photos to check-in:", error)
      alert("Failed to add photos to check-in. Please try again.")
    }
  }

  const handleAppointmentAction = async (action: AppointmentAction) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Please log in to add appointments")
        return
      }

      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        treatment_type: action.treatment_type,
        date: action.date,
        time: action.time,
        provider: action.provider,
        location: action.location,
        notes: action.notes || "",
        status: "scheduled",
      })

      if (error) {
        console.error("Error adding appointment:", error)
        alert("Failed to add appointment. Please try again.")
      } else {
        alert("Appointment added successfully!")
        // Refresh data context
        window.dispatchEvent(new CustomEvent("refreshSkincareData"))
      }
    } catch (error) {
      console.error("Error adding appointment:", error)
      alert("Failed to add appointment. Please try again.")
    }
  }

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
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
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

  const createGoal = async (goal: GoalSuggestion) => {
    try {
      await addGoal({
        title: goal.title,
        description: goal.description,
        target_date: goal.target_date,
        status: "active",
      })

      // Refresh data to show the new goal in Active Goals
      await refreshData()

      console.log("[v0] Goal created successfully:", goal.title)
    } catch (error) {
      console.error("Error creating goal:", error)
    }
  }

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
        <div className="bg-white border-b border-stone-200 p-4">
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
                  ? "bg-white text-sage-700 shadow-sm"
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
                  ? "bg-white text-sage-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <SquareChartGantt className="w-4 h-4" />
              <span>Cabinet</span>
            </button>
            <button
              onClick={() => handleSwitchTab("progress")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "progress"
                  ? "bg-white text-sage-700 shadow-sm"
                  : "text-stone-600 hover:text-charcoal-900 hover:bg-stone-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Progress</span>
            </button>
            <button
              onClick={() => handleSwitchTab("calendar")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "calendar"
                  ? "bg-white text-sage-700 shadow-sm"
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
                  ? "bg-white text-sage-700 shadow-sm"
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
                  ? "bg-white text-sage-700 shadow-sm"
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

          {messages.map((message) => {
            if (message.role === "assistant") {
              const { products, routines, treatments, goals, routineActions, cabinetActions, appointmentActions } =
                parseStructuredResponse(message.content)

              return (
                <div key={message.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-sage-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-stone-200">
                      <div className="prose prose-sm max-w-none">
                        {parseCheckinActions(message.content).map((action, index) => (
                          <button
                            key={`checkin-${index}`}
                            onClick={() => handleCheckinAction(action)}
                            className="inline-flex items-center px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors text-sm font-medium"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Add to Daily Check-in
                          </button>
                        ))}

                        <div
                          className="text-sm text-charcoal-800 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(
                              message.content
                                .replace(/\[PRODUCT\]\{.*?\}\[\/PRODUCT\]/g, "")
                                .replace(/\[ROUTINE\]\{.*?\}\[\/ROUTINE\]/g, "")
                                .replace(/\[TREATMENT\]\{.*?\}\[\/TREATMENT\]/g, "")
                                .replace(/\[GOAL\]\{.*?\}\[\/GOAL\]/g, "")
                                .replace(/\[ROUTINE_ACTION\]\{.*?\}\[\/ROUTINE_ACTION\]/g, "")
                                .replace(/\[CABINET_ACTION\]\{.*?\}\[\/CABINET_ACTION\]/g, "")
                                .replace(/\[APPOINTMENT_ACTION\]\{.*?\}\[\/APPOINTMENT_ACTION\]/g, "")
                                .replace(/\[CHECKIN_ACTION\]\{.*?\}\[\/CHECKIN_ACTION\]/g, "")
                                .replace(/\[PRODUCT\]([^[]+)\[\/PRODUCT\]/g, "$1"),
                            ),
                          }}
                        />
                      </div>
                    </div>

                    {products.length > 0 && (
                      <div className="space-y-2">
                        {products.map((product, index) => (
                          <div key={index} className="bg-sage-50 rounded-lg p-3 border border-sage-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-charcoal-900">{product.name}</h4>
                                <p className="text-sm text-charcoal-600 mb-1">by {product.brand}</p>
                                <p className="text-xs text-charcoal-500 mb-2">{product.description}</p>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {product.key_ingredients.map((ingredient, i) => (
                                    <span key={i} className="text-xs bg-white px-2 py-1 rounded-full text-charcoal-600">
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-sage-700 italic">{product.reason}</p>
                              </div>
                              <button
                                onClick={() => addProductToInventory(product)}
                                disabled={isLoading}
                                className="ml-3 px-3 py-1 bg-sage-600 hover:bg-sage-700 text-white text-xs rounded-md transition-colors disabled:opacity-50"
                              >
                                Add to Collection
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {routines.length > 0 && (
                      <div className="space-y-2">
                        {routines.map((routine, index) => (
                          <button
                            key={index}
                            onClick={() => acceptRoutineUpdate(routine)}
                            className="w-full bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept Changes</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {treatments.length > 0 && (
                      <div className="space-y-2">
                        {treatments.map((treatment, index) => (
                          <button
                            key={index}
                            onClick={() => console.log("Treatment suggestion clicked:", treatment)}
                            className="w-full bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>{treatment.type}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {goals.length > 0 && (
                      <div className="space-y-2">
                        {goals.map((goal, index) => (
                          <button
                            key={index}
                            onClick={() => createGoal(goal)}
                            className="w-full bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>Create Goal</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {routineActions.length > 0 && (
                      <div className="space-y-2">
                        {routineActions.map((action, index) => {
                          const today = new Date().toISOString().split("T")[0]
                          const todayCheckin = checkIns?.find((c) => c.date === today)
                          const isCompleted =
                            action.type === "morning"
                              ? todayCheckin?.morning_routine_completed
                              : todayCheckin?.evening_routine_completed

                          return (
                            <button
                              key={index}
                              onClick={() => handleRoutineCompleteAction(action)}
                              disabled={isCompleted}
                              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                                isCompleted
                                  ? "bg-green-100 text-green-800 cursor-not-allowed"
                                  : "bg-sage-600 hover:bg-sage-700 text-white"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{isCompleted ? "Completed" : `Mark ${action.type} routine complete`}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {cabinetActions.length > 0 && (
                      <div className="space-y-2">
                        {cabinetActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleCabinetAction(action)}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                              action.action === "remove"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                          >
                            {action.action === "remove" ? (
                              <>
                                <Minus className="w-4 h-4" />
                                <span>Remove from Cabinet</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Add to Cabinet</span>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {appointmentActions.length > 0 && (
                      <div className="space-y-2">
                        {appointmentActions.map((action, index) => (
                          <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-charcoal-900">{action.treatment_type}</h4>
                                <p className="text-sm text-charcoal-600">
                                  {new Date(action.date).toLocaleDateString()} at {action.time}
                                </p>
                                <p className="text-sm text-charcoal-600">{action.provider}</p>
                                <p className="text-xs text-charcoal-500">{action.location}</p>
                                {action.notes && <p className="text-xs text-charcoal-500 mt-1">{action.notes}</p>}
                              </div>
                              <button
                                onClick={() => handleAppointmentAction(action)}
                                disabled={isLoading}
                                className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Add Appointment</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-3xl p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-sage-600 text-white"
                      : "bg-stone-100 text-charcoal-900 border border-stone-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content
                      .replace(/\[PRODUCT\]([^{].*?)\[\/PRODUCT\]/g, "$1")
                      .replace(/\[PRODUCT\]\{.*?\}\[\/PRODUCT\]/g, "")
                      .replace(/\[ROUTINE\].*?\[\/ROUTINE\]/g, "")
                      .replace(/\[TREATMENT\].*?\[\/TREATMENT\]/g, "")
                      .replace(/\[GOAL\].*?\[\/GOAL\]/g, "")
                      .replace(/\[ROUTINE_ACTION\].*?\[\/ROUTINE_ACTION\]/g, "")
                      .replace(/\[CABINET_ACTION\].*?\[\/CABINET_ACTION\]/g, "")
                      .trim()}
                  </p>
                </div>
              </div>
            )
          })}

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

        <div className="bg-white border-t border-stone-200 p-4">
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="text-sm text-stone-600 mb-2">Quick commands:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((command, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickCommand(command)}
                    className="px-3 py-1 text-sm bg-stone-100 text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
                  >
                    {command}
                  </button>
                ))}
              </div>
            </div>
          )}

          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                className="max-w-32 max-h-32 rounded-lg border border-stone-200"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me about your skincare routine, products, or concerns..."
                className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-sage-600 transition-colors"
                disabled={isLoading}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="px-6 py-3 bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
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
              <RoutineManagerTab onExpand={() => handleExpandTab("routines")} isFullScreen={isFullScreen} />
            )}
            {activeTab === "collection" && (
              <InventoryManagerTab onExpand={() => handleExpandTab("collection")} isFullScreen={isFullScreen} />
            )}
            {activeTab === "progress" && (
              <ProgressDashboardTab
                onExpand={() => handleExpandTab("progress")}
                isFullScreen={isFullScreen}
                onSendMessage={(message) => {
                  setInput(message)
                  handleSubmit(new Event("submit") as any)
                }}
              />
            )}
            {activeTab === "calendar" && (
              <SkincareCalendar onExpand={() => handleExpandTab("calendar")} isFullScreen={isFullScreen} />
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
