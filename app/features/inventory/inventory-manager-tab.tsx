"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, MessageCircle, AlertTriangle, Trash2 } from "lucide-react"
import { useSkincareData } from "@/app/features/shared/contexts/skincare-data-context"

export function InventoryManagerTab() {
  const { inventory, isLoading, markProductAsUsed, deleteProductFromInventory } = useSkincareData()

  const handleMarkAsUsed = async (itemId: string, currentAmount: number) => {
    try {
      await markProductAsUsed(itemId, currentAmount)
      console.log("Product usage updated!")
    } catch (error) {
      console.error("Error updating usage:", error)
    }
  }

  const handleDelete = async (itemId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to remove "${productName}" from your collection?`)) {
      try {
        await deleteProductFromInventory(itemId)
        console.log("Product deleted successfully!")
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  const getAmountColor = (amount: number) => {
    if (amount <= 20) return "text-red-600"
    if (amount <= 50) return "text-yellow-600"
    return "text-blue-600"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-charcoal-600">Loading your collection...</div>
      </div>
    )
  }

  if (inventory.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-8 w-8 mx-auto text-charcoal-400 mb-3" />
        <h3 className="font-serif text-lg text-charcoal-800 mb-2">Collection is empty</h3>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {inventory.map((item) => {
        const needsReorder = item.amount_remaining <= 20

        return (
          <Card key={item.id} className="border-stone-200 bg-stone-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`font-serif text-base text-charcoal-800 "line-clamp-1"}`}>
                    {item.products.name}
                  </h3>
                  <p className="text-sm text-charcoal-600">{item.products.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      {item.products.category}
                    </Badge>
                    {needsReorder && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low
                      </Badge>
                    )}
                  </div>
                  { item.notes && <p className="text-xs text-charcoal-500 mt-2">{item.notes}</p>}
                  { item.purchase_date && (
                    <p className="text-xs text-charcoal-500 mt-1">
                      Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(item.id, item.products.name)}
                  className="border-black text-black hover:bg-gray-100 bg-transparent ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
