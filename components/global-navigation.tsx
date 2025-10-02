/**
 * Global Navigation Component
 * 
 * Shared navigation bar used across the application.
 * Provides consistent styling and behavior for all pages.
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

interface GlobalNavigationProps {
  currentPage?: "home" | "demo"
  showBackground?: boolean
}

export function GlobalNavigation({ currentPage, showBackground = true }: GlobalNavigationProps) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 px-4 py-4 ${showBackground ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Mobile Navigation - Simple top bar */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-serif text-charcoal-900">AI Skincare</Link>
            
            <div className="hidden sm:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/demo" 
                  className={`text-sm py-2 px-3 rounded-md transition-colors ${
                    currentPage === "demo" 
                      ? "text-blue-600 font-medium bg-blue-50" 
                      : "text-charcoal-600 hover:text-charcoal-800 hover:bg-gray-50"
                  }`}
                >
                  Demo
                </Link>
                <Link 
                  href="https://github.com/tigermcdaniel/skin-care-app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm py-2 px-3 rounded-md transition-colors text-charcoal-600 hover:text-charcoal-800 hover:bg-gray-50"
                >
                  GitHub
                </Link>
                <Link 
                  href="mailto:tiger.mcdaniel@me.com" 
                  className="text-sm py-2 px-3 rounded-md transition-colors text-charcoal-600 hover:text-charcoal-800 hover:bg-gray-50"
                >
                  Contact
                </Link>
              </div>
            </div>
            
            <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white px-3 py-2 text-sm">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Desktop Navigation - Floating nav bar */}
        <div className="hidden lg:block">
          <div className="bg-black/90 backdrop-blur-sm rounded-full px-6 md:px-8 py-3 md:py-4 shadow-lg border border-gray-800 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-serif text-white">AI Skincare</Link>
            </div>
            
            <div className="flex items-center justify-center flex-1">
              <div className="flex items-center space-x-6">
                <Link 
                  href="/demo" 
                  className={`transition-colors text-sm md:text-base ${
                    currentPage === "demo" 
                      ? "text-white font-medium" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Demo
                </Link>
                <Link 
                  href="https://github.com/tigermcdaniel/skin-care-app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
                >
                  GitHub
                </Link>
                <Link 
                  href="mailto:tiger.mcdaniel@me.com" 
                  className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
              <Link href="/auth/login" className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                Sign In
              </Link>
              <Button asChild className="bg-white hover:bg-gray-100 text-black px-4 md:px-6 py-2 rounded-full border border-white transition-all duration-200 hover:scale-105 text-sm md:text-base">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}