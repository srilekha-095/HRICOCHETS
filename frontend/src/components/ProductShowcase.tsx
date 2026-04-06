import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useEffect, useRef, useState } from "react";
import { Product } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface ProductShowcaseProps {
  onProductClick: (productId: number) => void;
  selectedCategory?: string;
  onBackToCategories?: () => void;
}

export function ProductShowcase({
  onProductClick,
  selectedCategory,
  onBackToCategories,
}: ProductShowcaseProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setApiError(null);

      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        if (isMounted) setProducts(data);
      } catch (err) {
        console.error("Product fetch error:", err);
        if (isMounted) setApiError("Unable to load products. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products by category if selected
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  // Duplicate filtered products for infinite scroll effect (only if no category selected)
  const displayProducts = selectedCategory
    ? filteredProducts
    : [...filteredProducts, ...filteredProducts];

  useEffect(() => {
    const container = scrollContainerRef.current;
    // Only auto-scroll if no category is selected and there are products
    if (!container || isPaused || selectedCategory || filteredProducts.length === 0) return;

    const scrollSpeed = 1;
    let animationFrameId: number;

    const scroll = () => {
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, filteredProducts.length, selectedCategory]);

  if (isLoading) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#053641] transition-colors">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl text-[#053641] dark:text-white mb-3">Loading products…</h2>
          <p className="text-gray-600 dark:text-gray-300">Please wait a moment.</p>
        </div>
      </section>
    );
  }

  if (apiError) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#053641] transition-colors">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl text-[#053641] dark:text-white mb-3">Unable to load products</h2>
          <p className="text-gray-600 dark:text-gray-300">{apiError}</p>
        </div>
      </section>
    );
  }

  // Show message if no products in category
  if (filteredProducts.length === 0) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#053641] transition-colors">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl text-[#053641] dark:text-white mb-4">
            No Products Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            No products available in this category. Please check back later.
          </p>
          {selectedCategory && onBackToCategories && (
            <button
              onClick={onBackToCategories}
              className="mt-6 px-6 py-3 bg-[#053641] dark:bg-white text-white dark:text-[#053641] rounded-full hover:bg-[#042830] dark:hover:bg-gray-100 transition-colors"
            >
              Categories
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#053641] overflow-hidden transition-colors">
      <div className="container mx-auto">
        {/* Category Header */}
        {selectedCategory && onBackToCategories && (
          <div className="mb-12">
            <button
              onClick={onBackToCategories}
              className="flex items-center gap-2 text-[#053641] dark:text-white hover:text-[#053641]/80 dark:hover:text-white/80 transition-colors group mb-6"
            >
              <svg className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Categories
            </button>
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl text-[#053641] dark:text-white capitalize mb-4">
                {selectedCategory.replace("-", " ")}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"} available
              </p>
            </div>
          </div>
        )}

        <div className="relative">
          {/* Products Grid/Carousel */}
          <div
            ref={scrollContainerRef}
            className={`${
              selectedCategory
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "flex gap-6 overflow-x-hidden scrollbar-hide"
            }`}
            onMouseEnter={() => !selectedCategory && setIsPaused(true)}
            onMouseLeave={() => !selectedCategory && setIsPaused(false)}
          >
            {displayProducts.map((product, index) => {
              const showcaseImage =
                product.images && product.images.length > 0 ? product.images[0] : product.image;

              return (
                <div
                  key={selectedCategory ? product.id : `${product.id}-${index}`}
                  className={selectedCategory ? "" : "flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[350px]"}
                >
                  <div
                    onClick={() => onProductClick(product.id)}
                    className="group relative bg-white dark:bg-[#053641] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer h-full"
                  >
                    {/* Image container */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <ImageWithFallback
                        src={showcaseImage}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-[#053641]/0 group-hover:bg-[#053641]/20 transition-all duration-300 flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-6 py-3 border-2 border-white rounded-full font-medium">
                          View Details
                        </span>
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-[#053641] dark:text-white text-xl font-semibold mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-2xl font-bold text-[#053641] dark:text-white">
                          {product.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}
