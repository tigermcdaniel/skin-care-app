import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, check if they've completed onboarding
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("first_name, skin_type").eq("id", user.id).single()

    if (profile?.first_name && profile?.skin_type) {
      redirect("/dashboard")
    } else {
      redirect("/onboarding")
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="mx-auto h-20 w-20 bg-sage-600 rounded-full flex items-center justify-center mb-8">
            <svg className="h-10 w-10 text-stone-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-6xl font-light text-charcoal-800 mb-6 tracking-wide">
            A MODERN
            <br />
            SKINCARE SANCTUARY
          </h1>
          <p className="text-xl text-charcoal-600 max-w-2xl mx-auto leading-relaxed font-light">
            Your personal aesthetician companion for cultivating radiant, healthy skin through mindful rituals and
            intelligent guidance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Atmospheric image placeholder */}
          <div className="relative">
            <div className="aspect-[4/5] bg-gradient-to-b from-sage-200 to-sage-400 rounded-sm overflow-hidden">
              <img
                src="/placeholder.svg?height=600&width=480"
                alt="Serene skincare sanctuary"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>

          {/* Right column - Content */}
          <div className="space-y-12">
            <div>
              <p className="text-charcoal-700 leading-relaxed mb-8 font-light">
                Our platform draws inspiration from the wisdom of professional aestheticians, combining time-honored
                skincare principles with modern AI intelligence to create a deeply personal journey toward skin
                wellness.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="text-center p-6 bg-white border border-sage-200 rounded-sm">
                  <h3 className="font-serif text-lg text-charcoal-800 mb-2">Ritual Builder</h3>
                  <p className="text-sm text-charcoal-600 font-light">Curated morning & evening routines</p>
                </div>
                <div className="text-center p-6 bg-white border border-sage-200 rounded-sm">
                  <h3 className="font-serif text-lg text-charcoal-800 mb-2">AI Guidance</h3>
                  <p className="text-sm text-charcoal-600 font-light">Personalized skincare wisdom</p>
                </div>
                <div className="text-center p-6 bg-white border border-sage-200 rounded-sm">
                  <h3 className="font-serif text-lg text-charcoal-800 mb-2">Progress Journal</h3>
                  <p className="text-sm text-charcoal-600 font-light">Visual transformation tracking</p>
                </div>
                <div className="text-center p-6 bg-white border border-sage-200 rounded-sm">
                  <h3 className="font-serif text-lg text-charcoal-800 mb-2">Treatment Plans</h3>
                  <p className="text-sm text-charcoal-600 font-light">Professional care scheduling</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                asChild
                className="w-full bg-sage-600 hover:bg-sage-700 text-stone-50 py-6 text-lg font-light tracking-wide rounded-sm"
              >
                <Link href="/auth/sign-up">Begin Your Journey</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-sage-600 text-sage-600 hover:bg-sage-50 py-6 text-lg font-light tracking-wide rounded-sm bg-transparent"
              >
                <Link href="/auth/login">Continue Your Practice</Link>
              </Button>
            </div>

            <p className="text-center text-sm text-charcoal-500 font-light italic">
              Where skincare becomes a mindful ritual of self-care and transformation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
