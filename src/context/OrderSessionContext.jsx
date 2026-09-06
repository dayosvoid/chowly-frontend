
import { createContext, useContext, useState } from "react";

const OrderSessionContext = createContext(null);

export function OrderSessionProvider({ children }) {
  const [session, setSession] = useState({
    restaurantId: null,
    restaurantName: "",
    tableNumber: "",
    customerName: "",
  });
  const [cart, setCart] = useState({}); // { [menuItemId]: quantity }
  const [menuItemsById, setMenuItemsById] = useState({}); // cache for price/name lookups

  const startSession = ({ restaurantId, restaurantName, tableNumber, customerName }) => {
    setSession({ restaurantId, restaurantName, tableNumber, customerName });
  };

  const registerMenuItems = (items) => {
    const map = {};
    items.forEach((item) => {
      map[item.id || item._id] = item;
    });
    setMenuItemsById((prev) => ({ ...prev, ...map }));
  };

  const addToCart = (menuItemId) => {
    setCart((prev) => ({ ...prev, [menuItemId]: (prev[menuItemId] || 0) + 1 }));
  };

  const updateCartQuantity = (menuItemId, quantity) => {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[menuItemId];
      } else {
        next[menuItemId] = quantity;
      }
      return next;
    });
  };

  const clearCart = () => setCart({});

  const cartItems = Object.entries(cart).map(([menuItemId, quantity]) => ({
    menuItemId,
    quantity,
    menuItem: menuItemsById[menuItemId],
  }));

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.menuItem?.price || 0) * item.quantity,
    0
  );

  return (
    <OrderSessionContext.Provider
      value={{
        session,
        startSession,
        registerMenuItems,
        cart,
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        updateCartQuantity,
        clearCart,
      }}
    >
      {children}
    </OrderSessionContext.Provider>
  );
}

export function useOrderSession() {
  const context = useContext(OrderSessionContext);
  if (!context) {
    throw new Error("useOrderSession must be used within an OrderSessionProvider");
  }
  return context;
}