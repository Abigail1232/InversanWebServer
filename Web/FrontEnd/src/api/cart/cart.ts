import axios from "../axios";
import { safeLocalStorage } from "../../utils/storage";

const CART_URL: string = "/api/cart";
export const CART_UPDATED_EVENT = "cartUpdated";

const dispatchCartUpdated = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

// ─── Multi-branch cart token helpers ─────────────────────────────────────────

const CART_TOKEN_PREFIX = "cart_token_";

/** Returns the stored cart JWT for a given branch, or null */
export function getCartTokenForBranch(branchId: number): string | null {
  if (!branchId) return null;
  return safeLocalStorage.getItem(`${CART_TOKEN_PREFIX}${branchId}`);
}

/** Persists a cart JWT for a given branch */
function saveCartTokenForBranch(branchId: number, token: string): void {
  if (!branchId || !token) return;
  safeLocalStorage.setItem(`${CART_TOKEN_PREFIX}${branchId}`, token);
}

/** Removes the stored cart JWT for a given branch */
export function clearCartTokenForBranch(branchId: number): void {
  if (!branchId) return;
  safeLocalStorage.removeItem(`${CART_TOKEN_PREFIX}${branchId}`);
}

/** Reads the active branch from localStorage */
function getActiveBranch(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem("selectedBranch");
  return val ? Number(val) : 0;
}

/**
 * Returns the query parameters for a branch if a stored token exists.
 * This tells the backend which cart to use when the cookie doesn't match.
 */
function cartParams(branchId: number): Record<string, string | number> {
  const token = getCartTokenForBranch(branchId);
  if (!token) return { id_branch: branchId };
  return { cartToken: token, id_branch: branchId };
}

/** Persists the token returned by the backend for a given branch */
function persistToken(branchId: number, data: unknown): void {
  if (
    branchId &&
    data &&
    typeof data === "object" &&
    "cartToken" in data &&
    typeof (data as { cartToken: unknown }).cartToken === "string"
  ) {
    saveCartTokenForBranch(branchId, (data as { cartToken: string }).cartToken);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductoImagen = {
  imagen_url: string;
};

type Marca = {
  nombre: string;
};

export type Product = {
  id_producto: number;
  nombre: string;
  lonas: number;
  rin: number;
  profundidad: number;
  indice_de_carga: number;
  presion_maxima: number;
  indice_velocidad: number;
  estado: boolean;
  precio_detalle: number;
  precio_mayoreo: number;
  precio_coste: number;
  descripcion: string;
  id_marca: number;
  marca: Marca;
  precio_mas_bajo: number;
  precio_original: number;
  descuento_aplicado: number;
  tipo_descuento: string;
  id_categoria: number;
  producto_imagen: ProductoImagen[];
  amount: number;
};

export type Cart = {
  branch: number;
  products: Product[];
};

export type CartResponse = {
  cart: Cart;
  exist: boolean;
};

// ─── Cart API functions ───────────────────────────────────────────────────────

async function addToCart(id_branch: number, product_id: number, amount: number): Promise<boolean> {
  try {
    const response = await axios.post(
      CART_URL,
      { id_branch, product_id, amount },
      { params: cartParams(id_branch) },
    );
    if (response.status !== 200) return false;
    persistToken(id_branch, response.data);
    dispatchCartUpdated();
    return true;
  } catch (error) {
    return false;
  }
}

async function incrementProduct(id_branch: number, product_id: number, amount: number): Promise<boolean> {
  try {
    const response = await axios.post(
      `${CART_URL}/increment`,
      { id_branch, product_id, amount },
      { params: cartParams(id_branch) },
    );
    if (response.status !== 200) return false;
    persistToken(id_branch, response.data);
    dispatchCartUpdated();
    return true;
  } catch (error) {
    return false;
  }
}

async function getCart(): Promise<CartResponse> {
  try {
    const branchId = getActiveBranch();
    const response = await axios.get(CART_URL, {
      params: cartParams(branchId),
    });

    const cartData = response.data as CartResponse;
    if (cartData?.cart && cartData.cart.branch !== branchId) {
      // Backend returned a cart from an old cookie because we didn't send a token
      // We must ignore it and return an empty cart for the current branch
      return { cart: { branch: branchId, products: [] }, exist: false };
    }

    // Almacenar el token rescatado para asegurar que los carritos existentes 
    // se migren correctamente al multi-branch en el frontend.
    persistToken(branchId, response.data);

    return cartData;
  } catch (error) {
    const branchId = getActiveBranch();
    return { cart: { branch: branchId, products: [] }, exist: false };
  }
}

async function deleteProduct(id: number): Promise<boolean> {
  try {
    const branchId = getActiveBranch();
    const response = await axios.delete(`${CART_URL}/product/${id}`, {
      params: cartParams(branchId),
    });
    if (response.status !== 200) return false;
    persistToken(branchId, response.data);
    dispatchCartUpdated();
    return true;
  } catch (error) {
    return false;
  }
}

async function deleteCart(id_branch?: number): Promise<boolean> {
  try {
    const branchId = id_branch ?? getActiveBranch();
    const response = await axios.delete(CART_URL, {
      params: { id_branch, ...cartParams(branchId) },
    });
    if (response.status !== 200) return false;
    if (branchId) clearCartTokenForBranch(branchId);
    dispatchCartUpdated();
    return true;
  } catch (error) {
    return false;
  }
}

async function decrementProduct(id_branch: number, product_id: number, amount: number): Promise<boolean> {
  try {
    const response = await axios.post(
      `${CART_URL}/decrement`,
      { id_branch, product_id, amount },
      { params: cartParams(id_branch) },
    );
    if (response.status !== 200) return false;
    persistToken(id_branch, response.data);
    dispatchCartUpdated();
    return true;
  } catch (error) {
    return false;
  }
}

function clearAllLocalCarts(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CART_TOKEN_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => safeLocalStorage.removeItem(k));
  dispatchCartUpdated();
}

async function syncCarts(): Promise<boolean> {
  try {
    const tokens: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CART_TOKEN_PREFIX)) {
        const branchIdStr = key.replace(CART_TOKEN_PREFIX, "");
        tokens[branchIdStr] = safeLocalStorage.getItem(key) || "";
      }
    }

    if (Object.keys(tokens).length === 0) return true;

    const response = await axios.post(`${CART_URL}/sync`, { tokens });
    if (response.status === 200) {
      for (const branchIdStr of Object.keys(tokens)) {
        safeLocalStorage.removeItem(`${CART_TOKEN_PREFIX}${branchIdStr}`);
      }
      dispatchCartUpdated();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export {
  addToCart,
  incrementProduct,
  getCart,
  deleteProduct,
  deleteCart,
  decrementProduct,
  syncCarts,
  clearAllLocalCarts,
};