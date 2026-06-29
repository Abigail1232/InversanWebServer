import { ImageWithFallback } from "../components/ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBrands } from "../api/products/brands";
import { getCategorias, type Categoria } from "../api/products/categorias";
import CategorySelectorPanel from "../components/CategorySelectorPanel";

function Container1() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategorias();
        setCategories(data.filter((cat) => cat.activo));
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchCategories();
  }, []);

  return (
    <CategorySelectorPanel
      categories={categories}
      isLoading={isLoading}
      title="Selecciona la categoría"
      subtitle="Explora la llanta ideal según el tipo de vehículo."
      stepLabel="1"
      className="mb-8"
      onCategoryClick={(category) => {
        navigate('/search', {
          state: {
            selectedCategory: category.id_categoria,
            searchTerm: category.nombre,
          },
        });
      }}
    />
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex items-center justify-center w-full" data-name="Heading 2">
      <p className="font-['Arimo:Bold',sans-serif] font-bold leading-[44px] text-[#003e7b] text-[32px] text-center uppercase tracking-tight">
        Nuestras marcas
      </p>
    </div>
  );
}

function BrandCircle({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-white rounded-full size-[120px] md:size-[128px] cursor-pointer border border-[#e5e7eb] shadow-md hover:shadow-xl hover:scale-110 active:scale-105 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#027EB1] focus-visible:ring-offset-2"
      data-name="Container"
      aria-label={`Ver productos de ${alt}`}
    >
      <div className="content-stretch flex items-center justify-center overflow-hidden relative size-full rounded-full p-4">
        <ImageWithFallback
          alt={alt}
          className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-300 ease-out group-hover:scale-105"
          src={src}
        />
      </div>
    </button>
  );
}

function Container3() {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(6);
  const [brands, setBrands] = useState<Array<{ id: number; name: string; image: string }>>([]);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandData = await getBrands();
        if (brandData.length > 0) {
          const baseUrl = import.meta.env.VITE_API_URL || "";
          setBrands(
            brandData.map((brand) => ({
              id: brand.id,
              name: brand.name,
              image: brand.imageUrl ? `${baseUrl}/public/${brand.imageUrl}` : "",
            }))
          );
          return;
        }
      } catch (error) {
        console.error("No se pudieron cargar las marcas para home", error);
      }
    };

    void loadBrands();
  }, []);

  const visibleBrands = brands.slice(0, visibleCount);

  return (
    <div className="flex flex-col justify-center items-center gap-8 w-full" data-name="Container">
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 w-full max-w-[1000px] transition-all duration-500 ease-in-out">
        {Array.isArray(visibleBrands) && visibleBrands.map((brand, index) => (
          <BrandCircle
            key={`${brand?.id}-${index}`}
            src={brand?.image || ""}
            alt={brand?.name || "Marca"}
            onClick={() => navigate(`/brand/${brand?.id}`)}
          />
        ))}
      </div>

      {visibleCount < brands.length && (
        <button
          onClick={() => setVisibleCount(prev => prev + 6)}
          className="bg-[#027EB1] rounded-full px-12 py-4 hover:bg-[#003e7b] transition-colors duration-200 shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          <span className="font-['Arimo:Bold',sans-serif] font-bold text-[16px] text-white tracking-wide">
            VER MÁS
          </span>
        </button>
      )}
    </div>
  );
}

function Section() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center pt-8 w-full" data-name="Section">
      <Heading1 />
      <Container3 />
    </div>
  );
}

export default function BodyWrapper() {
  return (
    <div className="w-full bg-transparent py-4 flex flex-col items-center">
      <div className="max-w-[1400px] w-full px-4">
        <Container1 />
        <Section />
      </div>
    </div>
  );
}