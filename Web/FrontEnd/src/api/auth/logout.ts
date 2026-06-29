import axios from "../axios";
import { safeLocalStorage } from "../../utils/storage";
import { clearAllLocalCarts } from "../cart/cart";

export async function logout(): Promise<boolean> {
  try {
    const response = await axios.post("/api/auth/logout");
    if (response.status === 200) {
      safeLocalStorage.removeItem("token");
      clearAllLocalCarts();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

