import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { suggestionId } = await request.json()
    console.log("[v0] Denying routine suggestion:", suggestionId)

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Routine denied for user:", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error denying routine:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
