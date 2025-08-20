"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useVendor } from "@/hooks/use-vendor"
import { getProduct, updateProduct } from "@/lib/firebase-products"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import CloudinaryUploadWidget from "@/components/cloudinary-upload-widget"

interface ProductFormData {
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  displayCategory: string
  inStock: boolean
  images: string[]
  cloudinaryImages: Array<{ url: string; publicId: string }>
  tags: string[]
  origin: string
  weight?: string
  dimensions?: string
  discount?: number
}

// Use centralized categories (exclude 'all')
import { MAIN_CATEGORIES } from "@/lib/categories"
const categories = MAIN_CATEGORIES.filter(c => c.id !== 'all').map(c => c.id)

const origins = [
  "nigeria",
  "ghana", 
  "kenya",
  "south-africa",
  "cameroon",
  "senegal",
  "international"
]

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { vendor, loading: vendorLoading } = useVendor()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [product, setProduct] = useState<ProductFormData | null>(null)

  const productId = params.id as string

  useEffect(() => {
    if (!vendorLoading && !vendor) {
      router.push("/vendor/register")
      return
    }

    if (vendor && productId) {
      loadProduct()
    }
  }, [vendor, vendorLoading, productId])

  const loadProduct = async () => {
    try {
      setIsLoading(true)
      const productData = await getProduct(productId)
      
      if (!productData) {
        toast({
          title: "Product not found",
          description: "The product you're trying to edit doesn't exist.",
          variant: "destructive"
        })
        router.push("/vendor/dashboard/products")
        return
      }

      // Check if this product belongs to the current vendor (allow legacy products without vendorId)
      if (productData.vendorId && productData.vendorId !== vendor?.id) {
        toast({
          title: "Access denied",
          description: "You can only edit your own products.",
          variant: "destructive"
        })
        router.push("/vendor/dashboard/products")
        return
      }

      setProduct({
        name: productData.name || "",
        description: productData.description || "",
        price: productData.price || 0,
        originalPrice: productData.originalPrice,
        category: productData.category || "",
        displayCategory: productData.displayCategory || "",
        inStock: productData.inStock !== false,
        images: productData.images || [],
        cloudinaryImages: productData.cloudinaryImages || [],
        tags: productData.tags || [],
        origin: productData.origin || "nigeria",
        weight: productData.weight,
        dimensions: productData.dimensions,
        discount: productData.discount
      })
    } catch (error) {
      console.error("Error loading product:", error)
      toast({
        title: "Error loading product",
        description: "Failed to load product data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !vendor) return

    setIsSaving(true)
    try {
      await updateProduct(productId, {
        ...product,
        vendorId: vendor.id,
        vendorName: vendor.shopName,
        updatedAt: new Date()
      })

      toast({
        title: "Product updated",
        description: "Your product has been successfully updated."
      })

      router.push("/vendor/dashboard/products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error updating product",
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = (publicId: string, url: string) => {
    if (!product) return
    
    setProduct({
      ...product,
      cloudinaryImages: [...product.cloudinaryImages, { url, publicId }],
      images: [...product.images, url]
    })
  }

  const removeImage = (index: number) => {
    if (!product) return
    
    setProduct({
      ...product,
      cloudinaryImages: product.cloudinaryImages.filter((_, i) => i !== index),
      images: product.images.filter((_, i) => i !== index)
    })
  }

  if (vendorLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p>Product not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/vendor/dashboard/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-gray-600">Update your product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={product.category}
                      onValueChange={(value) => setProduct({ ...product, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="displayCategory">Display Category</Label>
                    <Input
                      id="displayCategory"
                      value={product.displayCategory}
                      onChange={(e) => setProduct({ ...product, displayCategory: e.target.value })}
                      placeholder="Custom category name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="origin">Origin</Label>
                  <Select
                    value={product.origin}
                    onValueChange={(value) => setProduct({ ...product, origin: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {origins.map((origin) => (
                        <SelectItem key={origin} value={origin}>
                          {origin.charAt(0).toUpperCase() + origin.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₦) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="originalPrice">Original Price (₦)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={product.originalPrice || ""}
                      onChange={(e) => setProduct({ ...product, originalPrice: parseFloat(e.target.value) || undefined })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={product.discount || ""}
                    onChange={(e) => setProduct({ ...product, discount: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CloudinaryUploadWidget
                    onUploadSuccess={handleImageUpload}
                    multiple={true}
                  />
                  
                  {product.cloudinaryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {product.cloudinaryImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={img.url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={product.inStock}
                    onCheckedChange={(checked) => setProduct({ ...product, inStock: !!checked })}
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={product.weight || ""}
                    onChange={(e) => setProduct({ ...product, weight: e.target.value })}
                    placeholder="e.g., 500g, 1kg"
                  />
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={product.dimensions || ""}
                    onChange={(e) => setProduct({ ...product, dimensions: e.target.value })}
                    placeholder="e.g., 10x5x3 cm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                  
                  <Link href="/vendor/dashboard/products">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}