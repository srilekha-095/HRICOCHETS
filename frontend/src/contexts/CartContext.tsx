import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/* =========================
   Types
========================= */
export interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  total: number;
  date: string;
  status: string;
}

interface CartContextType {
  cart: CartItem[];
  savedAddress: ShippingAddress | null;
  orders: Order[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  createOrder: (address: ShippingAddress) => Promise<any>;
  cancelOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  clearCart: () => void;
  fetchOrders: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/* =========================
   Helper: Get user ID from token
========================= */
function getUserIdFromToken(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    // Decode JWT to get user ID (assuming JWT format)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id || payload.sub || null;
  } catch {
    return null;
  }
}

/* =========================
   Provider
========================= */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Prevent request storms
  const isFetchingOrders = useRef(false);

  /* ---------- Watch for token changes and update currentUserId ---------- */
  useEffect(() => {
    const checkTokenChange = () => {
      const userId = getUserIdFromToken();
      setCurrentUserId(userId);
    };

    // Check immediately
    checkTokenChange();

    // Check every 500ms for token changes (catches logout and login)
    const interval = setInterval(checkTokenChange, 500);

    return () => clearInterval(interval);
  }, []);

  /* ---------- Track user changes ---------- */
  useEffect(() => {
    const userId = getUserIdFromToken();
    
    // If user changed, clear current state and load new user's data
    if (userId !== currentUserId) {
      setCurrentUserId(userId);
      
      if (userId) {
        // Load cart for this user
        const savedCart = localStorage.getItem(`cart_${userId}`);
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch {
            localStorage.removeItem(`cart_${userId}`);
            setCart([]);
          }
        } else {
          setCart([]);
        }

        // Load address for this user
        const savedAddr = localStorage.getItem(`shippingAddress_${userId}`);
        if (savedAddr) {
          try {
            setSavedAddress(JSON.parse(savedAddr));
          } catch {
            localStorage.removeItem(`shippingAddress_${userId}`);
            setSavedAddress(null);
          }
        } else {
          setSavedAddress(null);
        }
      } else {
        // No user logged in, clear everything
        setCart([]);
        setSavedAddress(null);
        setOrders([]);
      }
    }
  }, [currentUserId]);

  /* ---------- Persist cart for current user ---------- */
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`cart_${currentUserId}`, JSON.stringify(cart));
    }
  }, [cart, currentUserId]);

  /* ---------- Persist address for current user ---------- */
  useEffect(() => {
    if (currentUserId && savedAddress) {
      localStorage.setItem(`shippingAddress_${currentUserId}`, JSON.stringify(savedAddress));
    }
  }, [savedAddress, currentUserId]);

  /* =========================
     Cart helpers
  ========================= */
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (p) => p.id === item.id && p.color === item.color && p.size === item.size
      );
      if (existing) {
        return prev.map((p) =>
          p.id === item.id && p.color === item.color && p.size === item.size
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(quantity, 1) } : item
      )
    );
  };

  const getCartTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getCartCount = () =>
    cart.reduce((sum, item) => sum + item.quantity, 0);

  /* =========================
     Orders
  ========================= */
  const fetchOrders = useCallback(async () => {
    if (isFetchingOrders.current) return;
    isFetchingOrders.current = true;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setOrders([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
      isFetchingOrders.current = false;
    }
  }, []);

  const createOrder = async (address: ShippingAddress) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");

      // Save address for this user
      setSavedAddress(address);

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart,
          shippingAddress: address,
          total: getCartTotal() + 10,
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const data = await response.json();
      await fetchOrders();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");

      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error("Failed to cancel order");

      // Update local state after successful API call
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      if (status === "cancelled") {
        await cancelOrder(orderId);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");

      const response = await fetch(`${API_URL}/api/orders/${orderId}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update order status");

      // Update local state after successful API call
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  };

  const clearCart = () => {
    setCart([]);
    if (currentUserId) {
      localStorage.removeItem(`cart_${currentUserId}`);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        savedAddress,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartCount,
        createOrder,
        cancelOrder,
        updateOrderStatus,
        clearCart,
        fetchOrders,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================
   Hook
========================= */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
