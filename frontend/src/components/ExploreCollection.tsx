import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCategories, Category } from "@/data/categories";

interface ExploreCollectionProps {
  onBack: () => void;
  onCategorySelect: (category: string) => void;
}

export function ExploreCollection({ onBack, onCategorySelect }: ExploreCollectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchCategories()
      .then((data) => {
        if (isMounted) setCategories(data);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        if (isMounted) setApiError("Unable to load categories.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen dark:from-[#042830] dark:via-[#053641] dark:to-[#064156] dark:bg-gradient-to-br pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-16 pt-12">
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 text-[#053641] dark:text-white hover:text-[#053641]/80 dark:hover:text-white/80 transition-all group"
          >
            <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg font-semibold">Home</span>
          </button>

          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-light text-[#053641] dark:text-white tracking-tight mb-4">
              Explore
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Browse our collections
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="text-center text-gray-600 dark:text-gray-300">
            Loading categories…
          </div>
        )}

        {apiError && (
          <div className="text-center text-red-600 dark:text-red-400">
            {apiError}
          </div>
        )}

        {!isLoading && !apiError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className="group cursor-pointer transform transition-all duration-500 hover:scale-105"
              >
                <div className="relative rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden h-64 transition-all duration-500 group-hover:shadow-2xl">
                  <div
                    className="absolute inset-0 opacity-30 group-hover:opacity-100 transition-opacity duration-500 dark:!bg-[#042830]"
                    style={{ backgroundColor: "#A4FFC2" }}
                  />
                  <div
                    className="absolute inset-0 border-2 rounded-3xl pointer-events-none"
                    style={{ borderColor: "#A4FFC2" }}
                  />
                  <div className="relative h-full flex flex-col items-center justify-center p-8 text-center z-10">
                    <h3 className="text-2xl font-semibold text-[#053641] dark:text-white mb-4 group-hover:text-white transition-colors duration-300">
                      {cat.name}
                    </h3>
                    <p className="text-lg font-medium text-[#053641] dark:text-gray-300 group-hover:text-white/90 transition-colors duration-300">
                      {cat.count}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
