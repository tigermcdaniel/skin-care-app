"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Calendar, Package } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  description: string | null
  price: number | null
  size: string | null
}

interface InventoryItem {
  id: string
  user_id: string
  product_id: string
  purchase_date: string | null
  expiry_date: string | null
  amount_remaining: number
  notes: string | null
  created_at: string
  updated_at: string
  products: Product
}

interface InventoryManagerProps {
  inventory: InventoryItem[]
  userId: string
}

export function InventoryManager({ inventory, userId }: InventoryManagerProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    purchase_date: "",
    expiry_date: "",
    amount_remaining: 100,
    notes: "",
  })

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      purchase_date: item.purchase_date || "",
      expiry_date: item.expiry_date || "",
      amount_remaining: item.amount_remaining,
      notes: item.notes || "",
    })
  }

  const updateInventoryItem = async () => {
    if (!editingItem) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("user_inventory")
        .update({
          purchase_date: formData.purchase_date || null,
          expiry_date: formData.expiry_date || null,
          amount_remaining: formData.amount_remaining,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem.id)

      if (error) throw error
      setEditingItem(null)
      router.refresh()
    } catch (error) {
      console.error("Error updating inventory item:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromInventory = async (itemId: string) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("user_inventory").delete().eq("id", itemId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error removing from inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return { status: "expired", color: "bg-red-500", text: "Expired" }
    if (daysUntilExpiry <= 30)
      return { status: "expiring", color: "bg-yellow-500", text: `${daysUntilExpiry} days left` }
    return { status: "good", color: "bg-green-500", text: `${daysUntilExpiry} days left` }
  }

  const getAmountColor = (amount: number) => {
    if (amount <= 20) return "text-red-600"
    if (amount <= 50) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-charcoal-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium font-serif text-charcoal-800 mb-2">Your collection awaits</h3>
          <p className="text-charcoal-600 mb-4">Begin curating your personal skincare sanctuary</p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-sage-600 hover:bg-sage-700 text-white transition-all duration-300"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiry_date)

            return (
              <Card
                key={item.id}
                className="border-0 bg-stone-50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 font-serif text-charcoal-800">
                        {item.products.name}
                      </CardTitle>
                      <CardDescription className="font-medium text-charcoal-600">{item.products.brand}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-sage-100 text-sage-800 border-sage-200">
                      {item.products.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount Remaining */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-charcoal-700">Amount Remaining</Label>
                      <span className={`text-sm font-medium ${getAmountColor(item.amount_remaining)}`}>
                        {item.amount_remaining}%
                      </span>
                    </div>
                    <Progress value={item.amount_remaining} className="h-2" />
                  </div>

                  {/* Expiry Status */}
                  {expiryStatus && (
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${expiryStatus.color}`} />
                      <span className="text-sm text-gray-600">{expiryStatus.text}</span>
                    </div>
                  )}

                  {/* Purchase Date */}
                  {item.purchase_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Purchased: {new Date(item.purchase_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="p-3 bg-stone-100 rounded-lg border border-stone-200">
                      <p className="text-sm text-charcoal-700">{item.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="flex-1 border-sage-200 text-sage-700 hover:bg-sage-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit {item.products.name}</DialogTitle>
                          <DialogDescription>Update your product information and usage tracking</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="purchase_date">Purchase Date</Label>
                              <Input
                                id="purchase_date"
                                type="date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expiry_date">Expiry Date</Label>
                              <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount_remaining">Amount Remaining (%)</Label>
                            <Input
                              id="amount_remaining"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.amount_remaining}
                              onChange={(e) =>
                                setFormData({ ...formData, amount_remaining: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add notes about this product..."
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                          </div>
                          <Button
                            onClick={updateInventoryItem}
                            disabled={isLoading}
                            className="w-full bg-sage-600 hover:bg-sage-700 text-white"
                          >
                            {isLoading ? "Updating..." : "Update Product"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromInventory(item.id)}
                      disabled={isLoading}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
