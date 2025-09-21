import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Cabinet action API called")
    const { action, product_name, product_brand, reason, category } = await request.json()
    console.log("[v0] Request data:", { action, product_name, product_brand, reason, category })

    if (action !== "add" && action !== "update") {
      console.log("[v0] Invalid action:", action)
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Getting user session...")
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.log("[v0] Auth session missing!")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError) {
      console.log("[v0] User error:", userError.message)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!user) {
      console.log("[v0] No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User found:", user.id)

    console.log("[v0] Searching for existing product:", product_name, "by", product_brand)
    const { data: existingProduct, error: searchError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("name", product_name)
      .eq("brand", product_brand)
      .single()

    if (searchError && searchError.code !== "PGRST116") {
      console.log("[v0] Search error:", searchError)
    }

    let productId = existingProduct?.id
    console.log("[v0] Existing product ID:", productId)

    if (!productId && action === "update") {
      console.log("[v0] Looking for similar product to update...")
      const { data: similarProduct, error: similarError } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("brand", product_brand)
        .eq("category", category || "skincare")
        .single()

      if (!similarError && similarProduct) {
        productId = similarProduct.id
        console.log("[v0] Found similar product to update:", productId)

        // Update the existing product with new details
        const { error: updateError } = await supabaseAdmin
          .from("products")
          .update({
            name: product_name,
            description: `AI-recommended product: ${reason}`,
          })
          .eq("id", productId)

        if (updateError) {
          console.error("[v0] Error updating product:", updateError)
        } else {
          console.log("[v0] Updated existing product with new details")
        }
      }
    }

    // If no specific product exists, create one using service role
    if (!productId) {
      console.log("[v0] Creating new product:", product_name, "by", product_brand)
      const { data: newProduct, error: createError } = await supabaseAdmin
        .from("products")
        .insert({
          name: product_name,
          brand: product_brand,
          category: category || "skincare",
          description: `AI-recommended product: ${reason}`,
          subcategory: "ai-recommended",
        })
        .select("id")
        .single()

      if (createError) {
        console.error("[v0] Error creating product:", createError)
        return NextResponse.json({ error: "Failed to create product", details: createError.message }, { status: 500 })
      }

      productId = newProduct?.id
      console.log("[v0] Created new product ID:", productId)
    }

    const operationType = action === "update" ? "Updating" : "Adding to"
    console.log(`[v0] ${operationType} user inventory...`)

    const { error: inventoryError } = await supabaseAdmin.from("user_inventory").upsert(
      {
        user_id: user.id,
        product_id: productId,
        notes: `AI recommendation: ${reason}`,
        amount_remaining: 100, // Default amount
      },
      {
        onConflict: "user_id,product_id", // Specify the unique constraint columns
      },
    )

    if (inventoryError) {
      console.error("[v0] Error adding to inventory:", inventoryError)
      return NextResponse.json(
        { error: "Failed to add to inventory", details: inventoryError.message },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully added to inventory")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Cabinet action error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
