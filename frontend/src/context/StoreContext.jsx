import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

// Create axios instance
const api = axios.create({
  baseURLs: [
  "https://food-back-three.vercel.app",
  "https://food-back-5ste54i61-yashrawat0947s-projects.vercel.app"
],
  timeout: 10000,
});

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [food_list, setFoodList] = useState([]);

  /* ============================
     Add To Cart
  ============================ */
  const addToCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    if (!token) return;

    try {
      const response = await api.post(
        "/api/cart/add",
        { itemId },
        { headers: { token } }
      );

      if (!response.data.success) {
        toast.error("Failed to add item");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Server error");
    }
  };

  /* ============================
     Remove From Cart
  ============================ */
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 1) - 1, 0),
    }));

    if (!token) return;

    try {
      const response = await api.post(
        "/api/cart/remove",
        { itemId },
        { headers: { token } }
      );

      if (!response.data.success) {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      console.error("Remove cart error:", error);
      toast.error("Server error");
    }
  };

  /* ============================
     Get Total Cart Amount
  ============================ */
  const getTotalCartAmount = () => {
    let totalAmount = 0;

    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = food_list.find(
          (product) => product._id === item
        );

        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }

    return totalAmount;
  };

  /* ============================
     Fetch Food List
  ============================ */
  const fetchFoodList = async () => {
    try {
      const response = await api.get("/api/food/list");

      if (response.data.success) {
        setFoodList(response.data.data);
      } else {
        toast.error("Products not loading");
      }
    } catch (error) {
      console.error("Food list error:", error);
      toast.error("Backend connection failed");
    }
  };

  /* ============================
     Load Cart Data
  ============================ */
  const loadCartData = async (authToken) => {
    try {
      const response = await api.post(
        "/api/cart/get",
        {},
        { headers: { token: authToken } }
      );

      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      }
    } catch (error) {
      console.error("Load cart error:", error);
    }
  };

  /* ============================
     Initial Load
  ============================ */
  useEffect(() => {
    const loadData = async () => {
      await fetchFoodList();

      if (token) {
        await loadCartData(token);
      }
    };

    loadData();
  }, []);

  const contextValue = {
    food_list,
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
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;