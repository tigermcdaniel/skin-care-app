/**
 * Chat Hook
 * 
 * Custom hook for managing chat state and functionality.
 */

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ChatMessage, TabType } from "../types/chat"

/**
 * Custom hook for managing chat functionality
 * @returns Chat state and handlers
 */
export function useChat() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>(null)
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatId = params.id as string

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history on mount
  useEffect(() => {
    if (chatId && chatId !== "new") {
      loadChatHistory(chatId)
    } else if (initialPrompt) {
      setInput(initialPrompt)
    }
  }, [chatId, initialPrompt])

  const loadChatHistory = async (id: string) => {
    // Implementation for loading chat history
    // This would typically fetch from your API
  }

  const handleSendMessage = async (message: string, files?: File[]) => {
    // Implementation for sending messages
    // This would typically call your chat API
  }

  const handleFileUpload = (files: File[]) => {
    // Implementation for file upload
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(Math.max(200, Math.min(800, newWidth)))
  }

  return {
    messages,
    input,
    setInput,
    isLoading,
    activeTab,
    sidebarWidth,
    isResizing,
    uploadedFiles,
    uploadProgress,
    isUploading,
    messagesEndRef,
    chatId,
    handleSendMessage,
    handleFileUpload,
    handleTabChange,
    handleSidebarResize,
    setIsResizing,
    setUploadedFiles,
    setUploadProgress,
    setIsUploading,
  }
}
