/**
 * Chat Conversation Page
 * 
 * Main chat interface for AI-powered skincare conversations.
 * Features include:
 * - Real-time streaming chat with AI advisor
 * - Image upload and analysis capabilities
 * - Tabbed interface for routines, inventory, calendar, treatments, and check-ins
 * - Resizable sidebar panels
 * - Action handlers for routine completion, product management, and goal setting
 * - Context-aware AI responses based on user's skincare data
 */

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/integrations/supabase/client"
import { useSkincareData, SkincareDataProvider } from "@/app/features/shared/contexts/skincare-data-context"
import { ChatActionHandlers } from "../lib/chat-action-handlers"
import { ChatMessage, TabType, QUICK_COMMANDS } from "../types/chat"
import { WeeklyRoutineTab } from "@/app/features/routines/components/weekly-routine-tab"
import { InventoryManagerTab } from "@/app/features/inventory/components/inventory-manager-tab"
import { SkincareCalendar } from "@/app/features/calendar/pages/skincare-calendar"
import { TreatmentsTab } from "@/app/features/treatments/components/treatments-tab"
import { CheckInTab } from "@/app/features/check-in/components/check-in-tab"
import { ChatMessageComponent } from "../components/chat-message"
import { ChatInput } from "../components/chat-input"
import { BookOpen, SquareChevronLeft as SquareChartGantt, Calendar, Stethoscope, ClipboardCheck, LogOut, Menu, X } from "lucide-react"

/**
 * ChatConversationPageContent Component
 * 
 * Main content component for the AI-powered skincare chat interface, providing a comprehensive
 * platform for users to interact with their AI skincare advisor. This component manages
 * real-time conversations, image analysis, and integrates with all major skincare features
 * including routines, inventory, calendar, treatments, and progress tracking.
 * 
 * Core Functionality:
 * - Real-time streaming chat with AI skincare advisor
 * - Image upload and AI-powered skin analysis
 * - Tabbed interface for routines, inventory, calendar, treatments, and check-ins
 * - Resizable sidebar panels for optimal user experience
 * - Action handlers for routine completion, product management, and goal setting
 * - Context-aware AI responses based on user's complete skincare profile
 * 
 * State Management:
 * - Message state management with streaming support
 * - Image upload and processing with progress tracking
 * - Tab navigation and panel resizing
 * - Real-time data synchronization with Supabase
 * - Action handling for various skincare operations
 * 
 * User Experience:
 * - Intuitive chat interface with message history
 * - Drag-and-drop image upload for skin analysis
 * - Organized tabbed interface for different features
 * - Responsive design for mobile and desktop
 * - Quick action buttons for common tasks
 * 
 * @returns {JSX.Element} The main chat interface component with full skincare functionality
 */
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [tabPanelWidth, setTabPanelWidth] = useState(384) // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0) // Force re-render during resize
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

  const handleAddProduct = async (product: any, index: number = 0) => {
    try {
      setIsLoading(true)
      await addToInventory(
        product.id || "placeholder",
        `Recommended Product: ${product.name} by ${product.brand}\nCategory: ${product.category}\nDescription: ${product.description}\nKey Ingredients: ${product.key_ingredients?.join(", ") || ""}\nBenefits: ${product.benefits?.join(", ") || ""}`,
      )
      
      // Update the message content to mark the product as added
      let updatedMessageId: string | null = null
      let updatedContent: string | null = null
      
      console.log(`🔄 Starting message update for product: ${product.name} by ${product.brand}`)
      console.log(`📊 Total messages: ${messages.length}`)
      
      setMessages((prev) => {
        console.log(`🔄 Updating messages for product: ${product.name}`)
        let foundMessage = false
        
        const updatedMessages = prev.map((message) => {
          console.log(`🔍 Checking message ${message.id}: role=${message.role}, hasProducts=${message.content.includes(`[PRODUCT]{`)}`)
          
          if (message.role === "assistant" && message.content.includes(`[PRODUCT]{`)) {
            foundMessage = true
            console.log(`📝 Found assistant message with products: ${message.id}`)
            console.log(`🔍 Original content length: ${message.content.length}`)
            console.log(`🔍 Original content preview:`, message.content.substring(0, 300) + '...')
            
            // Find and update the specific product in the message content
            const productKey = `${product.name}-${product.brand}-${index}`
            console.log(`🎯 Looking for product: ${productKey}`)
            
            // Create the regex pattern
            const escapedName = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const escapedBrand = product.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regexPattern = `\\[PRODUCT\\]\\{[^}]*"name":"${escapedName}"[^}]*"brand":"${escapedBrand}"[^}]*\\}\\[\\/PRODUCT\\]`
            
            console.log(`🔍 Regex pattern: ${regexPattern}`)
            
            const regex = new RegExp(regexPattern)
            const match = message.content.match(regex)
            console.log(`🎯 Regex match found:`, !!match)
            if (match) {
              console.log(`🎯 Matched content:`, match[0])
            }
            
            const newContent = message.content.replace(
              regex,
              `[PRODUCT]{${JSON.stringify({...product, added: true})}[/PRODUCT]`
            )
            
            console.log(`✅ Updated content length: ${newContent.length}`)
            console.log(`✅ Updated content preview:`, newContent.substring(0, 300) + '...')
            console.log(`🔄 Content changed:`, newContent !== message.content)
            
            // Store the message ID and content for database update
            updatedMessageId = message.id
            updatedContent = newContent
            
            return { ...message, content: newContent }
          }
          return message
        })
        
        console.log(`📊 Found message with products: ${foundMessage}`)
        return updatedMessages
      })
      
      // Update the message in the database
      console.log(`💾 Database update check: updatedMessageId=${updatedMessageId}, updatedContent=${!!updatedContent}`)
      
      if (updatedMessageId && updatedContent) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            console.log(`💾 Updating database for message ${updatedMessageId}`)
            console.log(`💾 New content length: ${updatedContent.length}`)
            
            const { error } = await supabase
              .from("chat_history")
              .update({ content: updatedContent })
              .eq("id", updatedMessageId)
              
            if (error) {
              console.error(`❌ Database update error:`, error)
            } else {
              console.log(`✅ Successfully updated message in database: ${updatedMessageId}`)
            }
          } else {
            console.log(`❌ No user found for database update`)
          }
        } catch (error) {
          console.error("❌ Error updating message in database:", error)
        }
      } else {
        console.log(`❌ Cannot update database: missing messageId or content`)
      }
      
      // Refresh inventory data to update button state
      await refreshData()
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
          // Update the message content to mark the product as added
          let updatedMessageId: string | null = null
          let updatedContent: string | null = null
          
          setMessages((prev) => {
            return prev.map((message) => {
              if (message.role === "assistant" && message.content.includes(`[CABINET_ACTION]`)) {
                // Find and update the specific product in the message content
                const escapedName = action.product_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const escapedBrand = action.product_brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const regexPattern = `\\[CABINET_ACTION\\]\\{[^}]*"product_name":"${escapedName}"[^}]*"product_brand":"${escapedBrand}"[^}]*\\}`
                
                const regex = new RegExp(regexPattern)
                const newContent = message.content.replace(
                  regex,
                  `[CABINET_ACTION]{${JSON.stringify({...action, added: true})}`
                )
                
                // Store the message ID and content for database update
                updatedMessageId = message.id
                updatedContent = newContent
                
                return { ...message, content: newContent }
              }
              return message
            })
          })
          
          // Update the message in the database
          if (updatedMessageId && updatedContent) {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await supabase
                  .from("chat_history")
                  .update({ content: updatedContent })
                  .eq("id", updatedMessageId)
              }
            } catch (error) {
              console.error("Error updating message in database:", error)
            }
          }
          
          await refreshData()
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
        session_id: params.id as string,
        role: role,
        content: content,
        message_type: 'general'
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
          role: msg.role as "user" | "assistant",
          content: msg.content || "",
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


  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false) // Close mobile menu when tab is selected
  }


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
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

    // Constrain width between 250px and 80% of screen width for better flexibility
    const minWidth = 250
    const maxWidth = containerWidth * 0.8
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

    console.log('Resizing sidebar to:', constrainedWidth, 'px')
    setTabPanelWidth(constrainedWidth)
    setForceUpdate(prev => prev + 1) // Force re-render
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

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setForceUpdate(prev => prev + 1)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 flex overflow-hidden pt-20">

      <div
        className={`flex flex-col ${activeTab ? 'flex-shrink-0' : 'flex-1'} ${isResizing ? '' : 'transition-all duration-300'}`}
        style={{
          width: activeTab ? `calc(100vw - ${tabPanelWidth}px - 2rem)` : "100%",
          minWidth: activeTab ? "280px" : "0px",
          maxWidth: activeTab ? `calc(100vw - ${tabPanelWidth}px - 2rem)` : "100%",
        }}
      >
        <div 
          className={`fixed top-0 z-30 p-1 sm:p-2 md:p-4 lg:p-6 ${isResizing ? '' : 'transition-all duration-300'}`}
          style={{
            left: "0",
            right: activeTab ? `${tabPanelWidth}px` : "0",
            width: activeTab ? `calc(100vw - ${tabPanelWidth}px)` : "100%",
          }}
        >
          <div className="w-full max-w-7xl mx-auto">
            {/* Header - Mobile and Desktop */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 shadow-lg border border-gray-200">
              {/* Mobile Layout */}
              <div className="md:hidden">
                {/* Top Row - Title, Mobile Menu Button, and Logout */}
                <div className="flex items-center justify-between min-w-0">
                  <h1 className="text-sm font-serif text-charcoal-900 truncate">Skincare Advisor</h1>
                  
                  <div className="flex items-center space-x-2">
                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="flex items-center justify-center w-8 h-8 text-stone-600 hover:text-charcoal-900 transition-colors"
                      title="Menu"
                    >
                      {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-0.5 px-1 py-1 text-xs text-stone-600 hover:text-red-600 transition-colors flex-shrink-0"
                      title="Logout"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Single Row */}
              <div className="hidden md:flex items-center justify-between min-w-0">
                {/* Left - Title */}
                <h1 className="text-lg lg:text-xl font-serif text-charcoal-900 truncate">Skincare Advisor</h1>
                
                {/* Center - Tab Navigation */}
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide min-w-0 flex-1 justify-center mx-4">
                  <button
                    onClick={() => handleSwitchTab("routines")}
                    className={`flex items-center space-x-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === "routines"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Routines</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab("collection")}
                    className={`flex items-center space-x-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === "collection"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                    }`}
                  >
                    <SquareChartGantt className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Cabinet</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab("calendar")}
                    className={`flex items-center space-x-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === "calendar"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Calendar</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab("treatments")}
                    className={`flex items-center space-x-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === "treatments"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Treatments</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab("checkin")}
                    className={`flex items-center space-x-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === "checkin"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Check-in</span>
                  </button>
                </div>
                
                {/* Right - Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-2 py-1.5 text-sm text-stone-600 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
              
              {/* Mobile Menu Dropdown */}
              {isMobileMenuOpen && (
                <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      onClick={() => handleSwitchTab("routines")}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "routines"
                          ? "bg-gray-100 text-black shadow-sm"
                          : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Routines</span>
                    </button>
                    <button
                      onClick={() => handleSwitchTab("collection")}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "collection"
                          ? "bg-gray-100 text-black shadow-sm"
                          : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                      }`}
                    >
                      <SquareChartGantt className="w-4 h-4" />
                      <span>Cabinet</span>
                    </button>
                    <button
                      onClick={() => handleSwitchTab("calendar")}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "calendar"
                          ? "bg-gray-100 text-black shadow-sm"
                          : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Calendar</span>
                    </button>
                    <button
                      onClick={() => handleSwitchTab("treatments")}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "treatments"
                          ? "bg-gray-100 text-black shadow-sm"
                          : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                      }`}
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Treatments</span>
                    </button>
                    <button
                      onClick={() => handleSwitchTab("checkin")}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "checkin"
                          ? "bg-gray-100 text-black shadow-sm"
                          : "text-stone-600 hover:text-charcoal-900 hover:bg-gray-50"
                      }`}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Check-in</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gradient fade overlay - covers above and below menu bar */}
        <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-stone-50 via-stone-50/80 to-transparent pointer-events-none z-20"></div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 min-w-0 pt-20 relative">
          {messages.length === 0 && showActionTriggers && (
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              <div className="text-center px-2 sm:px-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-serif text-charcoal-900 mb-2 sm:mb-3 md:mb-4">How can I help you today?</h2>
                <p className="text-xs sm:text-sm md:text-base text-stone-600 mb-4 sm:mb-6 md:mb-8">Ask me anything about skincare, routines, or products.</p>
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
              inventory={inventory}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-stone-100 text-charcoal-900 border border-stone-200 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sage-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sage-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sage-600 rounded-full animate-bounce"
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

      {/* Desktop Resize Handle */}
      {activeTab && (
        <div
          ref={resizeRef}
          className="hidden md:block fixed top-0 w-1 h-full bg-stone-300 hover:bg-sage-400 cursor-col-resize z-40 transition-colors"
          style={{ right: `${tabPanelWidth}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-stone-400 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Mobile Overlay */}
      {activeTab && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setActiveTab(null)}
        />
      )}

      {/* Sidebar Panel */}
      {activeTab && (
        <div
          className="fixed right-0 top-0 h-full bg-white border-l border-stone-200 shadow-lg z-50 md:border-l-0 md:shadow-none"
          style={{
            width: `${tabPanelWidth}px`,
            minWidth: "250px",
            maxWidth: "80vw",
          }}
        >
          {/* Mobile Header */}
          <div className="md:hidden p-4 border-b border-stone-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-charcoal-900 capitalize">{activeTab}</h2>
              <button
                onClick={() => setActiveTab(null)}
                className="text-stone-500 hover:text-charcoal-900 transition-colors p-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block p-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-charcoal-900 capitalize">{activeTab}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab(null)}
                  className="text-stone-500 hover:text-charcoal-900 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div className="h-full overflow-y-auto p-4">
            {activeTab === "routines" && (
              <WeeklyRoutineTab />
            )}
            {activeTab === "collection" && (
              <InventoryManagerTab />
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
              />
            )}
            {activeTab === "treatments" && (
              <TreatmentsTab />
            )}
            {activeTab === "checkin" && (
              <CheckInTab />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ChatConversationPage Component
 * 
 * Root component that wraps the chat interface with the SkincareDataProvider.
 * This ensures all child components have access to the centralized skincare data context.
 * 
 * @returns {JSX.Element} JSX element with provider and content components
 */
export default function ChatConversationPage() {
  return (
    <SkincareDataProvider>
      <ChatConversationPageContent />
    </SkincareDataProvider>
  )
}
