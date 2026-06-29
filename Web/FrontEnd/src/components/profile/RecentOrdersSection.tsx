import { GiftOutlined, RightOutlined } from "@ant-design/icons";
import type { RecentOrder } from "./types";

interface RecentOrdersSectionProps {
  orders: RecentOrder[];
  onSeeAll: () => void;
}

export default function RecentOrdersSection({ orders, onSeeAll }: RecentOrdersSectionProps) {
  if (!orders.length) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xl md:text-2xl text-[#1a1a1a] font-medium">Pedidos Recientes</h2>
          <button onClick={onSeeAll} className="text-[#027EB1] text-xs md:text-base font-medium flex items-center gap-1 shrink-0">
            Ver Todos <RightOutlined />
          </button>
        </div>
        <article className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center">
          <p className="text-[#6B7280] text-sm md:text-base">No tienes pedidos recientes.</p>
        </article>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-xl md:text-2xl text-[#1a1a1a] font-medium">Pedidos Recientes</h2>
        <button onClick={onSeeAll} className="text-[#027EB1] text-xs md:text-base font-medium flex items-center gap-1 shrink-0">
          Ver Todos <RightOutlined />
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#027EB1] grid place-items-center">
                  <GiftOutlined />
                </div>
                <div>
                  <p className="text-base md:text-lg text-[#1A1A1A]">{order.id || "Pedido sin código"}</p>
                  <p className="text-sm text-[#6B7280]">
                    {order.date ? new Date(order.date).toLocaleDateString() : "Fecha no disponible"}
                  </p>
                </div>
              </div>
              {order.delivered && (
                <span className="rounded-full border border-[#B9F8CF] bg-[#F0FDF4] text-[#00A63E] px-3 md:px-4 py-1 text-xs md:text-sm font-bold">
                  Entregado
                </span>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex items-center justify-between gap-3">
              <p className="text-[#6B7280] text-sm md:text-base">{order.items || "Sin artículos"}</p>
              <p className="text-[#1A1A1A] text-base md:text-xl text-right">{order.total || "Total no disponible"}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
