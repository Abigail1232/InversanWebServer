import type { RelatedProduct } from '../../types/product';
import RelatedProductCard from './RelatedProductCard';

interface Props {
  products: RelatedProduct[];
  onViewDetails?: (id: string) => void;
  sectionSpecs?: string[];
  /** Si se pasa, se muestra una sola sección con este título (ej. "Productos con el mismo Rin: 16 pulgadas") */
  sectionTitle?: string;
  /** Modo de visualización de descuentos: porcentaje o precio tachado */
  displayMode?: "porcentaje" | "precio_tachado";
}

export default function RelatedProducts({ products, onViewDetails, sectionSpecs, sectionTitle, displayMode = "precio_tachado" }: Props) {
  const useSingleTitle = sectionTitle != null && sectionTitle !== '';
  const specsToUse = useSingleTitle
    ? [sectionTitle]
    : (sectionSpecs && sectionSpecs.length > 0)
      ? sectionSpecs
      : ['esta característica'];

  if (!products || products.length === 0) {
    return (
      <div className="bg-[#f9fafb] border-2 border-dashed border-[#e5e7eb] rounded-[16px] p-12 text-center">
        <div className="max-w-[300px] mx-auto flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <p className="text-[#6b7280] font-medium">No se han encontrado productos similares para este modelo en esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {specsToUse.map((spec, index) => (
        <section key={index} className="flex flex-col gap-4">
          <h2 className="text-lg md:text-2xl font-semibold text-[#1a1a1a]">
            {useSingleTitle ? spec : `Más productos con ${spec}`}
          </h2>
<div className="overflow-x-auto rounded-[12px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
  
  <div className="flex gap-4 px-4 py-3 w-max mx-auto md:mx-0">
    {products.map((product) => (
      <div key={`${product.id}-${index}`} className="flex-shrink-0 w-[290px]">
        <RelatedProductCard
          product={product}
          onViewDetails={onViewDetails}
          displayMode={displayMode}
        />
      </div>
    ))}
  </div>

</div>
        </section>
      ))}
    </div>
  );
}
