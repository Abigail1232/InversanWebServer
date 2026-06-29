import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { message, Spin, Switch } from "antd";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import type { Design, DesignProduct } from "./DesignManagement";
import {
  getProductosPorDiseno,
  type ProductoPorDiseno,
} from "../../api/admin/disenos";

interface DesignProductsViewProps {
  design: Design;
  onBack: () => void;
}

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

const buildAssetUrl = (value?: string | null) => {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE}/assets/${encodeURIComponent(value)}`;
};

const mapProductToView = (product: ProductoPorDiseno): DesignProduct => {
  return {
    id: product.id ?? product.id_producto,
    name: product.name ?? product.nombre,
    image: buildAssetUrl(product.image ?? product.imagen_url ?? ""),
    brand: product.brand ?? product.marca ?? "",
    design: product.design ?? product.diseno ?? "",
    medida: product.medida ?? "",
    price: Number(product.price ?? product.precio ?? 0),
    status:
      product.status === "Activo" || product.estado === true
        ? "Activo"
        : "Inactivo",
  };
};

export default function DesignProductsView({
  design,
  onBack,
}: DesignProductsViewProps) {
  const [products, setProducts] = useState<DesignProduct[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los Estados");
  const [measureFilter, setMeasureFilter] = useState("Todas las Medidas");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await getProductosPorDiseno(design.id_diseno);
      const mappedProducts = response.data.map(mapProductToView);

      setProducts(mappedProducts);
    } catch (error: any) {
      console.error("Error cargando productos por diseño:", error);
      message.error(
        error?.response?.data?.message ||
          "Error cargando productos del diseño"
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [design.id_diseno]);

  const measureOptions = useMemo(() => {
    const uniqueMeasures = Array.from(
      new Set(products.map((product) => product.medida).filter(Boolean))
    );

    return ["Todas las Medidas", ...uniqueMeasures];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "Todos los Estados" ||
        product.status === statusFilter;

      const matchesMeasure =
        measureFilter === "Todas las Medidas" ||
        product.medida === measureFilter;

      return matchesSearch && matchesStatus && matchesMeasure;
    });
  }, [products, search, statusFilter, measureFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, measureFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const activeProducts = filteredProducts.filter(
    (product) => product.status === "Activo"
  ).length;

  const columns: DataTableColumn<DesignProduct>[] = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3 justify-start w-full">
          <div className="w-12 h-12 rounded-[10px] bg-white border border-[#e5e7eb] overflow-hidden flex items-center justify-center shrink-0">
            <ImageWithFallback
              src={record.image}
              alt={record.name}
              className="w-full h-full object-contain p-1"
            />
          </div>

          <span className="block truncate text-left">{record.name}</span>
        </div>
      ),
    },
    {
      title: "Marca",
      dataIndex: "brand",
      key: "brand",
      ellipsis: true,
    },
    {
      title: "Diseño",
      dataIndex: "design",
      key: "design",
      ellipsis: true,
    },
    {
      title: "Medida",
      dataIndex: "medida",
      key: "medida",
      ellipsis: true,
    },
    {
      title: "Precio",
      dataIndex: "price",
      key: "price",
      render: (value) =>
        `Lps. ${Number(value ?? 0).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Switch
          checked={Boolean(value === "Activo")}
          style={{
            backgroundColor: value === "Activo" ? "#16A34A" : "#D1D5DB",
            transform: "scale(0.8)",
            pointerEvents: "none",
          }}
        />
      ),
    },
  ];

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen">
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="w-full max-w-[1270px] mx-auto px-6 py-4 md:py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#027eb1] hover:text-[#026a96] transition-colors mb-4 font-['Arimo'] text-[14px] font-medium"
          >
            <ArrowLeft className="size-5" />
            Volver a diseños
          </button>

          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[88px] md:w-[82px] md:h-[112px] rounded-[16px] bg-white shadow-sm flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              <ImageWithFallback
                src={design.imagen_url}
                alt={design.nombre}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="font-['Arimo'] font-bold text-[24px] md:text-[32px] text-[#003e7b]">
                Productos {design.nombre}
              </h1>

              <p className="font-['Arimo'] text-[13px] md:text-[15px] text-[#4a5565] tracking-[-0.2344px]">
                {activeProducts} productos activos de {filteredProducts.length}{" "}
                totales
              </p>

              <p className="font-['Arimo'] text-[12px] md:text-[13px] text-[#6b7280]">
                Marca: {design.marca.nombre}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row p-6 mx-6 mt-5 gap-3 md:items-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Buscar producto por nombre...",
          }}
          filters={[
            {
              placeholder: "Filtrar por Estado",
              value: statusFilter || undefined,
              onChange: (value) =>
                setStatusFilter((value as string) || "Todos los Estados"),
              options: ["Todos los Estados", "Activo", "Inactivo"].map(
                (status) => ({
                  label: status,
                  value: status,
                })
              ),
            },
            {
              placeholder: "Filtrar por Medida",
              value: measureFilter || undefined,
              onChange: (value) =>
                setMeasureFilter((value as string) || "Todas las Medidas"),
              options: measureOptions.map((measure) => ({
                label: measure,
                value: measure,
              })),
            },
          ]}
          onClear={() => {
            setSearch("");
            setStatusFilter("Todos los Estados");
            setMeasureFilter("Todas las Medidas");
          }}
        />
      </div>

      <div className="w-full max-w-[1270px] mx-auto px-6 pb-8">
        {loading ? (
          <div className="mt-5 bg-white border border-slate-200 rounded-2xl py-12 px-6 text-center shadow-sm">
            <Spin size="large" />
            <p className="font-['Arimo'] text-[14px] text-[#6b7280] mt-4">
              Cargando productos...
            </p>
          </div>
        ) : (
          <>
            <DataTable<DesignProduct>
              rowKey="id"
              columns={columns}
              dataSource={paginatedProducts}
              pagination={{
                current: currentPage,
                pageSize,
                total: filteredProducts.length,
                onChange: (page) => setCurrentPage(page),
              }}
              showSummary={true}
              className="hidden md:block mt-2 rounded-2xl"
            />

            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="md:hidden mt-5 flex flex-col gap-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative"
              >
                <img
                  src={product.image}
                  className="absolute top-3 right-3 w-16 h-16 object-contain rounded-lg"
                  alt={product.name}
                />

                <div className="flex items-start justify-between gap-3 pr-20">
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {product.name}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      {product.brand}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-500">Diseño</div>
                  <div className="text-slate-700 text-right">
                    {product.design}
                  </div>

                  <div className="text-slate-500">Medida</div>
                  <div className="text-slate-700 text-right">
                    {product.medida}
                  </div>

                  <div className="text-slate-500">Precio</div>
                  <div className="text-slate-700 text-right">
                    Lps. {product.price.toFixed(2)}
                  </div>

                  <div className="text-slate-500">Estado</div>
                  <div className="text-right">
                    <Switch
                      checked={Boolean(product.status === "Activo")}
                      style={{
                        backgroundColor:
                          product.status === "Activo" ? "#16A34A" : "#D1D5DB",
                        transform: "scale(0.8)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="mt-5 bg-white border border-slate-200 rounded-2xl py-12 px-6 text-center shadow-sm">
                <h2 className="font-['Arimo'] text-[18px] font-bold text-[#1e2939]">
                  No hay productos para mostrar
                </h2>

                <p className="font-['Arimo'] text-[14px] text-[#6b7280] mt-1">
                  Este diseño todavía no tiene productos relacionados o los
                  filtros no coinciden.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}