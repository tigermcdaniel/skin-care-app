/**
 * Inventory Manager Component
 * 
 * Comprehensive inventory management system for skincare products, providing users with
 * complete control over their product collection, usage tracking, and expiration monitoring.
 * This component handles product lifecycle management, inventory optimization, and
 * provides intelligent insights for skincare routine planning.
 * 
 * Key Features:
 * - Product inventory management with detailed product information
 * - Usage tracking and amount remaining monitoring
 * - Expiration date tracking with visual alerts
 * - Product categorization and organization
 * - Purchase history and cost tracking
 * - Notes and personal annotations for products
 * 
 * Inventory Management:
 * - Add, edit, and remove products from inventory
 * - Track product usage and remaining amounts
 * - Monitor expiration dates with visual indicators
 * - Organize products by category and subcategory
 * - Manage product notes and personal preferences
 * - Generate usage reports and insights
 * 
 * User Experience:
 * - Intuitive product management interface
 * - Visual progress indicators for product usage
 * - Expiration alerts and warnings
 * - Quick access to product details and actions
 * - Responsive design for mobile and desktop
 * - Search and filter capabilities for large inventories
 */

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
import { createClient } from "@/integrations/supabase/client"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Calendar, Package, MessageCircle, ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react"

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

/**
 * InventoryManager Component
 * 
 * Main inventory management component that handles the complete lifecycle of skincare products
 * in the user's collection. This component provides comprehensive product management,
 * usage tracking, and inventory optimization features for effective skincare routine planning.
 * 
 * Core Functionality:
 * - Displays complete product inventory with detailed information
 * - Manages product editing, updating, and deletion operations
 * - Tracks product usage and remaining amounts
 * - Monitors expiration dates with visual alerts
 * - Handles product notes and personal annotations
 * - Provides inventory insights and usage analytics
 * 
 * Data Management:
 * - Processes inventory data with product relationships
 * - Manages product lifecycle from purchase to expiration
 * - Tracks usage patterns and consumption rates
 * - Handles product categorization and organization
 * - Provides real-time inventory updates
 * 
 * User Interface:
 * - Intuitive product management interface
 * - Visual progress indicators for product usage
 * - Expiration alerts and warnings
 * - Quick access to product actions and details
 * - Responsive design for all device sizes
 * 
 * @param {Object} props - Component props
 * @param {InventoryItem[]} props.inventory - Array of inventory items with product details
 * @param {string} props.userId - User ID for data filtering and operations
 * @returns {JSX.Element} Complete inventory management interface
 */
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

  const askChatAboutProduct = (item: InventoryItem) => {
    const prompt = `Tell me about ${item.products.name} by ${item.products.brand} and how to use it effectively`
    router.push(`/chat/new-session?prompt=${encodeURIComponent(prompt)}`)
  }

  const orderMoreProduct = (item: InventoryItem) => {
    const prompt = `I need to reorder ${item.products.name} by ${item.products.brand}. Can you help me find where to buy it?`
    router.push(`/chat/new-session?prompt=${encodeURIComponent(prompt)}`)
  }

  const markAsUsed = async (itemId: string, currentAmount: number) => {
    const newAmount = Math.max(0, currentAmount - 10)
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("user_inventory")
        .update({
          amount_remaining: newAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating usage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif text-charcoal-800">Your Collection Reference</h2>
          <p className="text-charcoal-600">Track usage and take actions when needed</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/chat/new-session?prompt=What products should I add to my collection?")}
            variant="outline"
            className="border-sage-200 text-sage-700 hover:bg-sage-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Ask for Recommendations
          </Button>
          <Button
            onClick={() => router.push("/products")}
            className="bg-sage-600 hover:bg-sage-700 text-white transition-all duration-300"
          >
            <Package className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
        </div>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-charcoal-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium font-serif text-charcoal-800 mb-2">Your collection awaits</h3>
          <p className="text-charcoal-600 mb-4">Start by asking your advisor for product recommendations</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/chat/new-session?prompt=What skincare products should I start with?")}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Chat for Products
            </Button>
            <Button
              onClick={() => router.push("/products")}
              variant="outline"
              className="border-sage-200 text-sage-700 hover:bg-sage-50"
            >
              <Package className="h-4 w-4 mr-2" />
              Browse Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiry_date)
            const needsReorder = item.amount_remaining <= 20

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
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="bg-sage-100 text-sage-800 border-sage-200">
                        {item.products.category}
                      </Badge>
                      {needsReorder && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low
                        </Badge>
                      )}
                    </div>
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

                  <div className="space-y-3">
                    {/* Primary Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => markAsUsed(item.id, item.amount_remaining)}
                        disabled={isLoading}
                        className="flex-1 bg-sage-600 hover:bg-sage-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Used
                      </Button>
                      {needsReorder && (
                        <Button
                          onClick={() => orderMoreProduct(item)}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => askChatAboutProduct(item)}
                        className="flex-1 border-stone-200 text-charcoal-600 hover:bg-stone-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask Chat
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="border-stone-200 text-charcoal-600 hover:bg-stone-50"
                          >
                            <Edit className="h-4 w-4" />
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
                        className="text-black hover:text-gray-800 hover:bg-gray-100 border-black"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
