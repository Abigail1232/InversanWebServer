/**
 * Funciones utilitarias para el checkout
 */

/**
 * Formatea un número de teléfono al formato XXXX-XXXX
 * @param raw - Entrada del usuario
 * @returns Teléfono formateado
 */
export const formatPhone = (raw: string): string => {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

/**
 * Mapea el tipo de entrega a la cadena que espera el backend
 * @param type - Tipo de entrega (home, outside, branch)
 * @returns Cadena para backend
 */
export const mapTipoEntrega = (type: "home" | "outside" | "branch"): string => {
  if (type === "branch") return "retiro_en_el_local";
  return "a_domicilio";
};

/**
 * Mapea el método de pago a la cadena que espera el backend
 * @param method - Método de pago
 * @returns Cadena para backend
 */
export const mapTipoPago = (
  method: "transfer" | "paypal" | "pos" | "link"
): string => {
  if (method === "transfer") return "transferencia_bancaria";
  if (method === "paypal") return "pay_pal";
  if (method === "pos") return "pos";
  return "compra_click";
};

/**
 * Obtiene el texto legible del tipo de entrega
 * @param type - Tipo de entrega
 * @returns Texto para mostrar al usuario
 */
export const getDeliveryTypeText = (type: string): string => {
  const map: Record<string, string> = {
    home: "Domicilio Local (Gratis)",
    outside: "Envío Nacional",
    branch: "Retiro en Sucursal",
  };
  return map[type] || type;
};

/**
 * Obtiene el texto legible del método de pago
 * @param method - Método de pago
 * @returns Texto para mostrar al usuario
 */
export const getPaymentMethodText = (method: string): string => {
  const map: Record<string, string> = {
    transfer: "Transferencia Bancaria",
    paypal: "PayPal / Tarjeta de Crédito",
    pos: "Efectivo o POS contra entrega",
    link: "Pago con Link (WhatsApp)",
  };
  return map[method] || method;
};

/**
 * Valida si un archivo de comprobante es válido
 * @param file - Archivo a validar
 * @returns Objeto con éxito y mensaje de error (si aplica)
 */
export const validateReceiptFile = (
  file: File | null
): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: "No se seleccionó un archivo" };
  }

  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "Solo se permiten archivos de imagen (JPG, PNG, etc.)",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      isValid: false,
      error: "El archivo no debe superar los 5MB",
    };
  }

  return { isValid: true };
};

/**
 * Calcula el costo de envío basado en criterios
 * @param deliveryType - Tipo de entrega
 * @param isFreeNationalShipping - Si aplica envío gratis por volumen
 * @param orderValue - Valor total de la orden
 * @returns Costo de envío
 */
export const calculateShippingCost = (
  deliveryType: "home" | "outside" | "branch",
  isFreeNationalShipping: boolean,
  orderValue: number
): number => {
  const FREE_SHIPPING_THRESHOLD = 70000;
  const NATIONAL_SHIPPING_FEE = 30;

  if (deliveryType === "outside") {
    if (
      isFreeNationalShipping ||
      orderValue >= FREE_SHIPPING_THRESHOLD
    ) {
      return 0;
    }
    return NATIONAL_SHIPPING_FEE;
  }

  return 0;
};

/**
 * Formatea un número como moneda
 * @param value - Valor a formatear
 * @param decimals - Número de decimales (default 2)
 * @returns Valor formateado con $
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return `$${value.toFixed(decimals)}`;
};
