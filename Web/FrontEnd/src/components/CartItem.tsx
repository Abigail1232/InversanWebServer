import { DeleteOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import type { Product } from "../api/cart/cart";

interface CartItemProps {
  item: Product;
  index: number;
  onRemove: (id: number) => void;
  onIncreaseQuantity: (id: number, amount: number) => void;
  onDecreaseQuantity: (id: number, amount: number) => void;
}

export default function CartItem({
  item,
  index,
  onRemove,
  onIncreaseQuantity,
  onDecreaseQuantity,
}: CartItemProps) {
  return (
    <div
      key={item.id_producto}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-6 animate-card-enter"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Imagen */}
      <div className="w-40 h-40 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
        {item.producto_imagen[0]?.imagen_url ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/public/${
              item.producto_imagen[0].imagen_url
            }`}
            alt={item.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">Imagen</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-[#027EB1] font-bold text-lg">
            {item.marca.nombre}
          </h3>
          <p className="text-gray-700 text-sm font-medium">
            {item.nombre}
          </p>

          <button
            onClick={() => onRemove(item.id_producto)}
            className="text-red-500 text-sm flex items-center gap-1 mt-2 hover:underline"
          >
            <DeleteOutlined />
            Eliminar
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3">
          {/* Cantidad */}
          <div className="flex items-stretch border rounded-lg overflow-hidden w-24 sm:w-28">
            <button
              onClick={() => onDecreaseQuantity(item.id_producto, 1)}
              className="flex-1 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              <MinusOutlined />
            </button>

            <span className="w-8 h-8 flex items-center justify-center text-center">{item.amount}</span>

            <button
              onClick={() => onIncreaseQuantity(item.id_producto, 1)}
              className="flex-1 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              <PlusOutlined />
            </button>
          </div>

          {/* Precio dinámico */}
          <span className="text-lg font-semibold text-gray-800 sm:text-right">
            Lps{" "}
            {(Math.round(item.precio_mas_bajo * item.amount * 100) / 100).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
