/**
 * Landing Page Component
 * 
 * A beautiful, clean landing page for the AI-powered skincare consultant application.
 * Features a large background graphic area and compelling copy to encourage sign-ups.
 * Handles authentication checks and redirects logged-in users to appropriate pages.
 */

import { createClient } from "@/integrations/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlobalNavigation } from "@/components/global-navigation"

export default async function LandingPage() {
  // Check if user is authenticated and redirect if they are
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("first_name, skin_type").eq("id", user.id).single()

    if (profile?.first_name && profile?.skin_type) {
      redirect("/chat/new-session")
    } else {
      redirect("/onboarding")
    }
  }
  return (
    <div>
      {/* First Page - Hero Section with Video Background */}
      <div className="relative h-screen p-0 sm:p-6 md:p-8">
        {/* Video Background with soft border */}
        <div 
          className="bunny-vids absolute inset-0 sm:inset-6 md:inset-8 w-auto h-auto rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border-white/20"
        >
          <video 
            autoPlay={true}
            muted={true}
            loop={true}
            playsInline={true}
            preload="auto"
            controls={false}
            className="w-full h-full object-cover"
            style={{
              opacity: 1,
              transition: 'opacity 0.6s',
              willChange: 'opacity',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0px)'
            }}
          >
            <source src="/0921(2).mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 h-full flex flex-col pt-0">
        {/* Header */}
        <GlobalNavigation currentPage="home" showBackground={false} />

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-sage-200 mb-8">
              <div className="w-2 h-2 bg-sage-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-charcoal-700">AI-Powered Skincare Guidance</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-charcoal-800 mb-6 sm:mb-8 leading-tight">
              Unlock your new
              <br />
              <span className="text-sage-600">skin intelligence</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-charcoal-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Reimaging what skincare looks like.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-32 sm:mb-48 md:mb-64">
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-white/20"
              >
                <Link href="/auth/sign-up">Start Your Journey</Link>
              </Button>
            </div>
          </div>
        </main>
        </div>
      </div>

      {/* Second Page - Features Section */}
      <div className="min-h-screen bg-white">
        {/* Feature Highlights */}
        <div className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Conversation</h3>
                <p className="text-gray-600 text-sm">Natural skincare guidance through intelligent dialogue</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Routines</h3>
                <p className="text-gray-600 text-sm">Personalized morning and evening skincare rituals</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">Visual insights into your skincare transformation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-gray-200">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-500 text-sm">
              Where skincare wisdom meets intelligent conversation
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
