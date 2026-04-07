import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import { Product } from "../types/product";
import { useCart } from "../contexts/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onOpenCart: () => void;
}

export function ProductDetail({ productId, onBack, onOpenCart }: ProductDetailProps) {
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setApiError(null);

      try {
        const res = await fetch(`${API_URL}/api/products/${productId}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        if (isMounted) setProduct(data);
      } catch (err) {
        console.error("Product fetch error:", err);
        if (isMounted) setApiError("Unable to load product. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId]);

  const galleryImages = useMemo(
    () => (product?.images && product.images.length > 0 ? product.images : [product?.image || ""]),
    [product?.id, product?.images, product?.image]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#053641] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-[#053641] dark:text-white">Loading product…</h2>
        </div>
      </div>
    );
  }

  if (apiError || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#053641] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-[#053641] dark:text-white">Product not found</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{apiError || "Please try again."}</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-3 bg-[#053641] dark:bg-white text-white dark:text-[#053641] rounded-full"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  const handlePrevImage = () => {
    setSelectedImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((current) => (current + 1) % galleryImages.length);
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      price: Number(product.price.toString().replace(/[^0-9]/g, "")),
      quantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#053641] transition-colors pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="max-w-4xl mx-auto mb-12 relative pt-12">
        <button
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 text-[#053641] dark:text-white hover:opacity-80 transition-all"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="text-lg font-semibold">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image */}
          <div className="space-y-6">
            <div className="relative max-w-md mx-auto">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 dark:bg-[#042830] border border-gray-200 dark:border-gray-700">
                <ImageWithFallback
                  src={galleryImages[selectedImageIndex] ?? product.image}
                  alt={`${product.name} ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-[#053641] shadow-md hover:bg-white transition-colors flex items-center justify-center"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-[#053641] shadow-md hover:bg-white transition-colors flex items-center justify-center"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      selectedImageIndex === index
                        ? "bg-[#053641] dark:bg-white scale-110"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl text-[#053641] dark:text-white">{product.name}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{product.details}</p>
            </div>

            {/* Price */}
            <div className="py-6 border-y border-gray-200 dark:border-gray-700">
              <span className="text-5xl text-[#053641] dark:text-white">{product.price}</span>
            </div>

            {/* Specifications */}
            <div className="space-y-4 p-6 bg-gray-50 dark:bg-[#042830] rounded-2xl">
              <h3 className="text-xl text-[#053641] dark:text-white">Specifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-300">Dimensions</span>
                  <span className="text-[#053641] dark:text-white">{product.dimensions}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-300">Customizable</span>
                  <span className="text-[#053641] dark:text-white">
                    {product.customizable ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[#053641] dark:text-white">Quantity:</span>
                <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-[#053641] dark:text-white"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-[#053641] dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-[#053641] dark:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleAddToCart}
                className="w-full bg-[#053641] dark:bg-white hover:bg-[#053641]/90 dark:hover:bg-gray-100 text-white dark:text-[#053641] px-8 py-6 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                {addedToCart ? (
                  <>
                    <Check className="h-5 w-5" /> Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" /> Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
