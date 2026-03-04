/**
 * @fileoverview Type Definitions for Legal Actions (Actuaciones)
 * 
 * Defines all TypeScript types and interfaces for representing legal actions,
 * judicial motions, and court records from the Colombian Judiciary system.
 *
 * Key Concepts:
 * - **Actuación**: A legal action or motion filed in a court case
 * - **API Response**: Raw data from the Rama Judicial API (dates as strings)
 * - **Database Model**: Transformed data in PostgreSQL (dates as Date objects)
 * - **Pagination**: Support for API result pagination
 *
 * Type Transformation Strategy:
 * - Raw API returns: FetchResponseActuacionType (stringified dates)
 * - Validates and creates: DatabaseActuacionType (Date objects)
 * - Change detection: Compares idRegActuacion to find new records
 *
 * @module types/actuaciones
 */

/**
 * API response messages from the Judiciary system.
 * These are standard success/error responses from the government API.
 * 
 * Common responses:
 * - 'OK': Request succeeded
 * - 'No se pueden ver actuaciones de un proceso privado': Process is confidential
 * - 'Forbidden': Access denied to this resource
 * - 'Internal Server Error': Transient API failure
 * 
 * @typedef {string} Message
 */
export type Message =
  | 'OK'
  | 'Object reference not set to an instance of an object.'
  | 'No se pueden ver actuaciones de un proceso privado'
  | 'Internal Server Error'
  | 'Forbidden';

/**
 * Raw legal action data as returned from the Judiciary API.
 * 
 * All date fields are returned as ISO 8601 strings and must be converted
 * to Date objects before storage in the database.
 *
 * **Field Descriptions:**
 * - idRegActuacion: Unique identifier for this action record (from "idRegistroActuacion")
 * - llaveProceso: The case filing number (radicación number) - backward reference
 * - consActuacion: Consecutive/sequence number of actions in this process
 * - fechaActuacion: When the legal action actually occurred in court
 * - actuacion: Title/name of the action (e.g., "Sentencia", "Traslado")
 * - anotacion: Optional additional notes or observations
 * - fechaInicial: Start date for actions with duration (e.g., deadlines)
 * - fechaFinal: End date for actions with duration
 * - fechaRegistro: When the action was registered/recorded in the system
 * - codRegla: Regulatory code or rule classification
 * - conDocumentos: Whether supporting documents are attached
 * - cant: Count or quantity (number of items/pages/etc)
 *
 * **Date String Format:**
 * All dates from API come as ISO 8601 strings: "2026-02-16T14:30:00"
 * Some may have timezone info (Z), others don't (assume local time conversion needed)
 *
 * @typedef {Object} FetchResponseActuacionType
 * @property {number} idRegActuacion - Unique record identifier from Judiciary system
 * @property {string} llaveProceso - Case filing number (process key)
 * @property {number} consActuacion - Action sequence/consecutive number
 * @property {string} fechaActuacion - ISO 8601 date when action occurred
 * @property {string} actuacion - Name/title of the legal action
 * @property {string | null} anotacion - Optional annotation or notes
 * @property {string | null} fechaInicial - Optional start date (ISO string)
 * @property {string | null} fechaFinal - Optional end date (ISO string)
 * @property {string} fechaRegistro - ISO date when registered in Judiciary system
 * @property {string} codRegla - Regulatory code/classification
 * @property {boolean} conDocumentos - Document attachment flag
 * @property {number} cant - Count/quantity associated with action
 */
export type FetchResponseActuacionType = {
  idRegActuacion: number;
  llaveProceso  : string;
  consActuacion : number;
  fechaActuacion: string;
  actuacion     : string;
  anotacion     : null | string;
  fechaInicial  : string | null;
  fechaFinal    : string | null;
  fechaRegistro : string;
  codRegla      : string;
  conDocumentos : boolean;
  cant          : number;
};

/**
 * Transformed legal action stored in the PostgreSQL database.
 * 
 * This type is derived from FetchResponseActuacionType with key transformations:
 * - All date strings → Date objects
 * - idRegActuacion → String (coerced for consistency)
 * - Added computed fields: idProceso, isUltimaAct, createdAt, carpetaNumero
 *
 * **Field Differences from API Response:**
 * | Field | API Type | DB Type | Purpose |
 * |-------|----------|---------|---------|
 * | idRegActuacion | number | string | Consistency with process IDs |
 * | fechaActuacion | string | Date | Database-native date storage |
 * | fechaRegistro | string | Date | Database-native date storage |
 * | idProceso | (none) | string | Foreign key to process table |
 * | isUltimaAct | (none) | boolean | Flag for latest action in process |
 * | createdAt | (none) | Date | Timestamp when record inserted |
 * | carpetaNumero | (none) | number | Reference to case folder |
 *
 * **Usage:**
 * This type represents the actual database schema for the "actuacion" table.
 * All date conversions happen during the Actuacion constructor.
 *
 * @typedef {Object} DatabaseActuacionType
 * @property {string} idRegActuacion - Coerced to string for consistency
 * @property {Date} fechaActuacion - When court action occurred (Date object)
 * @property {Date | null} fechaInicial - Start date if applicable (Date object or null)
 * @property {Date | null} fechaFinal - End date if applicable (Date object or null)
 * @property {Date} fechaRegistro - When registered in judiciary system
 * @property {string} idProceso - Foreign key to parent process
 * @property {boolean} isUltimaAct - True if this is the latest action for process
 * @property {Date} createdAt - Timestamp when record inserted locally
 * @property {number} carpetaNumero - Case folder number (backward reference)
 * @property {string} llaveProceso - Case filing number (inherited)
 * @property {number} consActuacion - Action sequence number (inherited)
 * @property {string} actuacion - Action title (inherited)
 * @property {string | null} anotacion - Annotation notes (inherited)
 * @property {string} codRegla - Regulatory code (inherited)
 * @property {boolean} conDocumentos - Document flag (inherited)
 * @property {number} cant - Count/quantity (inherited)
 */
export type DatabaseActuacionType = Omit<
  FetchResponseActuacionType,
  | 'idRegActuacion'
  | 'fechaActuacion'
  | 'fechaInicial'
  | 'fechaFinal'
  | 'fechaRegistro'
> & {
  idRegActuacion: string;
  fechaActuacion: Date;
  fechaInicial  : Date | null;
  fechaFinal    : Date | null;
  fechaRegistro : Date;
  idProceso     : string;
  isUltimaAct   : boolean;
  createdAt     : Date;
  carpetaNumero : number;
};

/**
 * Pagination metadata from API responses.
 * 
 * The Judiciary API supports result pagination to avoid overwhelming clients
 * with large result sets. Use these values to iterate through pages.
 *
 * **Example Usage:**
 * - First request: /endpoint?pagina=1
 * - Get cantidadPaginas from response
 * - If pagina < cantidadPaginas, increment pagina and fetch next page
 *
 * **Fields:**
 * - cantidadRegistros: Total records matching the filter (across all pages)
 * - registrosPagina: Items per page (usually 100)
 * - cantidadPaginas: Total number of pages available
 * - pagina: Current page number (1-indexed)
 * - paginas: Deprecated/unused field (null)
 *
 * @typedef {Object} Paginacion
 * @property {number} cantidadRegistros - Total matching records
 * @property {number} registrosPagina - Per-page limit (usually 100)
 * @property {number} cantidadPaginas - Total pages available
 * @property {number} pagina - Current page (1-indexed)
 * @property {null} [paginas] - Deprecated field
 */
export type Paginacion = {
  cantidadRegistros: number;
  registrosPagina  : number;
  cantidadPaginas  : number;
  pagina           : number;
  paginas?         : null;
};

/**
 * JSON conversion utility (legacy pattern).
 * 
 * This class provides static methods for JSON serialization/deserialization.
 * While functional, modern TypeScript projects typically just use
 * JSON.parse() and JSON.stringify() directly.
 * 
 * Kept for backward compatibility with existing code patterns.
 *
 * @class Convert
 * @deprecated Consider using JSON.parse/stringify directly in new code
 */
export class Convert {
  public static toConsultaActuacion(
    json: string 
  ): ConsultaActuacion[] {
    return JSON.parse(
      json 
    );
  }

  public static ConsultaActuacionToJson(
    value: ConsultaActuacion[] 
  ): string {
    return JSON.stringify(
      value 
    );
  }
}

/**
 * API response containing a batch of legal actions.
 * 
 * The Judiciary API returns action data in a paginated, structured format.
 * This interface represents a single page/response from the API.
 *
 * **Lifecycle:**
 * 1. Client requests /api/v2/Proceso/Actuaciones/{processId}?pagina=1
 * 2. API returns ConsultaActuacion object with this structure
 * 3. Client processes actuaciones array (change detection, insertion, notification)
 * 4. Client checks paginacion to see if more pages exist
 * 5. If more pages: request with pagina=2, 3, etc
 *
 * **Generic Parameter T:**
 * TypeScript allows type parameter T to customize the actuaciones type.
 * - Default: FetchResponseActuacionType (raw API format)
 * - Can be overridden: ConsultaActuacion<DatabaseActuacionType> for transformed data
 *
 * @template T - The type of actuaciones in the array (default: FetchResponseActuacionType)
 * @property {T[]} actuaciones - Array of legal actions from this page
 * @property {Paginacion} paginacion - Pagination metadata for result navigation
 */
export interface ConsultaActuacion<T = FetchResponseActuacionType> {
  actuaciones: T[];
  paginacion : Paginacion;
}

/**
 * Context/metadata for a process being synchronized.
 * 
 * This interface passes essential information about a legal process through
 * the sync pipeline, from fetch to database insertion to notification dispatch.
 *
 * **Use Cases:**
 * - Passed to ActuacionService.syncBatch() for processing actions
 * - Logged when operations fail (provides context)
 * - Used in webhook/Telegram payloads to identify case
 * - Links new actions back to their parent process and case folder
 *
 * **Field Relationships:**
 * - idProceso: Primary identifier for the specific legal proceeding
 * - carpetaNumero: Internal case folder number (may have multiple processes)
 * - llaveProceso: Government filing number (matches case documents)
 * - carpetaId: Database primary key for lookup
 * - nombre: Human-readable case name (for notification display)
 *
 * **Example Data:**
 * ```
 * {
 *   idProceso: "123456789",
 *   carpetaNumero: 1,
 *   llaveProceso: "2024-1234567",
 *   carpetaId: 101,
 *   nombre: "Juan Pérez",
 *   category: "Activos"
 * }
 * ```
 *
 * @interface ProcessRequest
 * @property {string} idProceso - Unique process identifier from Judiciary system
 * @property {number} carpetaNumero - Internal case folder number
 * @property {string} llaveProceso - Official case filing number/radicación
 * @property {number} carpetaId - Database ID for the case folder
 * @property {string} nombre - Name/title of case (defendant name or case description)
 * @property {string | null} [category] - Optional case category (Activos, Terminados, etc)
 */
export interface ProcessRequest {
  idProceso    : string;
  carpetaNumero: number;
  llaveProceso : string;
  carpetaId    : number;
  nombre       : string;
  category?    : string | null;
}
