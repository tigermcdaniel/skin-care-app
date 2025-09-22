"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/integrations/supabase/client"

export default function NewChatSessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const createNewSession = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError && userError.message === "Supabase not configured") {
          console.log("[v0] Supabase not configured, proceeding without auth")
          // Generate a session ID and proceed without authentication
          const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const prompt = searchParams.get("prompt")

          if (prompt) {
            router.push(`/chat/${sessionId}?prompt=${encodeURIComponent(prompt)}`)
          } else {
            router.push(`/chat/${sessionId}`)
          }
          return
        }

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Generate a new session ID
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Get the initial prompt if provided
        const prompt = searchParams.get("prompt")

        // Redirect to the new chat session with optional prompt
        if (prompt) {
          router.push(`/chat/${sessionId}?prompt=${encodeURIComponent(prompt)}`)
        } else {
          router.push(`/chat/${sessionId}`)
        }
      } catch (error) {
        console.error("Error creating new chat session:", error)
        router.push("/chat/default-session")
      }
    }

    createNewSession()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Starting your skincare consultation...</p>
      </div>
    </div>
  )
}
