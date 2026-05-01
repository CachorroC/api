/**
 * @module types/contabilidad
 * @description Accounting/Financial Metadata Type Definition
 *
 * Flexible interface for storing financial and accounting-related metadata
 * associated with a judicial case. Uses index signature for dynamic properties.
 *
 * STRUCTURE:
 * Key-value pairs where values can be:
 * - string: Description, notes, classifications
 * - number: Monetary amounts, counts, percentages
 * - Date: Transaction dates, payment dates
 * - undefined: Missing or not applicable data
 * - null: Explicitly null values (different from missing)
 *
 * USAGE EXAMPLE:
 * Contabilidad: {
 *   "saldo_actual": 15000000,
 *   "fecha_ultimo_pago": Date(2026, 2, 1),
 *   "moneda": "COP",
 *   "interes_mensual": 2.5,
 *   "estado_cartera": "Activo"
 * }
 *
 * FLEXIBILITY:
 * Index signature [x: string] allows any string key
 * Facilitates adding new financial fields without interface changes
 * Suitable for accounting integrations and financial reports
 *
 * COMPARISON WITH IntCarpeta:
 * IntCarpeta: Strongly typed case structure
 * Contabilidad: Flexible accounting metadata (subset of case data)
 */

/**
 * @interface Contabilidad
 * @description Flexible key-value storage for financial and accounting information.
 *
 * @property {string} [x] - Index signature allowing any string key with mixed value types
 * @property {string | number | undefined | Date | null} - Value can be various types
 */
export interface Contabilidad {
  [x: string]: string | number | undefined | Date | null;
}
