import { Hero } from "./components/Hero";
import { AboutUs } from "./components/AboutUs";
import { ProductShowcase } from "./components/ProductShowcase";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { ExploreCollection } from "./components/ExploreCollection";
import { ProductDetail } from "./components/ProductDetail";
import { CustomizeOrder } from "./components/CustomizeOrder";
import { OrderHistory } from "./components/OrderHistory"; 
import { Header } from "./components/Header";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Cart } from "./components/Cart"; 
import { Checkout } from "./components/Checkout";
import { CartProvider } from "./contexts/CartContext"; 
import { useState } from "react";

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false); 
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleBack = () => setSelectedProduct(null);

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowExplore(true);
  };

  return (
    <AuthProvider>
    <CartProvider>
      <ThemeProvider>
        <div className="bg-white dark:bg-[#053641] transition-colors flex flex-col min-h-screen">

          {/* Header */}
          <Header onOpenCart={() => setShowCart(true)} />

          {/* Cart modal */}
          {showCart && (
            <Cart
              onClose={() => setShowCart(false)}
              onCheckout={() => {
                setShowCart(false);
                setShowCheckout(true);
              }}
              onProductClick={(id: number) => setSelectedProduct(id)}
              onShowOrderHistory={() => {
                setShowCart(false);
                setShowOrderHistory(true);
              }}
            />
          )}

          {/* Checkout modal */}
          {showCheckout && (
            <Checkout
              onBack={() => setShowCheckout(false)}
              onClose={() => setShowCheckout(false)}
            />
          )}

          {/* Order History modal */}
          {showOrderHistory && (
            <OrderHistory onBack={() => setShowOrderHistory(false)} onClose={() => setShowOrderHistory(false)} />
          )}

          {/* ------------------------- PAGE SWITCHING ------------------------- */}
          {showAbout ? (
            <AboutUs onBack={() => setShowAbout(false)} />

          ) : showExplore ? (
            <ExploreCollection
              onBack={() => setShowExplore(false)}
              onCategorySelect={(category) => {
                setSelectedCategory(category);
                setShowExplore(false);
              }}
            />

          ) : showCustomize ? (
            <CustomizeOrder onBack={() => setShowCustomize(false)} />

          ) : selectedProduct !== null ? (
            <ProductDetail
              productId={selectedProduct}
              onBack={handleBack}
              onOpenCart={() => setShowCart(true)}
            />

          ) : selectedCategory ? (
            // Category-selected ProductShowcase page
            <ProductShowcase
              selectedCategory={selectedCategory}
              onProductClick={(productId) => setSelectedProduct(productId)}
              onBackToCategories={handleBackToCategories}
            />

          ) : (
            // Normal Home page
            <>
              <Hero
                onShowAbout={() => setShowAbout(true)}
                onExploreCollection={() => setShowExplore(true)}
              />

              <ProductShowcase
                onProductClick={(productId) => setSelectedProduct(productId)}
                onBackToCategories={() => setShowExplore(true)}
              />
              
              <Features
                onNavigateToCustomize={() => setShowCustomize(true)}
                onExploreCollection={() => setShowExplore(true)}
              />

              <Footer
                onGoAbout={() => setShowAbout(true)}
                onGoProducts={() => setShowCustomize(true)}
                onGoCollections={() => setShowExplore(true)}
              />
            </>
          )}
        </div>
      </ThemeProvider>
    </CartProvider>
    </AuthProvider>
  );
}