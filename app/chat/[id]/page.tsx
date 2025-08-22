"use client"

import type React from "react"
import { GlobalNavigation } from "@/components/global-navigation"
import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User, Plus, Calendar } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface ProductRecommendation {
  name: string
  brand: string
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

const QUICK_COMMANDS = [
  "What's the best routine for my skin type?",
  "I'm having breakouts, what should I do?",
  "Can you recommend products for anti-aging?",
  "How can I improve my skin texture?",
  "What ingredients should I avoid?",
  "Help me build a morning routine",
]

export default function ChatConversationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get("prompt")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    await saveMessage("user", input)

    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
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
  }

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt)
      setTimeout(async () => {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          content: initialPrompt,
          created_at: new Date().toISOString(),
        }
        setMessages([userMessage])
        saveMessage("user", initialPrompt)
        setInput("")
        setIsLoading(true)

        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: initialPrompt }],
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
          console.error("Error with initial prompt:", error)
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
      }, 100)
    }
  }, [params.id, initialPrompt])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("chat_history").insert({
        user_id: user.id,
        message: content,
        response: role === "assistant" ? content : "",
        message_type: role,
      })
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const addProductToInventory = async (product: ProductRecommendation) => {
    try {
      console.log("[v0] Adding product to inventory:", product)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Please log in to add products to your inventory")
        return
      }

      const { data: productData, error: searchError } = await supabase
        .from("products")
        .select("id, name, brand")
        .or(`name.ilike.%${product.name}%,brand.ilike.%${product.brand}%`)
        .limit(1)
        .single()

      console.log("[v0] Product search result:", productData, searchError)

      if (!productData) {
        console.log("[v0] Product not found in database")
        alert(
          `"${product.name}" is not available in our product database. Please add it manually from the Product Sanctuary or contact support to have it added.`,
        )
        return
      }

      const { data: existingInventory } = await supabase
        .from("user_inventory")
        .select("id, amount_remaining")
        .eq("user_id", user.id)
        .eq("product_id", productData.id)
        .single()

      if (existingInventory) {
        const { error: updateError } = await supabase
          .from("user_inventory")
          .update({ amount_remaining: Math.min(100, existingInventory.amount_remaining + 20) })
          .eq("id", existingInventory.id)

        if (updateError) {
          console.error("[v0] Error updating inventory:", updateError)
          alert("Failed to update inventory. Please try again.")
          return
        }

        alert(`Updated ${product.name} in your inventory!`)
      } else {
        const { error: insertError } = await supabase.from("user_inventory").insert({
          user_id: user.id,
          product_id: productData.id,
          amount_remaining: 100,
          purchase_date: new Date().toISOString().split("T")[0],
          notes: `Added from AI recommendation: ${product.reason}`,
        })

        if (insertError) {
          console.error("[v0] Error adding to inventory:", insertError)
          alert("Failed to add product to inventory. Please try again.")
          return
        }

        alert(`${product.name} added to your inventory!`)
      }

      console.log("[v0] Successfully added product to inventory")
    } catch (error) {
      console.error("[v0] Error adding product:", error)
      alert("An unexpected error occurred. Please try again.")
    }
  }

  const scheduleAppointment = async (treatment: TreatmentSuggestion) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("appointments").insert({
        user_id: user.id,
        treatment_type: treatment.type,
        status: "suggested",
        notes: treatment.reason,
      })

      alert("Treatment suggestion added to your appointments!")
    } catch (error) {
      console.error("Error scheduling appointment:", error)
    }
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
      alert("An unexpected error occurred while updating your routine. Please try again.")
    }
  }

  const rejectRoutineUpdate = (routine: RoutineUpdate) => {
    alert(`${routine.type.charAt(0).toUpperCase() + routine.type.slice(1)} routine update declined.`)
  }

  const parseAIResponse = (content: string) => {
    const productRegex = /\[PRODUCT\](.*?)\[\/PRODUCT\]/g
    const routineRegex = /\[ROUTINE\](.*?)\[\/ROUTINE\]/g
    const treatmentRegex = /\[TREATMENT\](.*?)\[\/TREATMENT\]/g

    const products: ProductRecommendation[] = []
    const routines: RoutineUpdate[] = []
    const treatments: TreatmentSuggestion[] = []

    let match
    while ((match = productRegex.exec(content)) !== null) {
      try {
        products.push(JSON.parse(match[1]))
      } catch (e) {}
    }

    while ((match = routineRegex.exec(content)) !== null) {
      try {
        routines.push(JSON.parse(match[1]))
      } catch (e) {}
    }

    while ((match = treatmentRegex.exec(content)) !== null) {
      try {
        treatments.push(JSON.parse(match[1]))
      } catch (e) {}
    }

    return { products, routines, treatments }
  }

  return (
    <>
      <GlobalNavigation />
      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="font-serif text-3xl text-charcoal-900 mb-2">Skincare Consultation</h1>
            <p className="text-charcoal-600">Your personal advisor is here to help</p>
          </div>

          <Card className="h-[600px] flex flex-col border-stone-200 bg-white shadow-sm">
            <CardContent className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.length === 0 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-sage-600 mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-charcoal-900 mb-2">Welcome to Your Consultation</h3>
                    <p className="text-charcoal-600 mb-6">Choose a quick command or ask your own question</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {QUICK_COMMANDS.map((command, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 text-left justify-start border-stone-200 hover:border-sage-300 hover:bg-sage-50 bg-transparent"
                        onClick={() => handleQuickCommand(command)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-sage-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-charcoal-700 leading-relaxed">{command}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const { products, routines, treatments } = parseAIResponse(message.content)

                return (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          message.role === "user" ? "bg-sage-600 ml-4" : "bg-stone-200 mr-4"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-charcoal-600" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-6 ${
                          message.role === "user"
                            ? "bg-sage-600 text-white"
                            : "bg-stone-100 text-charcoal-900 border border-stone-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content
                            .replace(/\[PRODUCT\].*?\[\/PRODUCT\]/g, "")
                            .replace(/\[ROUTINE\].*?\[\/ROUTINE\]/g, "")
                            .replace(/\[TREATMENT\].*?\[\/TREATMENT\]/g, "")}
                        </p>

                        {products.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold">Recommended Products:</h4>
                            {products.map((product, index) => (
                              <div key={index} className="bg-white/10 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">
                                      {product.name} by {product.brand}
                                    </p>
                                    <p className="text-sm opacity-90">{product.reason}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addProductToInventory(product)}
                                    className="ml-2"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {routines.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold">Routine Updates:</h4>
                            {routines.map((routine, index) => (
                              <div key={index} className="bg-white/10 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium capitalize">{routine.type} Routine Update</p>
                                    <div className="text-sm opacity-90 mt-1">
                                      <p className="mb-1">Proposed changes:</p>
                                      <ul className="list-disc list-inside space-y-1">
                                        {routine.changes.map((change, changeIndex) => (
                                          <li key={changeIndex}>{change}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2 ml-2">
                                    <Button
                                      size="sm"
                                      onClick={() => acceptRoutineUpdate(routine)}
                                      className="bg-sage-600 hover:bg-sage-700 text-white"
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => rejectRoutineUpdate(routine)}
                                      className="border-stone-300 hover:bg-stone-100"
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {treatments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold">Treatment Suggestions:</h4>
                            {treatments.map((treatment, index) => (
                              <div key={index} className="bg-white/10 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{treatment.type}</p>
                                    <p className="text-sm opacity-90">{treatment.reason}</p>
                                    <p className="text-xs opacity-75">Frequency: {treatment.frequency}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => scheduleAppointment(treatment)}
                                    className="ml-2"
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Schedule
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-200 mr-4 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-charcoal-600" />
                    </div>
                    <div className="bg-stone-100 rounded-lg p-6 border border-stone-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t border-stone-200 p-6">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Share your skincare concerns or questions..."
                  disabled={isLoading}
                  className="flex-1 border-stone-300 focus:border-sage-500 focus:ring-sage-500"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-sage-600 hover:bg-sage-700 text-white px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
