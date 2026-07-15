import api from "../axios";
import type { Product, ProductSpec, RelatedProduct } from "../../types/product";
import { safePrice } from "../../utils/formatPrice";

export interface RelatedSection {
  spec: string;
  value: string;
  products: RelatedProduct[];
}

type ProductPromotion = {
  descuento: number;
  tipo_descuento?: string;
  precio_promocion?: number;
  promocion: {
    fecha_inicio: string | Date;
    fecha_finalizacion: string | Date;
    mostrar_precio_porcentaje?: boolean;
    mostrar_precio_tachado?: boolean;
  };
};

export async function getRelatedProducts(
  id: number,
  sucursal_id?: number,
): Promise<RelatedSection[]> {
  const response = await api.get(`/api/products/${id}/related`, {
    params: sucursal_id != null ? { sucursal_id } : undefined,
  });
  return response.data;
}

export async function getProductos(page = 1, id_sucursal?: number) {
  try {
    const response = await api.get("/api/products/productos", {
      params: { page, id_sucursal },
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    throw error;
  }
}

export async function getProductoById(
  id: number,
  id_sucursal?: number,
): Promise<Product> {
  try {
    const response = await api.get(`/api/products/${id}`, {
      params: id_sucursal != null ? { id_sucursal } : undefined,
    });

    const data = response.data.producto;
    const specs: ProductSpec[] = [
      {
        label: "Alto",
        value: data.especificaciones?.ancho_rin?.toString() || "N/A",
      },
      {
        label: "Perfil",
        value: data.especificaciones?.alto_rin?.toString() === "0" ? "Sin perfil" : (data.especificaciones?.alto_rin?.toString() || "N/A"),
      },
      {
        label: "Lona",
        value: data.especificaciones?.lonas?.toString() || "N/A",
      },
      { label: "Rin", value: data.especificaciones?.rin?.toString() || "N/A" },
      {
        label: "Índice de carga",
        value: data.especificaciones?.indice_de_carga?.toString() || "N/A",
      },
      {
        label: "Índice de velocidad",
        value: data.especificaciones?.indice_velocidad?.toString() || "N/A",
      },
      {
        label: "Presión Máxima",
        value: data.especificaciones?.presion_maxima?.toString() || "N/A",
      },
      {
        label: "Profundidad",
        value: data.especificaciones?.profundidad?.toString() || "N/A",
      }
    ];

    const rawModel3DPath: string | undefined = data.imagen_3d ?? undefined;

    const mappedProduct: Product = {
      id: data.id_producto.toString(),
      brand: data.marca || "",
      company: "",
      name: data.nombre,
      category: data.categoria || "",
      price: safePrice(data.precios?.detalle ?? 0),
      originalPrice: undefined,
      discountPercent: undefined,
      promotionDisplayMode: undefined,
      promotionText: undefined,
      includesVat: true,
      specs: specs,
      stock: data.stock_total || 0,
      images:
        data.imagenes?.map((img: any) => ({
          id: img.id.toString(),
          url: img.url,
          alt: `${data.nombre} - ${img.orden ?? ""}`,
        })) || [],
      description: data.descripcion || "",
      descriptionFeatures: [],
      descriptionClosing: "",
      relatedProducts: [],
      relatedSpecsSections: [
        `Rin ${data.especificaciones?.rin || ""}`,
        `índice de carga ${data.especificaciones?.indice_de_carga || ""}`,
        `índice de velocidad ${data.especificaciones?.indice_velocidad || ""}`,
      ],
      hasWholesalePrice:
        data.precios?.mayoreo !== undefined &&
        data.precios?.mayoreo < data.precios?.detalle,
      model3DUrl: rawModel3DPath || undefined,
    };

    const ahora = new Date();

    console.log(data);
    const promocionesActivas = (data.promociones ?? []).filter(
      (p: ProductPromotion) =>
        p.descuento > 0 &&
        new Date(p.promocion.fecha_inicio) <= ahora &&
        new Date(p.promocion.fecha_finalizacion) >= ahora,
    );
    const promocionActiva = promocionesActivas.reduce(
      (best: ProductPromotion | undefined, current: ProductPromotion) =>
        !best || current.descuento > best.descuento ? current : best,
      undefined,
    );
    const mayorDescuento = promocionActiva?.descuento ?? 0;
    const esMonto = promocionActiva?.tipo_descuento === "monto";
    const precioPromoFijo = promocionActiva?.precio_promocion;

    if (mayorDescuento > 0) {
      mappedProduct.originalPrice = safePrice(mappedProduct.price);
      mappedProduct.discountPercent = mayorDescuento;

      // Usar la configuración de la promoción para determinar el modo de visualización
      const mostrarPorcentaje = Boolean(promocionActiva?.promocion?.mostrar_precio_porcentaje);
      const mostrarPrecioTachado = Boolean(promocionActiva?.promocion?.mostrar_precio_tachado);

      if (mostrarPorcentaje && !mostrarPrecioTachado) {
        mappedProduct.promotionDisplayMode = "porcentaje";
      } else if (mostrarPrecioTachado && !mostrarPorcentaje) {
        mappedProduct.promotionDisplayMode = "precio_tachado";
      } else {
        // Si ambos son true o ambos son false, usar precio_tachado por defecto
        mappedProduct.promotionDisplayMode = "precio_tachado";
      }

      if (esMonto && precioPromoFijo) {
        // Usar precio promocional exacto cuando tipo_descuento es "monto"
        mappedProduct.price = safePrice(precioPromoFijo);
      } else {
        // Calcular por porcentaje cuando tipo_descuento es "porcentaje"
        mappedProduct.price = safePrice(mappedProduct.price * (1 - mayorDescuento / 100));
      }
    }

    return mappedProduct;
  } catch (error) {
    console.error(`Error obteniendo producto con ID ${id}:`, error);
    throw error;
  }
}
export async function getProductosAdmin(
  page = 1,
  pageSize = 10,
  filters: any = {},
) {
  try {
    const response = await api.get("/api/products", {
      params: { page, pageSize, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo productos para admin:", error);
    throw error;
  }
}

export async function createProducto(formData: FormData) {
  try {
    const response = await api.post("/api/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creando producto:", error);
    throw error;
  }
}

export async function updateProducto(id: number, formData: FormData) {
  try {
    const response = await api.put(`/api/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error actualizando producto:", error);
    throw error;
  }
}

export async function cambiarEstadoProducto(id: number, activo: boolean) {
  try {
    const response = await api.patch(
      `/api/products/${id}/estado`,
      {},
      {
        params: { activo: activo.toString() },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error cambiando estado del producto:", error);
    throw error;
  }
}

export async function getCategorias() {
  try {
    const response = await api.get("/api/products/categorias-admin");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    throw error;
  }
}

export async function getMarcas() {
  try {
    const response = await api.get("/api/products/marcas");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo marcas:", error);
    throw error;
  }
}

export async function getTodosModelos() {
  try {
    const response = await api.get("/api/products/todos-modelos");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo todos los modelos:", error);
    throw error;
  }
}

export async function getEspecificacionesExistentes() {
  try {
    const response = await api.get("/api/products/especificaciones-existentes");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo especificaciones existentes:", error);
    throw error;
  }
}
