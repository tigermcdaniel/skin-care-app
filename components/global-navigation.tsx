"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Calendar, BarChart3, MessageCircle, Package, User, CalendarDays } from "lucide-react"

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Rituals", href: "/routines", icon: Calendar },
  { name: "Progress", href: "/progress", icon: BarChart3 },
  { name: "Advisor", href: "/chat/new-session", icon: MessageCircle },
  { name: "Collection", href: "/inventory", icon: Package },
  { name: "Treatments", href: "/treatments", icon: User },
]

export function GlobalNavigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-stone-50 border-b border-stone-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="font-serif text-xl text-stone-800">
            Skincare Sanctuary
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href.replace("/new-consultation", "") + "/") ||
                (item.href.includes("chat") && pathname.startsWith("/chat/"))

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-stone-600 hover:text-sage-600 hover:bg-sage-50 ${
                      isActive ? "text-sage-700 bg-sage-100" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <Package className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
