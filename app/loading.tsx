import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sage-600 mb-4" />
          <p className="text-gray-600">Loading your AI skincare consultant...</p>
        </CardContent>
      </Card>
    </div>
  )
}
