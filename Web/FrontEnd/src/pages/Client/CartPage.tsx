import { Typography } from "antd";
import { Button } from "../../components/Button";
import CartItem from "../../components/CartItem";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartProducts,
    removeProduct,
    increaseQuantity,
    decreaseQuantity,
    subtotal,
    total,
    tax,
    descuentoTotal,
  } = useCart();

  return (
    <div className="w-full bg-[#f3f4f6] min-h-screen py-6">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-6 animate-page-enter">
        <Typography.Title level={2} style={{ marginBottom: 0 }}>
          Carrito de Compras
        </Typography.Title>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ───────── PRODUCTOS ───────── */}
          <div className="flex-1 flex flex-col gap-4 animate-page-enter-delay-1">
            {cartProducts.cart.products.length === 0 && (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-sm animate-page-enter-delay-2">
                Tu carrito está vacío
              </div>
            )}

            {cartProducts.cart.products.map((item, i) => (
              <CartItem
                key={item.id_producto}
                item={item}
                index={i}
                onRemove={removeProduct}
                onIncreaseQuantity={increaseQuantity}
                onDecreaseQuantity={decreaseQuantity}
              />
            ))}

            <button
              onClick={() => navigate("/")}
              className="text-[#027EB1] text-sm font-medium mt-2"
            >
              ← Continuar Comprando
            </button>
          </div>

          {/* ───────── RESUMEN ───────── */}
          <div className="w-full lg:w-[350px] animate-page-enter-delay-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
              <Typography.Title level={4} style={{ marginBottom: 16 }}>
                Resumen de Compra
              </Typography.Title>

              <div className="flex justify-between text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>
                  Lps{" "}
                  {subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {descuentoTotal > 0 && (
                <div className="flex justify-between font-medium mb-2" style={{ color: "#9ca3af" }}>
                  <span>Descuento</span>
                  <span>
                    -Lps{" "}
                    {descuentoTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 mb-4">
                <span>ISV (15%)</span>
                <span>
                  Lps{" "}
                  {tax.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span className="text-[#027EB1]">
                  Lps{" "}
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <Button
                variant="primary"
                fullWidth
                disabled={cartProducts.cart.products.length === 0}
                onClick={() => navigate("/checkout")}
                className="!h-12 !rounded-xl"
              >
                Realizar Compra
              </Button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {cartProducts.cart.products.length} productos en el carrito
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
