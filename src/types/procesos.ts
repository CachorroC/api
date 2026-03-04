/**
 * @fileoverview Type Definitions for Legal Processes (Procesos)
 * 
 * Defines all TypeScript types for legal processes in the Colombian Judiciary.
 * 
 * **Key Concepts:**
 * - **Proceso**: A legal proceeding/case instance with its own ID
 * - **Carpeta**: A case folder which may contain multiple processes
 * - **Actuación**: Individual legal actions/motions within a process
 *
 * **Data Flow:**
 * ```
 * API Call: /Procesos/Consulta/NumeroRadicacion?numero={llaveProceso}
 *    ↓
 * Response: ConsultaProcesos (contains fetchResponseProceso[])
 *    ↓
 * Transformed: outProceso (dates converted to Date objects)
 *    ↓
 * Database: databaseProceso (persisted in PostgreSQL)
 * ```
 *
 * @module types/procesos
 */

// To parse this data:
//
//   import { Convert, ConsultaNumeroRadicacion } from "./file";
//
//   const consultaNumeroRadicacion = Convert.toConsultaNumeroRadicacion(json);

import { Juzgado } from './carpetas.js';

// To parse this data:
//
//   import { Convert, ConsultaProcesos } from "./file";
//
//   const consultaProcesos = Convert.toConsultaProcesos(json);

/**
 * Pagination metadata from Judiciary API responses.
 * 
 * Identical structure to Paginacion in actuaciones.ts
 * Used to navigate through paginated process results.
 *
 * @typedef {Object} Paginacion
 * @property {number} cantidadRegistros - Total records matching query across all pages
 * @property {number} registrosPagina - Records per page (typically 100)
 * @property {number} cantidadPaginas - Total pages available
 * @property {number} pagina - Current page number (1-indexed)
 * @property {null} paginas - Legacy/deprecated field
 */
export type Paginacion = {
  cantidadRegistros: number;
  registrosPagina  : number;
  cantidadPaginas  : number;
  pagina           : number;
  paginas          : null;
};

/**
 * Raw legal process data as returned from the Judiciary API.
 * 
 * This is the unmodified response from the Judiciary system.
 * Dates are returned as ISO 8601 strings and must be converted
 * to JavaScript Date objects for proper comparison and storage.
 *
 * **Field Descriptions:**
 * - cantFilas: Number of rows/filings for this process
 * - departamento: Administrative division (state/region)
 * - despacho: Court/office identifier
 * - esPrivado: Confidentiality flag (true = case is private/sealed)
 * - fechaProceso: When the case/process was initiated
 * - fechaUltimaActuacion: Latest action date in the process
 * - idConexion: Connection/batch identifier from API
 * - idProceso: Unique process identifier from Judiciary
 * - llaveProceso: Official case filing number (radicación)
 * - sujetosProcesales: List of parties involved (plaintiff, defendant, etc)
 *
 * **Date Note:**
 * Both date fields may be strings from API or Date objects from transformations.
 * Type annotation uses union to handle both possibilities.
 *
 * @typedef {Object} fetchResponseProceso
 * @property {number} cantFilas - Number of filings/actions in process
 * @property {string} departamento - Administrative region/department
 * @property {string} despacho - Court/judicial office name
 * @property {boolean} esPrivado - Confidentiality flag
 * @property {string | Date} fechaProceso - ISO date process started
 * @property {string | Date} fechaUltimaActuacion - ISO date of recent action
 * @property {number} idConexion - API connection/batch ID
 * @property {number} idProceso - Unique process ID (may have leading zeros)
 * @property {string} llaveProceso - Official filing number
 * @property {string} sujetosProcesales - Parties/subjects in the case
 */
export type fetchResponseProceso = {
  cantFilas           : number;
  departamento        : string;
  despacho            : string;
  esPrivado           : boolean;
  fechaProceso        : string | Date;
  fechaUltimaActuacion: string | Date;
  idConexion          : number;
  idProceso           : number;
  llaveProceso        : string;
  sujetosProcesales   : string;
};

/**
 * Intermediate process type with dates partially transformed.
 * 
 * This type is used during data transformation when we've converted
 * date strings to Date objects, but haven't yet persisted to database.
 * Both date fields are nullable to handle missing data.
 *
 * **Differences from fetchResponseProceso:**
 * - fechaProceso: Date | null (type narrowed to Date or null)
 * - fechaUltimaActuacion: Date | null (type narrowed to Date or null)
 *
 * All other fields inherit from fetchResponseProceso.
 *
 * @typedef {Object} intProceso
 * @property {number} cantFilas - Number of filings/actions
 * @property {string} departamento - Administrative region
 * @property {string} despacho - Court/judicial office
 * @property {boolean} esPrivado - Confidentiality flag
 * @property {Date | null} fechaProceso - Process start date (Date object)
 * @property {Date | null} fechaUltimaActuacion - Latest action date (Date object)
 * @property {number} idConexion - API connection ID
 * @property {number} idProceso - Unique process ID
 * @property {string} llaveProceso - Official filing number
 * @property {string} sujetosProcesales - Parties/subjects in case
 */
export type intProceso = {
  cantFilas           : number;
  departamento        : string;
  despacho            : string;
  esPrivado           : boolean;
  fechaProceso        : Date | null;
  fechaUltimaActuacion: Date | null;
  idConexion          : number;
  idProceso           : number;
  llaveProceso        : string;
  sujetosProcesales   : string;
};

/**
 * Process type for database storage with required dates.
 * 
 * Extends fetchResponseProceso with the guarantee that both date fields
 * are always Date objects (never null, never strings).
 * This type represents a validated process ready for Prisma insertion.
 *
 * @typedef {Object} databaseProceso
 * @extends fetchResponseProceso
 * @property {Date} fechaProceso - Guaranteed Date object
 * @property {Date} fechaUltimaActuacion - Guaranteed Date object
 */
export interface databaseProceso extends fetchResponseProceso {
  fechaProceso        : Date;
  fechaUltimaActuacion: Date;
}

/**
 * API response containing legal processes.
 * 
 * Standard response from the Judiciary API when querying by filing number
 * or other process search criteria. Contains the matched processes, query
 * parameters echo, and pagination info.
 *
 * **Typical Flow:**
 * 1. Query: GET /api/v2/Procesos/Consulta/NumeroRadicacion?numero=2024123456
 * 2. Response: ConsultaProcesos
 * 3. Extract procesos array and process each item
 * 4. Check paginacion for additional pages
 *
 * @typedef {Object} ConsultaProcesos
 * @property {TipoConsulta} tipoConsulta - Type of search performed
 * @property {intProceso[] | fetchResponseProceso[]} procesos - Results array
 * @property {Parametros} parametros - Echo of query parameters
 * @property {Paginacion} paginacion - Pagination metadata
 */
export type ConsultaProcesos = {
  tipoConsulta: TipoConsulta;
  procesos    : intProceso[] | fetchResponseProceso[];
  parametros  : Parametros;
  paginacion  : Paginacion;
};

/**
 * Query parameters used in the API search.
 * 
 * The API echoes back the parameters used in the request as a confirmation.
 * Most fields may be null if not used as search criteria.
 *
 * @typedef {Object} Parametros
 * @property {string | null} numero - Filing number used (if searching by filing number)
 * @property {string | null} nombre - Name used (if searching by person name)
 * @property {string | null} tipoPersona - Person type filter (if applied)
 * @property {null} idSujeto - Subject ID filter (reserved)
 * @property {null} ponente - Judge/magistrate filter (reserved)
 * @property {null} claseProceso - Process class filter (reserved)
 * @property {null} codificacionDespacho - Office code filter (reserved)
 * @property {boolean} soloActivos - Only active processes flag
 */
export type Parametros = {
  numero              : null | string;
  nombre              : null | string;
  tipoPersona         : null | string;
  idSujeto            : null;
  ponente             : null;
  claseProceso        : null;
  codificacionDespacho: null;
  soloActivos         : boolean;
};

/**
 * API response messages.
 * Standard success/error messages from the Judiciary system.
 *
 * @typedef {string} Message
 */
export type Message =
  | 'OK'
  | 'El parametro "NumeroRadicacion" ha de contener 23 digitos.'
  | 'Object reference not set to an instance of an object.'
  | 'No se pueden ver actuaciones de un proceso privado';

/**
 * Detailed process information with court metadata.
 * 
 * Extended information about a single process, including judicial
 * classification, proceeding type, and associated court details.
 *
 * @typedef {Object} DetalleProceso
 * @property {string | null | boolean | Date | number | Juzgado | undefined} [key: string] - Generic properties
 * @property {ClaseProceso} claseProceso - Process class (EJECUTIVO, SINGULAR, etc)
 * @property {string | null} contenidoRadicacion - Filing content/details
 * @property {string} despacho - Court/office name
 * @property {boolean} esPrivado - Confidentiality flag
 * @property {Date} fechaConsulta - When this info was queried
 * @property {Date} fechaProceso - When process started
 * @property {number} idConexion - API connection ID
 * @property {number} idRegProceso - Process registration ID
 * @property {Juzgado} [juzgado] - Associated court information
 * @property {string} llaveProceso - Official filing number
 * @property {string} ponente - Assigning judge/magistrate
 * @property {Recurso | null} recurso - Legal resource type
 * @property {SubclaseProceso} subclaseProceso - Process subclass
 * @property {TipoProceso} tipoProceso - Proceeding type (laboral, civil, penal, etc)
 * @property {string | null} ubicacion - Physical location of case
 * @property {Date} ultimaActualizacion - Last update timestamp
 */
export type DetalleProceso = {
  [key: string]      : string | null | boolean | Date | number | Juzgado | undefined;
  claseProceso       : ClaseProceso;
  contenidoRadicacion: null | string;
  despacho           : string;
  esPrivado          : boolean;
  fechaConsulta      : Date;
  fechaProceso       : Date;
  idConexion         : number;
  idRegProceso       : number;
  juzgado?           : Juzgado;
  llaveProceso       : string;
  ponente            : string;
  recurso            : Recurso | null;
  subclaseProceso    : SubclaseProceso;
  tipoProceso        : TipoProceso;
  ubicacion          : null | string;
  ultimaActualizacion: Date;
};

/**
 * Process class classification.
 * Indicates the procedural category of the legal process.
 *
 * @typedef {string} ClaseProceso
 */
export type ClaseProceso =
  | 'EJECUTIVO'
  | 'Ejecutivo con T�tulo Hipotecario'
  | 'Ejecutivo Singular'
  | 'Ejecutivo con T�tulo Prendario'
  | 'Abreviado'
  | 'PROCESOS EJECUTIVOS HIPOTECARIOS O PRENDARIOS'
  | 'Despachos Comisorios'
  | 'Sin Tipo de Proceso'
  | 'Ejecutivo Mixto'
  | 'Solicitud entrega inmueble'
  | 'Sucesi�n'
  | 'SUCESI�N'
  | 'EJECUTIVOS DE MENOR Y MINIMA CUANTIA'
  | 'DESPACHOS COMISORIOS'
  | 'EJECUTIVO HIPOTECARIO'
  | 'Tutelas'
  | 'EJECUTIVO SINGULAR'
  | 'Ordinario';

export type Recurso = 'Sin Tipo de Recurso';

export type SubclaseProceso =
  | 'En general / Sin subclase'
  | 'Sin Subclase de Proceso'
  | 'Por sumas de dinero'
  | 'Restituci�n del inmueble arrendado'
  | 'TITULO VALOR'
  | 'En general'
  | 'SINGULARES';

export type TipoProceso =
  | 'EJECUTIVO C.G.P'
  | 'De Ejecuci�n'
  | 'Declarativo'
  | 'Codigo General del Proceso'
  | 'Especial'
  | 'EjecucionTramitePosterior'
  | 'Especiales'
  | 'De Liquidaci�n'
  | 'LIQUIDACI�N C.G.P'
  | 'Acci�n de Tutela'
  | 'Otros Asuntos';

export type Departamento =
  | 'BOGOT�'
  | 'CUNDINAMARCA'
  | 'META'
  | 'HUILA'
  | 'ANTIOQUIA'
  | 'ATL�NTICO';

export type TipoConsulta = 'NumeroRadicacion' | 'NombreRazonSocial';

export type outProceso = {
  fechaProceso        : Date | null;
  fechaUltimaActuacion: Date | null;
  juzgado             : Juzgado;
  idProceso           : string;
  idConexion          : number;
  llaveProceso        : string;
  despacho            : string;
  departamento        : string;
  sujetosProcesales   : string;
  esPrivado           : boolean;
  cantFilas           : number;
};
