"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ShoppingCart, ChevronRight, Eye, Heart, Store } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import { Dialog } from "@/components/ui/dialog"
import { useWishlist, type WishlistItem } from "@/hooks/use-wishlist"
import { getVendor, type Vendor } from "@/lib/firebase-vendors"

interface ProductShowcaseProps {
  category?: string;
  title?: string;
  subtitle?: string;
}

export default function ProductShowcase({ 
  category = "Beverages", 
  title = "Popular Products", 
  subtitle = "Authentic products from around the world" 
}: ProductShowcaseProps) {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load products for the category
  useEffect(() => {
    const loadCategoryProducts = async () => {
      try {
        setLoading(true)
        // Import the getProducts function
        const { getProducts } = await import("@/lib/firebase-products")
        
        // Map showcase categories to database categories
        const categoryMap: Record<string, string> = {
          "Beverages": "drinks",
          "Food": "food", 
          "Spices": "spices",
          "Flour": "flour",
          "Vegetables & Fruits": "vegetables",
          "Meat & Fish": "meat"
        }
        
        const dbCategory = categoryMap[category] || category.toLowerCase()
        
        // Get products from Firebase
        const { products: allProducts } = await getProducts({ category: dbCategory }, 8)
        
        setProducts(allProducts.filter(p => p.inStock))
        console.log(`${category} products loaded:`, allProducts.length)
      } catch (error) {
        console.error(`Error loading ${category} products:`, error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    loadCategoryProducts()
  }, [category])

  // Fetch vendor information for products
  useEffect(() => {
    const fetchVendors = async () => {
      const vendorIds = [...new Set(products.filter(p => p.vendorId).map(p => p.vendorId!))]
      const vendorPromises = vendorIds.map(async (vendorId) => {
        try {
          const vendor = await getVendor(vendorId)
          return { vendorId, vendor }
        } catch (error) {
          console.error(`Error fetching vendor ${vendorId}:`, error)
          return { vendorId, vendor: null }
        }
      })
      
      const vendorResults = await Promise.all(vendorPromises)
      const vendorMap: Record<string, Vendor> = {}
      
      vendorResults.forEach(({ vendorId, vendor }) => {
        if (vendor) {
          vendorMap[vendorId] = vendor
        }
      })
      
      setVendors(vendorMap)
    }

    if (products.length > 0) {
      fetchVendors()
    }
  }, [products])

  // Get a URL-friendly category name for the "View All" link
  const mapCategoryToShopCategory = (showcaseCategory: string): string => {
    const categoryMap: Record<string, string> = {
      "Beverages": "drinks",
      "Food": "food",
      "Spices": "spices",
      "Flour": "flour",
      "Vegetables & Fruits": "vegetables",
      "Meat & Fish": "meat"
    };
    return categoryMap[showcaseCategory] || "all";
  };

  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  };

  const handleQuickView = (product: any, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setQuickViewProduct(product);
  };

  const handleToggleWishlist = (product: any, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    const wishlistItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.subtitle || category
    };
    
    toggleWishlist(wishlistItem);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "/product_images/unknown-product.jpg";
  };

  return (
    <section className="my-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-gray-600">{subtitle}</p>
        </div>
        <Link 
          href={`/shop?category=${mapCategoryToShopCategory(category)}`} 
          className="mt-2 md:mt-0 flex items-center text-green-600 hover:text-green-700 font-medium"
        >
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <Card 
              key={product.id}
              className="overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group"
              onMouseEnter={() => setHoveredProductId(product.id)}
              onMouseLeave={() => setHoveredProductId(null)}
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Link href={`/products/${product.id}`}>
                  <Image
                    src={product.images?.[0] || "/placeholder.jpg"}
                    alt={product.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    onError={handleImageError}
                  />
                </Link>
                
                {product.discount && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-red-500 hover:bg-red-600">
                      -{product.discount}% OFF
                    </Badge>
                  </div>
                )}
                
                {/* Wishlist button */}
                <div className="absolute top-2 right-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 hover:text-rose-500"
                    onClick={(e) => handleToggleWishlist(product, e)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </Button>
                </div>
                
                {/* Hover actions */}
                <div className={`absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center gap-2 transition-opacity duration-300 ${hoveredProductId === product.id ? 'opacity-100' : 'opacity-0'}`}>
                  <button 
                    onClick={(e) => handleQuickView(product, e)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={(e) => handleAddToCart(product, e)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-medium text-lg hover:text-green-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {product.category}
                </p>
                
                {/* Vendor Information */}
                {product.vendorId && vendors[product.vendorId] && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {vendors[product.vendorId].logoUrl ? (
                        <Image
                          src={vendors[product.vendorId].logoUrl}
                          alt={vendors[product.vendorId].shopName}
                          width={16}
                          height={16}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Store className="h-4 w-4 text-gray-400" />
                      )}
                      <Link 
                        href={`/vendor/${product.vendorId}`}
                        className="text-xs text-gray-600 hover:text-green-600 transition-colors font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {vendors[product.vendorId].shopName}
                      </Link>
                    </div>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      Vendor
                    </Badge>
                  </div>
                )}
                
                {product.rating && (
                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating) 
                              ? "text-amber-400 fill-amber-400" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                )}
                
                <div className="mt-2">
                  {product.discount ? (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">
                        {formatCurrency(product.price * (1 - product.discount / 100))}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12 border border-dashed border-gray-200 rounded-lg">
          No products available in this category at the moment.
        </div>
      )}

      {/* Quick View Modal */}
      <Dialog open={quickViewProduct !== null} onOpenChange={(isOpen) => !isOpen && setQuickViewProduct(null)}>
        {/* Modal content */}
      </Dialog>
    </section>
  )
}

