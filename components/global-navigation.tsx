/**
 * GlobalNavigation Component
 * 
 * Main navigation component for the AI-powered skincare consultant application.
 * Features:
 * - Primary navigation links to all major sections
 * - Quick action buttons for common tasks
 * - User authentication and logout functionality
 * - Responsive design for mobile and desktop
 * - Active state management for current page
 */

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, Calendar, BarChart3, Package, User, CalendarDays, LogOut, Plus } from "lucide-react"
import { createClient } from "@/integrations/supabase/client"

const navigation = [
  {
    name: "Advisor",
    href: "/chat/new-session",
    icon: MessageCircle,
    description: "Your AI skincare advisor",
  },
  {
    name: "Rituals",
    href: "/chat/new-session?prompt=Show me my current routines",
    icon: Calendar,
    description: "View and manage your skincare routines",
  },
  {
    name: "Collection",
    href: "/chat/new-session?prompt=What products do I have in my collection?",
    icon: Package,
    description: "Browse your product inventory",
  },
  {
    name: "Progress",
    href: "/chat/new-session?prompt=How is my skincare progress?",
    icon: BarChart3,
    description: "Track your skincare journey",
  },
  {
    name: "Calendar",
    href: "/chat/new-session?prompt=Show me my skincare schedule",
    icon: CalendarDays,
    description: "View your routine calendar",
  },
]

const quickActions = [
  {
    name: "New Routine",
    prompt: "Help me create a new skincare routine",
    icon: Plus,
  },
  {
    name: "Product Help",
    prompt: "I need help choosing skincare products",
    icon: Package,
  },
  {
    name: "Skin Issues",
    prompt: "I'm having skin issues and need advice",
    icon: User,
  },
]

/**
 * GlobalNavigation Component
 * 
 * Main navigation component for the AI-powered skincare consultant application, providing comprehensive
 * navigation access to all major features and sections. This component serves as the primary
 * navigation hub, offering intuitive access to chat, routines, inventory, progress tracking,
 * and user management features with a clean, responsive design.
 * 
 * Navigation Features:
 * - Primary navigation links to all major sections (Chat, Routines, Inventory, Progress, etc.)
 * - Quick action buttons for common tasks (New Chat, Add Product, etc.)
 * - User authentication and logout functionality
 * - Responsive design optimized for mobile and desktop
 * - Active state management for current page highlighting
 * 
 * User Experience:
 * - Clean, organized navigation structure
 * - Intuitive iconography for easy recognition
 * - Quick access to frequently used features
 * - Seamless logout functionality with proper session management
 * - Mobile-friendly responsive design
 * 
 * Brand Integration:
 * - Consistent branding with logo and title
 * - Professional color scheme and typography
 * - Clear visual hierarchy for navigation elements
 * - Accessible design following web standards
 * 
 * @returns {JSX.Element} JSX element containing the complete navigation bar with all features
 */
export function GlobalNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const isActive = (href: string) => {
    if (href === "/chat/new-session") {
      return pathname.startsWith("/chat/")
    }
    return pathname === href
  }

  const handleQuickAction = (prompt: string) => {
    router.push(`/chat/new-session?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/chat/new-session"
            className="font-serif text-xl text-black hover:text-gray-800 transition-colors"
          >
            AI Skincare
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link key={item.name} href={item.href} title={item.description}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-gray-600 hover:text-black hover:bg-gray-100 transition-colors ${
                      active ? "text-black bg-gray-100" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}

            <div className="h-4 w-px bg-stone-300 mx-2" />

            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.name}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="gap-2 text-stone-600 hover:text-black hover:bg-gray-100 transition-colors"
                  title={`Ask: ${action.prompt}`}
                >
                  <Icon className="h-4 w-4" />
                  {action.name}
                </Button>
              )
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-stone-600 hover:text-red-600 hover:bg-red-50 ml-4 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="lg:hidden flex items-center space-x-2">
            <Link href="/chat/new-session">
              <Button variant="ghost" size="sm" className="text-black hover:text-gray-800 hover:bg-gray-100">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-stone-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
