import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InventoryManager } from "@/components/inventory-manager"
import { GlobalNavigation } from "@/components/global-navigation"

export default async function InventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's inventory with product details
  const { data: inventory } = await supabase
    .from("user_inventory")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <GlobalNavigation />
      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-charcoal-900 mb-4">Personal Collection</h1>
            <p className="text-charcoal-600 text-lg leading-relaxed">
              Curate and manage your skincare essentials with intention
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <InventoryManager inventory={inventory || []} userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}
