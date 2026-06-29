/**
 * Utilidades de formateo de precios para toda la aplicación.
 * Usar SIEMPRE estas funciones para garantizar consistencia en la presentación de precios.
 */

/**
 * Formatea un número como precio en lempiras hondureños con exactamente 2 decimales.
 * Usa el locale "es-HN" para el separador de miles y decimales correcto.
 *
 * @example
 *   formatPrice(200.22)         // "200.22"
 *   formatPrice(1740)           // "1,740.00"
 *   formatPrice(200.219999999)  // "200.22"  ← floating-point corregido
 */
export function formatPrice(value: number | undefined | null): string {
  const num = typeof value === "number" && isFinite(value) ? value : 0;
  return num.toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Redondea un número a exactamente 2 decimales como número (no string).
 * Usar antes de almacenar precios en estado o hacer operaciones aritméticas
 * para evitar arrastrar imprecisión de punto flotante.
 *
 * @example
 *   safePrice(200.219999999)  // 200.22
 *   safePrice(1740.001)       // 1740.00
 */
export function safePrice(value: number | undefined | null): number {
  if (value === null || value === undefined || !isFinite(Number(value))) return 0;
  return parseFloat(Number(value).toFixed(2));
}
