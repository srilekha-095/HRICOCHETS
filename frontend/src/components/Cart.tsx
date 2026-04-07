import { useState, useEffect, useRef } from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, History } from "lucide-react";
import { useCart } from "../contexts/CartContext";

interface CartProps {
  onClose: () => void;
  onCheckout: () => void;
  onProductClick: (id: number) => void;
  onShowOrderHistory?: () => void;
}

export function Cart({
  onClose,
  onCheckout,
  onProductClick,
  onShowOrderHistory,
}: CartProps) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
  } = useCart();

  const [removingItem, setRemovingItem] = useState<number | null>(null);

  // Lock body scroll when cart is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Capture wheel events so scrolling works reliably inside modal
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      const atTop = el.scrollTop === 0 && delta < 0;
      const atBottom =
        Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 1 &&
        delta > 0;

      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleRemove = (id: number) => {
    setRemovingItem(id);
    setTimeout(() => {
      removeFromCart(id);
      setRemovingItem(null);
    }, 300);
  };

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const total = getCartTotal();

  const hasPricedItems = cart.some((item) => {
    const isCustom =
      item.name === "Custom Order Request" ||
      item.name.includes("Custom") ||
      (item as any).customDetails ||
      (item as any).isCustomOrder;

    return !isCustom && item.price > 0;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
      {/* Modal */}
      <div className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#042830] flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-[#053641] dark:text-white" />
            <h2 className="text-2xl text-[#053641] dark:text-white font-normal">
              Your Cart ({getCartCount()})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#053641] rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Scrollable Items */}
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Cart items"
          className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar"
        >
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-lg font-normal">
                Your cart is empty
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const isCustomOrder =
                  item.name === "Custom Order Request" ||
                  item.name.includes("Custom");

                return (
                  <div
                    key={`${item.id}-${item.color}-${item.size}`}
                    className={`flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#053641] transition-all ${
                      removingItem === item.id ? "opacity-0 scale-95" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-[#053641] dark:text-white font-normal">
                            {item.name}
                          </h3>
                          <div className="flex gap-2 text-xs text-gray-500 mt-1 font-normal">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#053641] dark:text-white font-normal">
                            {!isCustomOrder
                              ? `Rs.${(
                                  item.price * item.quantity
                                ).toFixed(2)}`
                              : "Price TBD"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                          <span className="w-8 text-center font-normal text-[#053641] dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — ALWAYS rendered */}
        <div className="sticky bottom-0 z-30 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-[#042830] rounded-b-3xl">
          
          {cart.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-normal text-[#053641] dark:text-white">
                  Total
                </span>
                <span className="text-2xl font-normal text-[#053641] dark:text-white">
                  {hasPricedItems ? `Rs.${total.toFixed(2)}` : "—"}
                </span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-4 rounded-full font-normal hover:shadow-lg transition-all mb-3"
              >
                Proceed to Checkout
              </button>
            </>
          )}

          {onShowOrderHistory && (
            <button
              onClick={onShowOrderHistory}
              className="w-full border-2 border-[#053641] dark:border-white text-[#053641] dark:text-white py-3 rounded-full hover:bg-[#053641]/5 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-normal"
            >
              <History className="h-4 w-4" />
              View Order History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
