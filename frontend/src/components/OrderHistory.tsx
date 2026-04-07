import React, { useState, useEffect, useRef } from "react";
import { X, Package, MapPin, Calendar, AlertCircle, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

interface OrderHistoryProps {
  onBack: () => void;
  onClose: () => void;
}

export function OrderHistory({ onBack, onClose }: OrderHistoryProps) {
  const { orders, cancelOrder, fetchOrders } = useCart();
  const { isAuthenticated } = useAuth();
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        await fetchOrders();
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [isAuthenticated, fetchOrders]);

  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    try {
      el.focus();
    } catch {}

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      const atTop = el.scrollTop === 0 && delta < 0;
      const atBottom = Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 1 && delta > 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        setCancellingOrder(orderId);
        await cancelOrder(orderId);
        alert("Order cancelled successfully!");
      } catch (error) {
        console.error("Failed to cancel order:", error);
        alert("Failed to cancel order. Please try again.");
      } finally {
        setCancellingOrder(null);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-gray-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl text-[#053641] mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please login to view your order history.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-[#053641] text-white py-3 rounded-full hover:bg-[#042830] transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] my-4 mx-auto flex flex-col border border-gray-200 overflow-hidden">

        {/* Header — fixed, never scrolls */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 rounded-t-3xl bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-[#053641]" />
            <h2 className="text-2xl text-[#053641]">
              Order History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div
          id="order-history-scroll"
          ref={listRef}
          tabIndex={0}
          role="region"
          aria-label="Order history list"
          className="
            flex-1 min-h-0 overflow-y-auto p-6
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-[#053641]/40
            [&::-webkit-scrollbar-thumb:hover]:bg-[#053641]/70
          "
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(5,54,65,0.4) rgba(0,0,0,0.06)',
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#053641] mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Package className="h-20 w-20 text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg mb-2">No orders yet</p>
              <p className="text-gray-500 text-sm mb-6">Your order history will appear here</p>
              <button
                onClick={onBack}
                className="bg-[#053641] text-white px-6 py-3 rounded-full hover:bg-[#042830] transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-6 rounded-2xl border-2 ${
                    order.status === "cancelled"
                      ? "bg-gray-50 border-gray-300 opacity-75"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg text-[#053641] font-mono">
                          #{order.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === "pending"
                              ? "bg-[#C6E7FF] text-[#053641]"
                              : order.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="text-2xl text-[#053641]">
                        {order.items.some(item => item.name.startsWith("Custom:"))
                          ? "To be confirmed"
                          : `Rs.${order.total.toFixed(2)}`}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">Items:</p>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#053641] font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            Qty: {item.quantity}
                            {item.color && ` • Color: ${item.color}`}
                            {item.size && ` • Size: ${item.size}`}
                          </p>
                        </div>
                        <span className="text-sm text-[#053641] flex-shrink-0">
                          {item.name.startsWith("Custom:")
                            ? "To be discussed"
                            : `Rs.${(item.price * item.quantity).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.items.some(item => item.name.startsWith("Custom:")) && (
                    <div className="bg-[#FFE5CC]/30 rounded px-3 py-2 mb-4">
                      <p className="text-xs text-[#053641]">
                        ℹ️ Custom order pricing will be discussed after confirmation
                      </p>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-[#053641]" />
                      <p className="text-sm text-[#053641] font-medium">Shipping Address</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {order.shippingAddress.fullName}<br />
                      {order.shippingAddress.addressLine1}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                      Phone: {order.shippingAddress.phone}
                    </p>
                  </div>

                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrder === order.id}
                      aria-label="Cancel order"
                      title="Cancel order"
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#053641] text-white rounded-xl hover:bg-[#042830] shadow-md transition-colors ${
                        cancellingOrder === order.id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {cancellingOrder === order.id ? (
                        <span className="block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-white" />
                      )}
                      <span>{cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                    </button>
                  )}

                  {order.status === "cancelled" && (
                    <div className="bg-gray-100 rounded-xl p-3 text-center">
                      <p className="text-sm text-gray-600">
                        This order has been cancelled
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}