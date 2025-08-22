"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Search, Plus, Check } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  description: string | null
  price: number | null
  size: string | null
  ingredients: string[] | null
}

interface InventoryItem {
  id: string
  product_id: string
  products: Product
}

interface ProductCatalogProps {
  products: Product[]
  userInventory: InventoryItem[]
  userId: string
}

export function ProductCatalog({ products, userInventory, userId }: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]
  const inventoryProductIds = new Set(userInventory.map((item) => item.product_id))

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const addToInventory = async (productId: string) => {
    setIsLoading(productId)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("user_inventory").insert({
        user_id: userId,
        product_id: productId,
        amount_remaining: 100,
        purchase_date: new Date().toISOString().split("T")[0],
      })

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error adding to inventory:", error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 h-4 w-4" />
          <Input
            placeholder="Search products, brands, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-stone-200 focus:border-sage-500 focus:ring-sage-500"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 h-11 border-stone-200 focus:border-sage-500">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const isInInventory = inventoryProductIds.has(product.id)
          const isAddingToInventory = isLoading === product.id

          return (
            <Card
              key={product.id}
              className="border-0 bg-stone-50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 font-serif text-charcoal-800">{product.name}</CardTitle>
                    <CardDescription className="font-medium text-charcoal-600">{product.brand}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2 bg-sage-100 text-sage-800 border-sage-200">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.subcategory && (
                  <Badge variant="outline" className="text-xs border-stone-300 text-stone-700">
                    {product.subcategory}
                  </Badge>
                )}

                {product.description && <p className="text-sm text-charcoal-600 line-clamp-3">{product.description}</p>}

                <div className="flex justify-between items-center text-sm text-charcoal-500">
                  {product.size && <span>{product.size}</span>}
                  {product.price && <span className="font-medium text-charcoal-800">${product.price}</span>}
                </div>

                {product.ingredients && product.ingredients.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-charcoal-700">Key Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.ingredients.slice(0, 3).map((ingredient, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-stone-300 text-stone-600">
                          {ingredient}
                        </Badge>
                      ))}
                      {product.ingredients.length > 3 && (
                        <Badge variant="outline" className="text-xs border-stone-300 text-stone-600">
                          +{product.ingredients.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => addToInventory(product.id)}
                  disabled={isInInventory || isAddingToInventory}
                  className={`w-full transition-all duration-300 ${
                    isInInventory
                      ? "bg-sage-100 text-sage-700 hover:bg-sage-100 border border-sage-200"
                      : "bg-sage-600 hover:bg-sage-700 text-white"
                  }`}
                  variant={isInInventory ? "secondary" : "default"}
                >
                  {isInInventory ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      In Collection
                    </>
                  ) : isAddingToInventory ? (
                    "Adding..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Collection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-charcoal-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-charcoal-800 mb-2">No products found</h3>
          <p className="text-charcoal-600">Try adjusting your search terms or category filter</p>
        </div>
      )}
    </div>
  )
}
