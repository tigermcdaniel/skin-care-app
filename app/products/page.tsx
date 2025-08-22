import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductCatalog } from "@/components/product-catalog"
import { GlobalNavigation } from "@/components/global-navigation"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all products
  const { data: products } = await supabase.from("products").select("*").order("brand", { ascending: true })

  // Get user's inventory
  const { data: inventory } = await supabase.from("user_inventory").select("*, products(*)").eq("user_id", user.id)

  return (
    <>
      <GlobalNavigation />
      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-charcoal-900 mb-4">Product Sanctuary</h1>
            <p className="text-charcoal-600 text-lg leading-relaxed">
              Discover curated skincare essentials for your daily ritual
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <ProductCatalog products={products || []} userInventory={inventory || []} userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}
