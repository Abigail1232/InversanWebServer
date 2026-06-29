import { useState, useEffect } from "react";
import {
  incrementProduct,
  deleteProduct,
  getCart,
  type CartResponse,
  decrementProduct,
  CART_UPDATED_EVENT,
} from "../api/cart/cart";
import type { Product } from "../api/cart/cart";
import { usePreventDuplicate } from "./usePreventDuplicateRequest";

export function useCart() {
  const [cartProducts, setCartProducts] = useState<CartResponse>({
    cart: {
      branch: 0,
      products: [],
    },
    exist: false,
  });

  const cart = async (): Promise<void> => {
    const response = await getCart();
    response.cart.products = response.cart.products.map((item: Product) => ({
      ...item,
    }));
    setCartProducts(response);
  };

  useEffect(() => {
    cart();
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      cart();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    };
  }, []);

  const performRemoveProduct = async (id: number): Promise<void> => {
    const success = await deleteProduct(id);
    if (success) cart();
  };

  const { execute: removeProduct } = usePreventDuplicate(performRemoveProduct);

  const performIncreaseQuantity = async (
    id: number,
    newAmount: number,
  ): Promise<void> => {
    const success = await incrementProduct(
      cartProducts.cart.branch,
      id,
      newAmount,
    );
    if (success) cart();
  };

  const { execute: increaseQuantity } = usePreventDuplicate(performIncreaseQuantity);

  const performDecreaseQuantity = async (
    id: number,
    newAmount: number,
  ): Promise<void> => {
    const success = await decrementProduct(
      cartProducts.cart.branch,
      id,
      newAmount,
    );
    if (success) cart();
  };

  const { execute: decreaseQuantity } = usePreventDuplicate(performDecreaseQuantity);

  const totalConDescuento = Math.round(cartProducts.cart.products.reduce(
    (acc, item) => acc + (item.precio_mas_bajo * item.amount),
    0
  ) * 100) / 100;

  const descuentoTotal = Math.round(cartProducts.cart.products.reduce(
    (acc, item) => {
      const precioSinDesc = (item.precio_original || 0) * item.amount;
      const precioConDesc = item.precio_mas_bajo * item.amount;
      const descuentoItem = precioSinDesc - precioConDesc;
      return acc + (descuentoItem > 0 ? descuentoItem : 0);
    },
    0
  ) * 100) / 100;

  const subtotal = Math.round((totalConDescuento / 1.15) * 100) / 100;
  const total = totalConDescuento;
  const tax = Math.round((total - subtotal) * 100) / 100;

  return {
    cartProducts,
    removeProduct,
    increaseQuantity,
    decreaseQuantity,
    subtotal,
    total,
    tax,
    descuentoTotal,
    cart
  };
}
