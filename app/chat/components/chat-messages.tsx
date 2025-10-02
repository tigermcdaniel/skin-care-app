/**
 * Chat Messages Component
 * 
 * Displays chat messages with streaming support.
 */

"use client"

import { useEffect, useRef } from "react"
import { ChatMessageComponent } from "./chat-message"
import { ChatMessage } from "../types/chat"

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, messagesEndRef])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessageComponent key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 text-charcoal-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>AI is thinking...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
