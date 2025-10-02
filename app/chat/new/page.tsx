"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { generateUUID } from "@/lib/uuid"

export default function NewChatPage() {
  const router = useRouter()

  useEffect(() => {
    // Generate ID only on client side to avoid hydration mismatch
    const chatId = generateUUID()
    router.replace(`/chat/${chatId}`)
  }, [router])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto mb-4"></div>
        <p className="text-charcoal-600">Starting your consultation...</p>
      </div>
    </div>
  )
}
