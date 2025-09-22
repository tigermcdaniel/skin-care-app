"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, Star, Eye } from "lucide-react"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"

interface ProgressPhoto {
  id: string
  user_id: string
  photo_url: string
  photo_type: string
  notes: string | null
  lighting_conditions: string | null
  skin_condition_rating: number | null
  created_at: string
}

interface PhotoGalleryProps {
  photos: ProgressPhoto[]
  userId: string
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)
  const [filter, setFilter] = useState("all")

  const filteredPhotos = photos.filter((photo) => {
    if (filter === "all") return true
    return photo.photo_type === filter
  })

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-blue-100 text-blue-800"
      case "weekly":
        return "bg-blue-100 text-blue-800"
      case "monthly":
        return "bg-purple-100 text-purple-800"
      case "before":
        return "bg-orange-100 text-orange-800"
      case "after":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />)
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />)
    }

    return <div className="flex gap-1">{stars}</div>
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Progress Photo Gallery</CardTitle>
          <CardDescription>Track your skincare journey through photos</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["all", "daily", "weekly", "monthly", "before", "after"].map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className={filter === filterType ? "bg-gradient-to-r from-rose-500 to-teal-500" : ""}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            ))}
          </div>

          {/* Photo Grid */}
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer">
                    <img
                      src={photo.photo_url || PLACEHOLDER_IMAGE}
                      alt="Progress photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <Badge className={getPhotoTypeColor(photo.photo_type)} variant="secondary">
                        {photo.photo_type}
                      </Badge>
                      {photo.skin_condition_rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{photo.skin_condition_rating}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{new Date(photo.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
              <p className="text-gray-600 mb-4">
                {filter === "all" ? "Start taking progress photos to track your journey" : `No ${filter} photos yet`}
              </p>
              <Button className="bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600">
                Take Your First Photo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className={getPhotoTypeColor(selectedPhoto.photo_type)}>{selectedPhoto.photo_type}</Badge>
                  Progress Photo
                </DialogTitle>
                <DialogDescription>
                  Taken on {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedPhoto.photo_url || PLACEHOLDER_IMAGE}
                    alt="Progress photo"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedPhoto.skin_condition_rating && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Skin Condition Rating</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{selectedPhoto.skin_condition_rating}/10</span>
                        {getRatingStars(selectedPhoto.skin_condition_rating)}
                      </div>
                    </div>
                  )}

                  {selectedPhoto.lighting_conditions && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Lighting</h4>
                      <p className="text-gray-600 capitalize">{selectedPhoto.lighting_conditions}</p>
                    </div>
                  )}
                </div>

                {selectedPhoto.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-gray-600">{selectedPhoto.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
