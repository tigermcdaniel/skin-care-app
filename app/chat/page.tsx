"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { MessageCircle, Plus, Clock } from "lucide-react"
import Link from "next/link"
import { GlobalNavigation } from "@/components/global-navigation"

interface ChatConversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const groupedConversations: ChatConversation[] = []
      const messagesByDate: { [key: string]: any[] } = {}

      data?.forEach((message: any) => {
        const date = new Date(message.created_at).toDateString()
        if (!messagesByDate[date]) {
          messagesByDate[date] = []
        }
        messagesByDate[date].push(message)
      })

      Object.entries(messagesByDate).forEach(([date, messages]) => {
        const firstMessage = messages[0]
        const lastMessage = messages[messages.length - 1]
        groupedConversations.push({
          id: `conversation-${date}`,
          title: `Chat from ${new Date(date).toLocaleDateString()}`,
          created_at: firstMessage.created_at,
          updated_at: lastMessage.created_at,
        })
      })

      setConversations(groupedConversations)
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <GlobalNavigation />

      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="font-serif text-4xl text-stone-800 mb-4">Skincare Advisor</h1>
              <p className="text-stone-600 text-lg leading-relaxed max-w-2xl">
                Engage in thoughtful dialogue about your skincare journey. Receive personalized guidance crafted for
                your unique needs.
              </p>
            </div>
            <Link href="/chat/new">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3">
                <Plus className="w-4 h-4 mr-2" />
                Begin Conversation
              </Button>
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 text-center py-16">
              <div className="max-w-md mx-auto">
                <MessageCircle className="w-16 h-16 mx-auto text-sage-400 mb-6" />
                <h3 className="font-serif text-2xl text-stone-800 mb-4">Begin Your Journey</h3>
                <p className="text-stone-600 mb-8 leading-relaxed">
                  Start a meaningful conversation with our skincare advisor. Discover personalized recommendations and
                  expert guidance.
                </p>
                <Link href="/chat/new">
                  <Button className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Conversation
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                  <div className="bg-white rounded-lg shadow-sm border border-stone-200 hover:shadow-md transition-shadow cursor-pointer p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg text-stone-800">{conversation.title}</h3>
                      <div className="flex items-center text-sm text-stone-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
