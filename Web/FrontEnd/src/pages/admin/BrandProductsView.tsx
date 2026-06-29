import { ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { useEffect, useMemo, useState } from "react";
import {
  getProductosPorMarca,
  type ProductoPorMarca,
} from "../../api/products/marcas";
import { Switch } from "antd";

interface Product {
  id: number;
  name: string;
  image: string;
  brand: string;
  model: string;
  medida: string;
  price: number;
  status: "Activo" | "Inactivo";
}

interface Brand {
  id: number;
  name: string;
  logo: string;
  productCount: number;
}

interface BrandProductsViewProps {
  brand: Brand;
  onBack: () => void;
}


export default function BrandProductsView({
  brand,
  onBack,
}: BrandProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los Estados");
  const [modelFilter, setModelFilter] = useState("Todos los Modelos");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProductosPorMarca(brand.id);

        const mappedProducts: Product[] = data.map((p: ProductoPorMarca) => ({
          id: p.id_producto,
          name: p.nombre,
          image: buildAssetUrl(p.imagen_url ?? ""),
          brand: brand.name,
          model:
            p.version && p.version.trim() !== "" ? p.version : "Sin versión",
          medida: Number(p.alto_rin) === 0
            ? `${p.ancho_rin ?? ""} R ${p.rin ?? ""}`
            : `${p.ancho_rin ?? ""}/${p.alto_rin ?? ""} R ${p.rin ?? ""}`,
          price: Number(p.precio_detalle ?? 0),
          status: p.estado ? "Activo" : "Inactivo",
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Error cargando productos por marca:", error);
        setProducts([]);
      }
    };

    loadProducts();
  }, [brand.id, brand.name]);

  const modelOptions = useMemo(() => {
    const uniqueModels = Array.from(
      new Set(products.map((p) => p.model).filter(Boolean))
    );
    return ["Todos los Modelos", ...uniqueModels];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "Todos los Estados" || product.status === statusFilter;

      const matchesModel =
        modelFilter === "Todos los Modelos" || product.model === modelFilter;

      return matchesSearch && matchesStatus && matchesModel;
    });
  }, [products, search, statusFilter, modelFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, modelFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const activeProducts = filteredProducts.filter(
    (p: Product) => p.status === "Activo"
  ).length;

  const columns: DataTableColumn<Product>[] = [
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
      title: "Modelo",
      dataIndex: "model",
      key: "model",
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
      render: (value) => <Switch
      checked={Boolean(value === "Activo")}
      style={{ backgroundColor: value === "Activo" ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)", pointerEvents: "none" }}

      />,
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
            Volver a marcas
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border-2 border-[#e5e7eb]">
              <ImageWithFallback
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-contain p-3"
              />
            </div>
            <div>
              <h1 className="font-['Arimo'] font-bold text-[24px] md:text-[32px] text-[#003e7b]">
                Productos {brand.name}
              </h1>
              <p className="font-['Arimo'] text-[13px] md:text-[15px] text-[#4a5565] tracking-[-0.2344px]">
                {activeProducts} productos activos de {filteredProducts.length}{" "}
                totales
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row p-6 mx-6 mt-5 gap-3 md:items-center bg-white rounded-2xl shadow-sm border border-slate-200 ">
        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Buscar sucursal por nombre, ubicación, encargado...",
          }}
          filters={[
            {
              placeholder: "Filtrar por Estado",
              value: statusFilter || undefined,
              onChange: (v) => setStatusFilter((v as any) || ""),
              options: ["Todos los Estados", "Activo", "Inactivo"].map((s) => ({ label: s, value: s })),
            },
            {
              placeholder: "Filtar por Modelo",
              value: modelFilter || undefined,
              onChange: (v) => setModelFilter((v as any) || ""),
              options: modelOptions.map((s) => ({label: s, value: s}))
            }
          ]}
          onClear={() => (setStatusFilter(""))}
          />
      </div>
      <div className="w-full max-w-[1270px] mx-auto px-6 pb-8">
        {/*
          Vista Escritorio: Tabla
          */}
        <DataTable<Product>
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
        {/*
          Vista Movil: Tarjetas
          */}
        {filteredProducts.map((p) => (

          <div key={p.id} className="md:hidden mt-5 flex flex-col gap-3    bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative">
            <img
              src={p.image}
              className="absolute top-3 right-3 w-16 h-16 object-contain rounded-lg"
            />
            <div className="flex items-start justify-between gap-3 pr-20">
              <div>
                <div className="text-sm font-bold text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-500 mt-1">{p.brand}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">Modelo</div>
              <div className="text-slate-700 text-right">{p.model}</div>

              <div className="text-slate-500">Medida</div>
              <div className="text-slate-700 text-right">{p.medida}</div>

              <div className="text-slate-500">Precio</div>
              <div className="text-slate-700 text-right">Lps. {p.price.toFixed(2)}</div>

              <div className="text-slate-500">Estado</div>
              <div className="text-right">
              <Switch
              checked={Boolean(p.status === "Activo")}
              style={{ backgroundColor: p.status === "Activo" ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)", pointerEvents: "none" }}

              />
              </div>
            </div>
          </div>
        )) }
      </div>
    </div>
  );
}
