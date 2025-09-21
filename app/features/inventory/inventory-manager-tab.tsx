"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, MessageCircle, AlertTriangle, Expand, Trash2 } from "lucide-react"
import { useSkincareData } from "@/app/features/shared/contexts/skincare-data-context"

interface InventoryManagerTabProps {
  onExpand?: () => void
  isFullScreen?: boolean
}

export function InventoryManagerTab({ onExpand, isFullScreen }: InventoryManagerTabProps) {
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
    return "text-green-600"
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
      {!isFullScreen && onExpand && (
        <div className="flex justify-end mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onExpand}
            className="border-stone-200 text-charcoal-600 hover:bg-stone-50 bg-transparent"
          >
            <Expand className="h-3 w-3 mr-1" />
            Expand
          </Button>
        </div>
      )}

      {inventory.map((item) => {
        const needsReorder = item.amount_remaining <= 20

        return (
          <Card key={item.id} className="border-stone-200 bg-stone-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`font-serif text-base text-charcoal-800 ${isFullScreen ? "" : "line-clamp-1"}`}>
                    {item.products.name}
                  </h3>
                  <p className="text-sm text-charcoal-600">{item.products.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-sage-100 text-sage-800 border-sage-200 text-xs">
                      {item.products.category}
                    </Badge>
                    {needsReorder && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low
                      </Badge>
                    )}
                  </div>
                  {isFullScreen && item.notes && <p className="text-xs text-charcoal-500 mt-2">{item.notes}</p>}
                  {isFullScreen && item.purchase_date && (
                    <p className="text-xs text-charcoal-500 mt-1">
                      Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(item.id, item.products.name)}
                  className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-charcoal-700">Amount Remaining</span>
                  <span className={`text-xs font-medium ${getAmountColor(item.amount_remaining)}`}>
                    {item.amount_remaining}%
                  </span>
                </div>
                <Progress value={item.amount_remaining} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
