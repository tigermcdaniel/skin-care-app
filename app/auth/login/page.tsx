"use client"

import type React from "react"

import { createClient } from "@/integrations/supabase/client"
import { Button } from "@/app/features/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/features/shared/ui/card"
import { Input } from "@/app/features/shared/ui/input"
import { Label } from "@/app/features/shared/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/chat/new-session")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-sage-600 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-charcoal-900 mb-2">Welcome Back</h1>
          <p className="text-charcoal-600 font-light">Continue your skincare sanctuary</p>
        </div>

        <Card className="border border-sage-200 shadow-lg bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-serif text-charcoal-900">Sign In</CardTitle>
            <CardDescription className="text-charcoal-600">
              Enter your credentials to access your ritual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-charcoal-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-charcoal-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                />
              </div>
              {error && (
                <div className="p-4 text-sm text-burgundy-700 bg-rose-50 border border-rose-200 rounded-md">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 bg-sage-600 hover:bg-sage-700 text-white font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-charcoal-600">New to our sanctuary? </span>
              <Link href="/auth/sign-up" className="font-medium text-sage-600 hover:text-sage-700 transition-colors">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
