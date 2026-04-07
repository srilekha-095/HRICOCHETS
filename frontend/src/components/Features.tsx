
interface FeaturesProps {
  onNavigateToCustomize?: () => void;
  onExploreCollection: () => void;
}

export function Features({ onNavigateToCustomize, onExploreCollection }: FeaturesProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 dark:from-[#053641] dark:to-[#042830] transition-colors relative overflow-hidden">
      
      <svg className="absolute bottom-40 left-20 w-48 h-48 opacity-5" viewBox="0 0 200 200">
        <path d="M 20 100 Q 50 50, 80 100 T 140 100 T 200 100" stroke="#053641" strokeWidth="8" fill="none" className="dark:stroke-white"/>
      </svg>
      
      <div className="container mx-auto relative z-10">

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#053641] via-[#053641] to-[#053641]/90 dark:from-white dark:via-gray-100 dark:to-white p-12 sm:p-16 text-center">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl text-white dark:text-[#053641]">
              Customize Your Order
            </h2>
            <p className="text-lg text-gray-200 dark:text-gray-700">
              Have a unique vision? Let us bring your custom ideas to life with our personalized design service
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={onNavigateToCustomize}
                className="px-8 py-4 bg-white dark:bg-[#053641] text-[#053641] dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#042830] transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Customizing
              </button>
            </div>
          </div>
        </div>

        </div>

        {/* CTA Section */}
        <div className="mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#053641] via-[#053641] to-[#053641]/90 dark:from-white dark:via-gray-100 dark:to-white p-12 sm:p-16 text-center">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl text-white dark:text-[#053641]">
              Ready to Transform Your Space?
            </h2>
            <p className="text-lg text-gray-200 dark:text-gray-700">
              Join our satisfied customers who have elevated their lifestyle with our products
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
              onClick={onExploreCollection}
              className="px-8 py-4 bg-white dark:bg-[#053641] text-[#053641] dark:text-white rounded-full
             hover:bg-gray-100 dark:hover:bg-[#042830]
             transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
             flex items-center justify-center gap-2"
            >
            View Catalog
            </button>

            </div>
          </div>
        </div>
    </section>
  );
}