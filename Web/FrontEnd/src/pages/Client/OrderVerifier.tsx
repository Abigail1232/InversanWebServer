import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { getGuestOrder } from "../../api/orders/guest-order";

export default function OrderVerifier() {
  const { numeroPedido } = useParams<{ numeroPedido: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyOrder = async () => {
      if (!numeroPedido) {
        navigate("/");
        return;
      }

      try {
        // Obtener información del pedido para verificar si el usuario tiene cuenta
        const orderData = await getGuestOrder(numeroPedido);
        
        // Verificar si el cliente tiene cuenta registrada
        if (orderData.data.cliente.tiene_cuenta) {
          // Usuario con cuenta -> redirigir a /orders
          navigate("/orders");
        } else {
          // Usuario sin cuenta -> redirigir a GuestOrderView
          navigate(`/pedido/${numeroPedido}`);
        }
      } catch (error) {
        console.error("Error al verificar pedido:", error);
        // Si hay error, redirigir a la vista de invitado por defecto
        navigate(`/pedido/${numeroPedido}`);
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [numeroPedido, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <p className="text-gray-500">Verificando tu pedido...</p>
        </div>
      </div>
    );
  }

  return null; // El componente redirige inmediatamente
}
