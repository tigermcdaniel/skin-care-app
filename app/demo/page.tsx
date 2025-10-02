/**
 * Demo Page Component
 * 
 * A demonstration page showcasing the AI-powered skincare consultant features.
 * Includes interactive examples and feature highlights.
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star, Users, Zap, Shield, Clock } from "lucide-react"
import { GlobalNavigation } from "@/components/global-navigation"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Global Navigation */}
      <GlobalNavigation currentPage="demo" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 pt-0">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            <Zap className="w-4 h-4 mr-2" />
            Interactive Demo
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-light text-charcoal-800 mb-6 leading-tight">
            Experience the Future of
            <br />
            <span className="text-blue-600">Skincare Intelligence</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-charcoal-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            See how our AI-powered consultant can transform your skincare routine with personalized recommendations and intelligent guidance.
          </p>
        </div>
      </section>

      {/* Demo Features */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Chat Demo */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-serif text-charcoal-800">AI Chat Assistant</CardTitle>
                    <CardDescription>Intelligent skincare conversations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <p className="text-gray-600 mb-2">You: "I have dry skin and want to start a routine"</p>
                    <p className="text-charcoal-800">AI: "I'll create a personalized routine for your dry skin. Let's start with a gentle cleanser and hydrating moisturizer..."</p>
                  </div>
                  <Button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800">
                    Try Chat Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Routine Builder Demo */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-serif text-charcoal-800">Smart Routines</CardTitle>
                    <CardDescription>Personalized daily schedules</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-charcoal-800">Morning Routine</span>
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-600">5 steps • 15 minutes</p>
                  </div>
                  <Button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800">
                    View Routine Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking Demo */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-serif text-charcoal-800">Progress Tracking</CardTitle>
                    <CardDescription>Monitor your skin journey</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-charcoal-800">Skin Health Score</span>
                      <span className="text-sm font-bold text-blue-600">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800">
                    See Progress Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-charcoal-800 mb-6">
            Ready to Transform Your Skin?
          </h2>
          <p className="text-lg text-charcoal-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already discovered the power of AI-powered skincare guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-medium transition-all duration-200 hover:shadow-lg">
              <Link href="/auth/sign-up">Start Your Journey</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 px-8 py-4 text-lg font-medium">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            © 2024 AI Skincare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
