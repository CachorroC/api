/**
 * @module types/juzgados
 * @description Judicial Court (Juzgado) Type Definitions
 * 
 * Type definitions for court/despacho identification and template literal construction.
 * Provides compile-time guarantees for court naming conventions.
 * 
 * COURT NAMING CONVENTION:
 * Spanish format: "juzgado [ID] [TIPO] de [CIUDAD]"
 * Example: "juzgado EJE MERCANTIL de BOGOTÁ"
 * 
 * TYPE HIERARCHY:
 * JuzgadoGeneralType: Template literal combining id, tipo, ciudad
 * outGOINGJuzgado: Uppercase version for external API responses
 * 
 * USAGE:
 * Ensures consistent court name formatting across API communication
 * Provides type safety when constructing court identifiers
 */

/**
 * @typedef {string} id
 * @description Court/despacho identifier (e.g., "EJE", "PCTO", "CM", "CC")
 */
export type id = string;

/**
 * @typedef {string} tipo
 * @description Court type/specialization (e.g., "MERCANTIL", "LABORAL", "PENAL")
 */
export type tipo = string;

/**
 * @typedef {string} ciudad
 * @description Colombian city name (e.g., "BOGOTÁ", "MEDELLÍN", "CALI")
 */
export type ciudad = string;

/**
 * @typedef {string} JuzgadoGeneralType
 * @description Template literal type for court naming: "juzgado [id] [tipo] de [ciudad]"
 * Provides compile-time validation of court name format.
 * @example "juzgado EJE MERCANTIL de BOGOTÁ"
 */
export type JuzgadoGeneralType = `juzgado ${ id } ${ tipo } de ${ ciudad }`;

/**
 * @typedef {string} outGOINGJuzgado
 * @description Uppercase version of JuzgadoGeneralType for external API responses.
 * All components converted to uppercase (JUZGADO, ID, TIPO, CIUDAD).
 * @example "JUZGADO EJE MERCANTIL DE BOGOTÁ"
 */
export type outGOINGJuzgado = Uppercase<JuzgadoGeneralType>;
