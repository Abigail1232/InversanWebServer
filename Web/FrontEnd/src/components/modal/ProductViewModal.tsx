import { useState, useEffect, createElement } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Info } from "lucide-react";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export default function ProductViewModal({
  isOpen,
  onClose,
  product,
}: ProductViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modal3DOpen, setModal3DOpen] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);
  const [model3DExists, setModel3DExists] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const model3DUrl = product?.modelo3D?.url || null;

  const getProductImages = (marca: string) => {
    const imageMap: { [key: string]: string[] } = {
      Toyota: [
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
      ],
      Michelin: [
        "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=600",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
      ],
      Goodyear: [
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=600",
      ],
      Continental: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
      ],
      Bridgestone: [
        "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=600",
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
      ],
      Pirelli: [
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
      ],
      Yokohama: [
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
        "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=600",
      ],
      Firestone: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
      ],
      Hankook: [
        "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=600",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
      ],
      Dunlop: [
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
      ],
      BFGoodrich: [
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=600",
      ],
      Kumho: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
      ],
    };

    return (
      imageMap[marca] || [
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
      ]
    );
  };

  useEffect(() => {
    setCurrentImageIndex(0);
    setModal3DOpen(false);
  }, [product, isOpen]);

  useEffect(() => {
    const checkModel3DExists = async () => {
      if (!model3DUrl) {
        setModel3DExists(false);
        return;
      }

      try {
        const fullUrl = model3DUrl.startsWith("http")
          ? model3DUrl
          : `${apiBaseUrl}/public/${model3DUrl.replace(/^\/+/, "")}`;

        const response = await fetch(fullUrl, { method: "HEAD" });
        setModel3DExists(response.ok);
      } catch (error) {
        console.log("Error verificando modelo 3D:", error);
        setModel3DExists(false);
      }
    };

    checkModel3DExists();
  }, [model3DUrl, apiBaseUrl]);

  useEffect(() => {
    if (!modal3DOpen || !model3DUrl) {
      setModelViewerReady(false);
      return;
    }

    import("@google/model-viewer").then(() => setModelViewerReady(true));
  }, [modal3DOpen, model3DUrl]);

  if (!isOpen || !product) return null;

  const images =
    product.imagenes && product.imagenes.length > 0
      ? product.imagenes.map((img: any) => {
          const urlStr = img.url || "";
          if (urlStr.startsWith("http")) return urlStr;
          const cleanUrl = urlStr.replace(/^\/+/, "").replace(/^public\//, "");
          return `${apiBaseUrl}/public/${cleanUrl}`;
        })
      : getProductImages(product.marca || "");

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const specs = [
    ["Alto", product.ancho || "N/A"],
    ["Perfil", product.perfil === "0" || product.perfil === 0 ? "Sin perfil" : (product.perfil || "N/A")],
    ["Lona", product.lonas ? `${product.lonas} PR` : "N/A"],
    ["Rin", product.rin ? `${product.rin} pulgadas` : "N/A"],
    ["Índice de carga", product.indiceCarga || "N/A"],
    ["Índice de velocidad", product.indiceVelocidad || "N/A"],
    [
      "Presión Máxima",
      product.presionMaxima ? `${product.presionMaxima} psi` : "N/A",
    ],
    ["Profundidad", product.profundidad ? `${product.profundidad} mm` : "N/A"],
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] my-4 sm:my-8 overflow-hidden">
        <div className="bg-white border-b border-[#e5e7eb] px-4 sm:px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-['Arimo:Bold',sans-serif] text-[22px] sm:text-[24px] font-bold text-[#101828] leading-[32px]">
            Ver Producto
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-[#4A5565]" />
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="relative bg-[#f3f4f6] rounded-xl overflow-hidden aspect-square flex items-center justify-center">
                <img
                  src={images[currentImageIndex]}
                  alt="Producto"
                  className="w-full h-full object-cover"
                />

                {images.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-md transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                )}

                {images.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-md transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-1.5 rounded-full text-sm font-['Inter:Medium',sans-serif]">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative min-w-16 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-[#f3f4f6] flex items-center justify-center ${
                      currentImageIndex === index
                        ? "border-[#027EB1] ring-2 ring-[#027EB1] ring-opacity-30"
                        : "border-[#e5e7eb] hover:border-[#027EB1]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>

              {model3DExists && (
                <button
                  onClick={() => setModal3DOpen(true)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#027EB1] text-[#027EB1] font-['Inter:Semi_Bold',sans-serif] text-[16px] font-semibold rounded-lg hover:bg-[#f0f9ff] transition-colors"
                >
                  Ver Modelo 3D
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#9ca3af] uppercase tracking-wider mb-1">
                    {product.marca}
                  </p>

                  <h3 className="font-['Inter:Bold',sans-serif] text-[22px] sm:text-[24px] font-bold text-[#1a1a1a] mb-1">
                    {product.nombre}
                  </h3>

                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#6b7280]">
                    {product.categoria || "Sin categoría"}
                    {product.modelo ? ` • Modelos de Vehículos: ${product.modelo}` : ""}
                  </p>
                </div>

                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Info className="w-5 h-5 text-[#9ca3af]" />
                </button>
              </div>

              <div>
                <span className="font-['Inter:Bold',sans-serif] text-[30px] sm:text-[36px] font-bold text-[#027EB1]">
                  Lps.{" "}
                  {Number(product.precio).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  c/u
                </span>

                <p className="font-['Inter:Regular',sans-serif] text-[13px] text-[#027EB1] mt-1">
                  ISV incluido
                </p>
              </div>

              <div>
                <h4 className="font-['Inter:Bold',sans-serif] text-[18px] font-bold text-[#1a1a1a] mb-3">
                  Ficha Técnica
                </h4>

                <div className="mt-1 w-full overflow-hidden rounded-[8px] border border-[#d1d5db] bg-white shadow-md">
                  <div className="grid grid-cols-[65%_35%] lg:grid-cols-[50%_50%] bg-[#003E7B] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-tight">
                    <div className="px-2 sm:px-3 py-2 border-r border-[#0ea5e9] whitespace-nowrap">
                      ESPECIFICACIONES
                    </div>

                    <div className="px-2 sm:px-3 py-2 whitespace-nowrap">
                      VALOR
                    </div>
                  </div>

                  <div className="divide-y divide-[#e5e7eb] bg-white">
                    {specs.map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-[65%_35%] lg:grid-cols-[50%_50%]"
                      >
                        <div className="px-2 sm:px-3 py-2 bg-[#f3f4f6] text-xs sm:text-sm font-semibold text-[#374151] border-r border-[#e5e7eb] break-words leading-snug">
                          {label}
                        </div>

                        <div className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#111827] break-words leading-snug">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? "bg-[#16a34a]" : "bg-red-500"}`}
                ></div>

                <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#1a1a1a]">
                  {product.stock || 0} unidades disponibles
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-[#e5e7eb]">
            <h4 className="font-['Inter:Bold',sans-serif] text-[20px] font-bold text-[#1a1a1a] mb-4">
              Descripción
            </h4>

            <p className="font-['Inter:Regular',sans-serif] text-[15px] text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">
              {product.descripcion || "Sin descripción detallada disponible."}
            </p>
          </div>
        </div>
      </div>

      {modal3DOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Modelo 3D del producto"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setModal3DOpen(false)}
              aria-hidden
            />

            <div
              className="relative bg-white rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[1024px] h-[683px] max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModal3DOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors border-0"
                aria-label="Cerrar"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div
                className="flex-1 flex flex-col min-h-0 p-6"
                style={{
                  background:
                    "linear-gradient(146deg, rgba(2, 126, 177, 0.1) 0%, rgba(0, 62, 123, 0.1) 100%)",
                }}
              >
                <div className="flex-1 min-h-[200px] rounded-[10px] overflow-hidden bg-white/50 border border-[#e5e7eb] flex items-center justify-center">
                  {model3DUrl ? (
                    modelViewerReady ? (
                      createElement("model-viewer", {
                        src: model3DUrl.startsWith("http")
                          ? model3DUrl
                          : `${apiBaseUrl}/public/${model3DUrl.replace(/^\/+/, "")}`,
                        alt: "Modelo 3D del producto",
                        "camera-controls": true,
                        "auto-rotate": true,
                        "shadow-intensity": "1",
                        exposure: "0.8",
                        "environment-image": "neutral",
                        "tone-mapping": "commerce",
                        style: {
                          width: "100%",
                          height: "100%",
                          minHeight: "280px",
                        },
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-[#4a4a4a] p-8">
                        <CubeIcon />
                        <p className="text-sm text-center">
                          Cargando modelo 3D…
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-[#4a4a4a] p-8">
                      <CubeIcon />
                      <p className="text-sm text-center">
                        No hay modelo 3D disponible para este producto.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="h-0.5 flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-16 h-16 text-[#027eb1]"}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M48 16L16 36v24l32 20 32-20V36L48 16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M48 16v40M16 36l32 20 32-20M16 60l32-20 32 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
