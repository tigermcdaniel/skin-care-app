import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GlobalNavigation } from "@/components/global-navigation"
import {
  CheckCircle,
  Sun,
  Moon,
  Camera,
  ShoppingBag,
  Package,
  Clock,
  TrendingUp,
  MessageCircle,
  Sparkles,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile?.first_name || !profile?.skin_type) {
    redirect("/onboarding")
  }

  // Get user's routines
  const { data: routines } = await supabase.from("routines").select("*").eq("user_id", user.id).eq("is_active", true)

  // Get inventory count
  const { count: inventoryCount } = await supabase
    .from("user_inventory")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Get today's check-in status
  const today = new Date().toISOString().split("T")[0]
  const { data: todayCheckin } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single()

  const morningRoutine = routines?.find((r) => r.type === "morning")
  const eveningRoutine = routines?.find((r) => r.type === "evening")

  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ObxMt4d3T5MDA2Ca7JyHf5lCNuxMZN.png"
            alt=""
            className="w-full h-full object-cover animate-gentle-sway"
          />
        </div>
        <div
          className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-5 animate-float-slow"
          style={{ background: "radial-gradient(circle, #AE9D81 0%, transparent 70%)" }}
        ></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-5 animate-float-delayed"
          style={{ background: "radial-gradient(circle, #8C8A45 0%, transparent 70%)" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full opacity-5 animate-float-reverse"
          style={{ background: "radial-gradient(circle, #956656 0%, transparent 70%)" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full opacity-5 animate-float-slow"
          style={{ background: "radial-gradient(circle, #610D08 0%, transparent 70%)" }}
        ></div>
      </div>

      <GlobalNavigation />

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="mb-16 animate-fade-in-up">
          <h1 className="luxury-heading text-4xl mb-4" style={{ color: "#390000" }}>
            YOUR PERSONAL SKINCARE SANCTUARY
          </h1>
          <p className="luxury-subheading text-lg mb-2 animate-fade-in-delayed" style={{ color: "#610D08" }}>
            Welcome back, {profile.first_name}
          </p>
          <p className="text-stone-600 max-w-2xl leading-relaxed animate-fade-in-delayed-2">
            Where skincare becomes a ritual of self-care and transformation. Track your journey, follow your routines,
            and discover the beauty of consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card
            className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 animate-slide-in-left hover:animate-gentle-pulse"
            style={{ borderLeft: "4px solid #AE9D81" }}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 luxury-subheading text-xl" style={{ color: "#8C8A45" }}>
                <Sun className="h-6 w-6" />
                Morning Routine
              </CardTitle>
              <CardDescription className="text-stone-600">Begin each day with intention and care</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-stone-600 leading-relaxed">
                  {morningRoutine ? "Your personalized morning routine awaits" : "Create your perfect morning ritual"}
                </p>
                {todayCheckin?.morning_routine_completed && (
                  <div className="flex items-center gap-2" style={{ color: "#8C8A45" }}>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Completed with care today</span>
                  </div>
                )}
                <Button
                  className="luxury-button w-full bg-transparent"
                  variant="outline"
                  asChild
                  style={{ borderColor: "#AE9D81", color: "#AE9D81" }}
                >
                  <Link href={morningRoutine ? `/routines/${morningRoutine.id}` : "/routines"}>
                    {morningRoutine ? "Begin Morning Ritual" : "Create Morning Ritual"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 animate-slide-in-right hover:animate-gentle-pulse"
            style={{ borderLeft: "4px solid #956656" }}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 luxury-subheading text-xl" style={{ color: "#610D08" }}>
                <Moon className="h-6 w-6" />
                Evening Routine
              </CardTitle>
              <CardDescription className="text-stone-600">End your day with restorative care</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-stone-600 leading-relaxed">
                  {eveningRoutine ? "Your evening sanctuary is prepared" : "Design your perfect evening ritual"}
                </p>
                {todayCheckin?.evening_routine_completed && (
                  <div className="flex items-center gap-2" style={{ color: "#610D08" }}>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Completed with mindfulness today</span>
                  </div>
                )}
                <Button
                  className="luxury-button w-full bg-transparent"
                  variant="outline"
                  asChild
                  style={{ borderColor: "#956656", color: "#956656" }}
                >
                  <Link href={eveningRoutine ? `/routines/${eveningRoutine.id}` : "/routines"}>
                    {eveningRoutine ? "Begin Evening Ritual" : "Create Evening Ritual"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16 animate-fade-in-up-delayed">
          <Card
            className="border-0 shadow-sm bg-white max-w-2xl mx-auto hover:shadow-lg transition-all duration-500 animate-gentle-float"
            style={{ borderTop: "4px solid #8C8A45" }}
          >
            <CardHeader className="text-center pb-4">
              <CardTitle
                className="flex items-center justify-center gap-3 luxury-subheading text-xl"
                style={{ color: "#390000" }}
              >
                <Camera className="h-6 w-6" />
                Daily Reflection
              </CardTitle>
              <CardDescription className="text-stone-600">
                Document your journey with mindful observation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-sm text-stone-600 leading-relaxed">
                  Capture today's progress and reflect on your skin's transformation
                </p>
                {todayCheckin && (
                  <div className="flex items-center justify-center gap-2" style={{ color: "#8C8A45" }}>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Today's reflection complete</span>
                  </div>
                )}
                <Button
                  className="luxury-button-primary px-8"
                  asChild
                  style={{ backgroundColor: "#8C8A45", borderColor: "#8C8A45" }}
                >
                  <Link href="/check-in">{todayCheckin ? "Update Reflection" : "Begin Daily Reflection"}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/products" className="group animate-fade-in-grid" style={{ animationDelay: "0.1s" }}>
            <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-[1.05] group-hover:animate-gentle-glow">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-4" style={{ color: "#AE9D81" }} />
                <h3 className="luxury-subheading text-lg mb-2" style={{ color: "#390000" }}>
                  Product Discovery
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">Curated skincare essentials</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory" className="group animate-fade-in-grid" style={{ animationDelay: "0.2s" }}>
            <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-[1.05] group-hover:animate-gentle-glow">
              <CardContent className="p-8 text-center">
                <Package className="h-8 w-8 mx-auto mb-4" style={{ color: "#956656" }} />
                <h3 className="luxury-subheading text-lg mb-2" style={{ color: "#390000" }}>
                  Personal Collection
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {inventoryCount ? `${inventoryCount} curated products` : "Your skincare sanctuary"}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/routines" className="group animate-fade-in-grid" style={{ animationDelay: "0.3s" }}>
            <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-[1.05] group-hover:animate-gentle-glow">
              <CardContent className="p-8 text-center">
                <Clock className="h-8 w-8 mx-auto mb-4" style={{ color: "#8C8A45" }} />
                <h3 className="luxury-subheading text-lg mb-2" style={{ color: "#390000" }}>
                  Ritual Management
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">Personalized care routines</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/progress" className="group animate-fade-in-grid" style={{ animationDelay: "0.4s" }}>
            <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-[1.05] group-hover:animate-gentle-glow">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-4" style={{ color: "#610D08" }} />
                <h3 className="luxury-subheading text-lg mb-2" style={{ color: "#390000" }}>
                  Progress Journey
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">Your transformation story</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chat/new-session" className="group animate-fade-in-grid" style={{ animationDelay: "0.5s" }}>
            <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-[1.05] group-hover:animate-gentle-glow">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-4" style={{ color: "#AE9D81" }} />
                <h3 className="luxury-subheading text-lg mb-2" style={{ color: "#390000" }}>
                  Expert Consultation
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">Personalized skincare guidance</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/treatments" className="group animate-fade-in-grid" style={{ animationDelay: "0.6s" }}>
            <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-[1.05] group-hover:animate-gentle-glow">
              <CardContent className="p-8 text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-4" style={{ color: "#956656" }} />
                <h3 className="luxury-subheading text-lg mb-2" style={{ color: "#390000" }}>
                  Professional Care
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">Advanced treatment tracking</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
