export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface RelatedProduct {
  id: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  promotionDisplayMode?: "porcentaje" | "precio_tachado";
  imageUrl: string;
  stock: number;
}

//Est se cambiaria si cambian los datos de la ficha tecnica
export interface Product {
  id: string;
  brand: string;
  company: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  promotionDisplayMode?: "porcentaje" | "precio_tachado";
  promotionText?: string;
  includesVat: boolean;
  specs: ProductSpec[];
  stock: number;
  images: ProductImage[];
  description: string;
  descriptionFeatures: string[];
  descriptionClosing?: string;
  relatedProducts: RelatedProduct[];
  //secciones de productos relacionados agrupados por caracteristicas de la ficha tecnica.
  relatedSpecsSections?: string[];
  hasWholesalePrice: boolean;
  model3DUrl?: string;
}
