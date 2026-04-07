import React, { useState, useEffect } from "react";
import { ArrowLeft, MapPin, CreditCard, Check, X } from "lucide-react";
import { useCart, type ShippingAddress } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

interface CheckoutProps {
  onBack: () => void;
  onClose: () => void;
}

export function Checkout({ onBack, onClose }: CheckoutProps) {
  const { cart, getCartTotal, savedAddress, createOrder, clearCart } = useCart();
  const { isAuthenticated, token, user } = useAuth();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    addressLine1: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  // Check if user is logged in
  useEffect(() => {
    if (!isAuthenticated) {
      setErrorMessage("Please login to checkout");
      setShowErrorPopup(true);
    }
  }, [isAuthenticated]);

  // Autofill with user-specific saved address
  useEffect(() => {
    if (!user) return;

    // Get user-specific saved address from localStorage
    const userSavedAddressKey = `savedAddress_${user.email || user.id}`;
    const userSavedAddressStr = localStorage.getItem(userSavedAddressKey);
    
    if (userSavedAddressStr) {
      try {
        const userSavedAddress = JSON.parse(userSavedAddressStr);
        setShippingAddress(userSavedAddress);
      } catch (error) {
        console.error("Error parsing saved address:", error);
        // Fallback to user profile info
        setShippingAddress(prev => ({
          ...prev,
          fullName: user.name || "",
          phone: user.phone || "",
        }));
      }
    } else if (savedAddress) {
      // Fallback to savedAddress from context (but this should also be user-specific)
      setShippingAddress(savedAddress);
    } else {
      // Pre-fill name and phone from user profile if available
      setShippingAddress(prev => ({
        ...prev,
        fullName: user.name || "",
        phone: user.phone || "",
      }));
    }
  }, [user, savedAddress]);

  const shippingCost = cart.some(item => item.name.startsWith("Custom:")) ? 0 : 10;
  const total = getCartTotal() + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!isAuthenticated || !token) {
      setErrorMessage("Please login to place an order");
      setShowErrorPopup(true);
      return;
    }

    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      // Validate form
      if (!shippingAddress.fullName || !shippingAddress.addressLine1 || 
          !shippingAddress.city || !shippingAddress.state || 
          !shippingAddress.zipCode || !shippingAddress.phone) {
        setErrorMessage("Please fill in all required fields");
        setShowErrorPopup(true);
        setIsSubmitting(false);
        return;
      }

      // Save address to user-specific localStorage
      if (user) {
        const userSavedAddressKey = `savedAddress_${user.email || user.id}`;
        localStorage.setItem(userSavedAddressKey, JSON.stringify(shippingAddress));
      }

      // Create order via API
      const response = await createOrder(shippingAddress);
      
      if (response && response.success) {
        setOrderId(response.order.id);
        setOrderPlaced(true);
      } else {
        throw new Error('Order creation failed');
      }
      
    } catch (error: any) {
      console.error("Error placing order:", error);
      setErrorMessage(error.message || "There was an error placing your order. Please try again.");
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueShopping = () => {
    clearCart();
    onClose();
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl text-[#053641] dark:text-white mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please login to continue with checkout.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-3 rounded-full hover:bg-[#042830] dark:hover:bg-gray-100 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-20 h-20 bg-[#A3FFC2] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-[#053641]" />
          </div>

          <h2 className="text-3xl text-[#053641] dark:text-white mb-4">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Thank you for your order!
          </p>
          <p className="text-lg text-[#053641] dark:text-white mb-6">
            Order ID: <span className="font-mono">{orderId}</span>
          </p>

          <div className="bg-[#C6E7FF]/20 dark:bg-[#053641]/40 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We've sent confirmation emails to you and started processing your order. 
              You can track your order status in the Order History section.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueShopping}
              className="w-full bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-3 rounded-full hover:bg-[#042830] dark:hover:bg-gray-100 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 text-center">
          <h2 className="text-2xl text-[#053641] dark:text-white mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Add some items to your cart before checking out.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-3 rounded-full hover:bg-[#042830] dark:hover:bg-gray-100 transition-all"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  // Check if address was autofilled
  const hasAutofilled = user && localStorage.getItem(`savedAddress_${user.email || user.id}`);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl w-full max-w-4xl my-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#053641] rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-2xl text-[#053641] dark:text-white">
            Checkout
          </h2>
          {user && (
            <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              Logged in as: {user.name}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-[#053641] dark:text-white" />
                <h3 className="text-xl text-[#053641] dark:text-white">
                  Shipping Address
                </h3>
              </div>

              {hasAutofilled && (
                <div className="bg-[#A3FFC2]/20 dark:bg-[#053641]/40 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  ✓ Address autofilled from your previous order
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm text-[#053641] dark:text-white mb-2">
                    Full Name <span className="text-[#FF92C4]">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label htmlFor="addressLine1" className="block text-sm text-[#053641] dark:text-white mb-2">
                    Address Line <span className="text-[#FF92C4]">*</span>
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    required
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
                    placeholder="Street address, P.O. box"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm text-[#053641] dark:text-white mb-2">
                      City <span className="text-[#FF92C4]">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm text-[#053641] dark:text-white mb-2">
                      State <span className="text-[#FF92C4]">*</span>
                    </label>
                    <input
                      id="state"
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm text-[#053641] dark:text-white mb-2">
                      ZIP Code <span className="text-[#FF92C4]">*</span>
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      required
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
                      placeholder="ZIP"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm text-[#053641] dark:text-white mb-2">
                      Phone <span className="text-[#FF92C4]">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-[#053641] dark:text-white" />
                <h3 className="text-xl text-[#053641] dark:text-white">
                  Payment Information
                </h3>
              </div>

              <div className="bg-[#C6E7FF]/20 dark:bg-[#053641]/40 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">You will be contacted once the order is confirmed.</p>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 h-fit flex flex-col">
            <div className="bg-[#C6E7FF]/20 dark:bg-[#053641]/40 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300">
              <h3 className="text-xl text-[#053641] dark:text-white mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.color}-${item.size}`} className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-[#053641] dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm text-[#053641] dark:text-white">
                      {item.name.startsWith("Custom:") 
                        ? "To be discussed" 
                        : `Rs.${(item.price * item.quantity).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-[#053641] dark:text-white">Rs.{getCartTotal().toFixed(2)}</span>
                </div>
                {cart.some(item => item.name.startsWith("Custom:")) && (
                  <div className="bg-[#FFE5CC]/30 dark:bg-[#053641]/60 rounded px-2 py-1">
                    <p className="text-xs text-[#053641] dark:text-[#A3FFC2]">
                      ℹ️ Custom order pricing will be discussed after confirmation
                    </p>
                  </div>
                )}
                {!cart.some(item => item.name.startsWith("Custom:")) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="text-[#053641] dark:text-white">Rs.{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-lg text-[#053641] dark:text-white">Total</span>
                  <span className="text-xl text-[#053641] dark:text-white">
                    {cart.some(item => item.name.startsWith("Custom:")) 
                      ? "To be confirmed" 
                      : `Rs.${total.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-6 bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-4 rounded-full hover:bg-[#042830] dark:hover:bg-gray-100 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-[#053641] p-6 rounded-2xl w-80 shadow-xl text-center">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowErrorPopup(false)}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-800 dark:text-white text-lg font-medium mb-4">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorPopup(false)}
              className="bg-[#053641] dark:bg-white text-white dark:text-[#053641] px-6 py-2 rounded-xl hover:opacity-80 transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}