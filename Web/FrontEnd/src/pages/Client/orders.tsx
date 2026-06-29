import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ConfigProvider } from "antd";
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Pagination,
  Select,
  Button,
} from "antd";
import {
  Search,
  Truck,
  CheckCircle,
  Clock,
  Package,
  X,
} from "lucide-react";
import { LeftOutlined, RightOutlined,DownOutlined, UpOutlined, FilterOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";


import OrderCard from "../../components/ordercard";
import OrderDetailsModal from "../../components/modal/orderdetail";
import { type OrderData } from "../../api/orders/my-orders";
import { useOrders } from "../../hooks/useOrders";

const { Title, Text } = Typography;
const { Option } = Select;


export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [minPrice, setMinPrice] = useState<number | string>("");
  const [maxPrice, setMaxPrice] = useState<number | string>("");
  const [filter, setFilter] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const email = localStorage.getItem("email");
  const { pendingOrders, previousOrders } = useOrders(email);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingCardIndex, setPendingCardIndex] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const pageSize = 3;

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

const pendingFilterOrders : OrderData[] = useMemo(() => {
  return pendingOrders.filter((order) => {
    const matchesSearch = searchQuery === "" ||
    order.id_pedido?.toString().toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment =
      paymentFilter === "Todos" ||
      order.tipo_de_pago === paymentFilter;

    const matchesStatus =
      statusFilter === "Todos" ||
      order.estado === statusFilter;

    const matchesdelivery = deliveryTypeFilter === "Todos" || order?.entrega === deliveryTypeFilter;

    const price = order.total;
    const matchesMin = minPrice === "" || price >= Number(minPrice);
    const matchesMax = maxPrice === "" || price <= Number(maxPrice);

    return (
      matchesSearch &&
      matchesPayment &&
      matchesStatus &&
      matchesMin &&
      matchesMax && matchesdelivery
    );
  });
}, [
  pendingOrders,
  deliveryTypeFilter,
  searchQuery,
  paymentFilter,
  statusFilter,
  minPrice,
  maxPrice,
]);


const previousFilterOrders : OrderData[] = useMemo(() => {
    return previousOrders.filter((order) => {
      const matchesSearch = searchQuery === "" ||
      order.id_pedido?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPayment = paymentFilter === "Todos" || order.tipo_de_pago === paymentFilter;
      const matchesStatus = statusFilter === "Todos" || order.estado === statusFilter;
      const matchesdelivery = deliveryTypeFilter === "Todos" || order.entrega === deliveryTypeFilter;
      const price = order.total;
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);

      return matchesSearch && matchesPayment && matchesStatus && matchesMin && matchesMax && matchesdelivery;
    });
  }, [searchQuery, paymentFilter, statusFilter, minPrice, maxPrice,previousOrders,deliveryTypeFilter]);

  useEffect(() => {
    setPendingCardIndex(0);
  }, [pendingFilterOrders.length]);

  const resetFilters = () => {
    setSearchQuery("");
    setPaymentFilter("Todos");
    setDeliveryTypeFilter("Todos");
    setStatusFilter("Todos");
    setMinPrice("");
    setMaxPrice("");
  };

  const paginatedPrevious = previousFilterOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const stats = [
    {
      title: "TOTAL PEDIDOS",
      value: pendingOrders.length + previousOrders.length,
      description: "Historial completo",
      icon: <Package size={24} />,
      bg: "bg-gray-100",
      color: "text-gray-600",
    },
    {
      title: "ENTREGADOS",
      value: previousOrders.filter(o => o.estado === "entregado").length,
      description: "Exitosamente",
      icon: <CheckCircle size={24} />,
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      title: "EN CAMINO",
      value: pendingOrders.filter(o => o.estado === "en_proceso").length,
      description: "Pedidos activos",
      icon: <Truck size={24} />,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      title: "PENDIENTES",
      value: pendingOrders.length,
      description: "Por procesar",
      icon: <Clock size={24} />,
      bg: "bg-yellow-100",
      color: "text-yellow-600",
    },
  ];


  return (
    <ConfigProvider>
    <div style={{ padding: 40, background: "#f7f8fa", minHeight: "100vh" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Mis Pedidos</Title>
          <Text type="secondary">Rastrea el estado de tus compras y consulta tu historial.</Text>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
             <Button 
                className="flex items-center gap-2 rounded-lg border border-[#007eb5] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600 transition-colors"
                style={{
                  backgroundColor: filter ? 'white' : '#007eb5',
                  color: filter ? '#007eb5' : 'white',
                }}
                icon={<FilterOutlined size={16} />} 
                onClick={() => setFilter(!filter)}
              >
                Filtros
                {filter ? <UpOutlined style={{ fontSize: '10px' }} /> : <DownOutlined style={{ fontSize: '10px' }} />}
              </Button>
        </div>
      </div>

      {/* Filtro Avanzado */}
      <AnimatePresence>
      { filter && (
        <Card variant="borderless" style={{ borderRadius: 12, marginBottom: 32 }} className="shadow-sm">
          <Row gutter={[24, 20]}>
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#8c8c8c', fontSize: 12 }}>BUSCAR PEDIDO</Text>
              <Input 
                prefix={<Search size={18} color="#bfbfbf" />} 
                placeholder="Buscar Pedido por ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col xs={12} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#8c8c8c', fontSize: 12 }}>TIPO DE PAGO</Text>
              <Select value={paymentFilter} onChange={setPaymentFilter} style={{ width: '100%' }}>
                <Option value="Todos">Todos</Option>
                <Option value="transferencia_bancaria">Transferencia</Option>
                <Option value="efectivo">Efectivo</Option>
                <Option value="pos">POS</Option>
                <Option value="pay_pal">Paypal</Option>
                <Option value="compra_click">Link de Pago</Option>
              </Select>
            </Col>
            <Col xs={12} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#8c8c8c', fontSize: 12 }}>TIPO DE ENTREGA</Text>
              <Select value={deliveryTypeFilter} onChange={setDeliveryTypeFilter} style={{ width: '100%' }}>
                <Option value="Todos">Todos</Option>
                <Option value="a_domicilio">Domicilio Local</Option>
                <Option value="retiro_en_el_local">Recoger en Tienda</Option>
                <Option value="Fuera de la Ciudad">Fuera de la Ciudad</Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#8c8c8c', fontSize: 12 }}>ESTADO DE ENTREGA</Text>
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }}>
                <Option value="Todos">Todos</Option>
                <Option value="en_proceso">En Proceso</Option>
                <Option value="entregado">Entregado</Option>
                <Option value="pendiente">Pendiente</Option>
                <Option value="cancelado">Cancelado</Option>
                <Option value="pago_pendiente">Pago Pendiente</Option>
                <Option value="devolucion_pendiente">Devolucion Pendiente</Option>
                <Option value="devolucion_aplicada">Devolución Aplicada</Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#8c8c8c', fontSize: 12 }}>RANGO DE VALOR (LPS.)</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Input 
                  placeholder="Min" 
                  type="number" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)} 
                />
                <Text>-</Text>
                <Input 
                  placeholder="Max" 
                  type="number" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)} 
                />
              </div>
            </Col>
            <Col xs={24} style={{ textAlign: 'center', marginTop: 10 }}>
              <Button 
                icon={<X size={16} />} 
                onClick={resetFilters}
                style={{ borderRadius: 8, color: '#007eb5', borderColor: '#007eb5' }}
              >
                Limpiar Filtros
              </Button>
            </Col>
          </Row>
        </Card>
      )}
      </AnimatePresence>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <Row gutter={[16, 16]} className="w-full mb-8">
          {stats.map((stat, index) => (
            <Col key={index} xs={24} sm={12} md={12} lg={6} className="flex">
              <motion.div variants={fadeUp} className="flex-1">
                <Card className="w-full shadow-sm p-4 h-full">
                  <div className="flex items-center gap-4">

                    <div className={`${stat.bg} p-3 rounded-lg ${stat.color}`}>
                        {stat.icon}
                    </div>
          
                    <div>
                      <Text className="text-xs md:text-xs font-semibold uppercase text-gray-500">
                        {stat.title}
                      </Text>
          
                      <div className="text-2xl md:text-3xl font-bold">
                        {stat.value}
                      </div>
          
                      <Text className="text-xs md:text-xs font-bold text-black">
                        {stat.description}
                      </Text>
                    </div>
          
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      <hr className="border-t-2 border-gray-200 my-8" />

      <Title level={4}>Pedidos Actuales</Title>

      <div className="relative mb-12">
        {pendingFilterOrders.length === 0 ? (
          <div className="flex justify-center items-center h-32 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-gray-400">No hay pedidos actuales</p>
          </div>
        ) : isMobile ? (
          <div className="flex flex-col items-center py-4">
            <div className="relative w-full flex items-center justify-center">
              <LeftOutlined
                onClick={() => {
                  if (pendingCardIndex > 0) {
                    setSlideDir(-1);
                    setPendingCardIndex((prev) => prev - 1);
                  }
                }}
                className={`absolute left-0 bg-white shadow-md rounded-full p-2 z-10 ${pendingCardIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`}
              />
              <div className="w-full px-10 overflow-hidden">
                <AnimatePresence mode="wait" custom={slideDir}>
                  <motion.div
                    key={pendingCardIndex}
                    custom={slideDir}
                    initial={{ opacity: 0, x: slideDir === 1 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir === 1 ? 50 : -50 }}
                    transition={{ duration: 0.15 }}
                  >
                    <OrderCard
                      order={pendingFilterOrders[pendingCardIndex]}
                      onClick={() => setSelectedOrder(pendingFilterOrders[pendingCardIndex])}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <RightOutlined
                onClick={() => {
                  if (pendingCardIndex < pendingFilterOrders.length - 1) {
                    setSlideDir(1);
                    setPendingCardIndex((prev) => prev + 1);
                  }
                }}
                className={`absolute right-0 bg-white shadow-md rounded-full p-2 z-10 ${pendingCardIndex === pendingFilterOrders.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`}
              />
            </div>
            <div className="flex gap-1.5 mt-3">
              {pendingFilterOrders.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    if (idx !== pendingCardIndex) {
                      setSlideDir(idx > pendingCardIndex ? 1 : -1);
                      setPendingCardIndex(idx);
                    }
                  }}
                  className={`block rounded-full transition-all duration-200 cursor-pointer ${idx === pendingCardIndex ? 'w-4 h-2 bg-blue-500' : 'w-2 h-2 bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <LeftOutlined
              onClick={() =>
                scrollRef.current?.scrollBy({ left: -350, behavior: "smooth" })
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 cursor-pointer z-10"
            />

            <div
              ref={scrollRef}
              className="flex gap-6 py-4 overflow-x-auto scroll-smooth px-10"
            >
              {pendingFilterOrders.map((order) => (
                <div key={order.id_pedido} className="min-w-[400px] !min-h-[120px]">
                  <OrderCard
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                  />
                </div>
              ))}
            </div>

            <RightOutlined
              onClick={() =>
                scrollRef.current?.scrollBy({ left: 350, behavior: "smooth" })
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 cursor-pointer z-10"
            />
          </>
        )}
      </div>

      <hr className="border-t-2 border-gray-300 my-8" />

      {/* PEDIDOS ANTERIORES */}

      <Title level={4}>Pedidos Anteriores</Title>
        {paginatedPrevious.length > 0 ? (
          <Row gutter={[16, 16]}>
            {paginatedPrevious.map((order: OrderData) => (
              <Col xs={24} sm={12} md={8} key={order.id_pedido}>
                <OrderCard
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="flex w-full justify-center items-center h-32 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-gray-400">No hay pedidos anteriores</p>
          </div>
        )
      }

      <div className="flex justify-center mt-6">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={previousFilterOrders.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>
      {/* MODAL */}
      <OrderDetailsModal order={selectedOrder} isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)}/>
    </div>
    </ConfigProvider>
  );
}