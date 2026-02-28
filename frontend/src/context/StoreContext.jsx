import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const axiosInstance = axios.create({
  baseURL: "https://food-back-three.vercel.app",
});

const StoreContextProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [foodList, setFoodList] = useState([]);

  // Attach token automatically
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axiosInstance.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  // ----------------------------
  // Add To Cart
  // ----------------------------
  const addToCart = async (itemId) => {
    try {
      setCartItems((prev) => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1,
      }));

      if (token) {
        const { data } = await axiosInstance.post("/api/cart/add", {
          itemId,
        });

        if (!data.success) throw new Error();
      }
    } catch (error) {
      toast.error("Failed to add item");
      console.error(error);
    }
  };

  // ----------------------------
  // Remove From Cart
  // ----------------------------
  const removeFromCart = async (itemId) => {
    try {
      setCartItems((prev) => {
        const updated = { ...prev };
        if (!updated[itemId]) return prev;

        updated[itemId] = Math.max(updated[itemId] - 1, 0);
        if (updated[itemId] === 0) delete updated[itemId];

        return updated;
      });

      if (token) {
        const { data } = await axiosInstance.post("/api/cart/remove", {
          itemId,
        });

        if (!data.success) throw new Error();
      }
    } catch (error) {
      toast.error("Failed to remove item");
      console.error(error);
    }
  };

  // ----------------------------
  // Calculate Total
  // ----------------------------
  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [id, qty]) => {
      const item = foodList.find((product) => product._id === id);
      if (!item) return total;
      return total + item.price * qty;
    }, 0);
  };

  // ----------------------------
  // Fetch Food List
  // ----------------------------
  const fetchFoodList = async () => {
    try {
      const { data } = await axiosInstance.get("/api/food/list");
      if (data.success) {
        setFoodList(data.data);
      }
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    }
  };

  // ----------------------------
  // Load Cart From Backend
  // ----------------------------
  const loadCartData = async () => {
    try {
      const { data } = await axiosInstance.post("/api/cart/get");
      if (data.success) {
        setCartItems(data.cartData || {});
      }
    } catch (error) {
      console.error("Cart load failed", error);
    }
  };

  // ----------------------------
  // Initial Load
  // ----------------------------
  useEffect(() => {
    const init = async () => {
      await fetchFoodList();
      if (token) {
        await loadCartData();
      }
    };
    init();
  }, []);

  const contextValue = {
    foodList,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    token,
    setToken,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;