/**
 * @module types/safe-parse-carpeta
 * @description Prisma Case Folder Type Definitions
 * 
 * Auto-generated type definitions for fully-hydrated Prisma case folder objects.
 * Represents the complete database record structure with all relationships loaded
 * from PostgreSQL via Prisma Client with strong typing.
 * 
 * TYPE HIERARCHY:
 * PrismaCarpeta (root): Complete case folder from database
 *   ├─ PrismaDemanda: Claim/demand information
 *   ├─ PrismaDeudor: Defendant personal data
 *   ├─ PrismaUltimaActuacion: Latest legal action record
 *   ├─ PrismaJuzgado[]: Array of courts (one-to-many)
 *   ├─ PrismaProceso[]: Array of legal processes
 *   ├─ PrismaNota[]: Array of case notes
 *   └─ PrismaTarea[]: Array of case tasks
 * 
 * COMPARISON WITH IntCarpeta:
 * IntCarpeta: Application/domain model (transformed, enriched data)
 * PrismaCarpeta: Database model (direct Prisma schema output)
 * Both represent same entity, different layers (application vs. persistence)
 * 
 * DATA PRECISION:
 * Prisma types use exact database field types:
 * - null for nullable fields
 * - string for monetary (stored as strings in DB for precision)
 * - Date for temporal (PostgreSQL timestamp)
 * - Union types for enum categories
 * 
 * USAGE:
 * Returned by: await client.carpeta.findUnique({ include: {...} })
 * Used for: Database persistence operations, SQL mappings
 * Not used for: Business logic (use IntCarpeta instead)
 * 
 * TO PARSE THIS DATA:
 * ```
 * import { Convert } from \"./safe-parse-carpeta.ts\";
 * const carpeta = Convert.toPrismaCarpeta(jsonString);
 * ```
 */

// To parse this data:
//
//   import { Convert } from "./file";
//
//   const prismaCarpeta = Convert.toPrismaCarpeta(json);

/**
 * @interface PrismaCarpeta
 * @description Root case folder object from Prisma database query.
 * 
 * @property {number} id - Database primary key (auto-generated)
 * @property {number} numero - Case folder number (Colombian filing number)
 * @property {string | null} llaveProceso - Process key from judiciary system
 * @property {string} nombre - Case name (typically defendant name)
 * @property {number[]} idProcesos - Array of process IDs (flattened from processes)
 * @property {Category} category - Case type/classification
 * @property {Date | null} fecha - Case opening/registration date
 * @property {PrismaDemanda | null} Prismademanda - Single demand/claim record
 * @property {PrismaDeudor} deudor - Single debtor/defendant record
 * @property {PrismaUltimaActuacion | null} ultimaActuacion - Latest action
 * @property {PrismaJuzgado[]} juzgados - Related courts
 * @property {PrismaProceso[]} procesos - Related processes
 * @property {PrismaNota[]} notas - Related case notes
 * @property {PrismaTarea[]} tareas - Related case tasks
 */
export interface PrismaCarpeta {
  id             : number;
  numero         : number;
  llaveProceso   : null | string;
  nombre         : string;
  idProcesos     : number[];
  category       : Category;
  fecha          : Date | null;
  Prismademanda  : PrismaDemanda | null;
  deudor         : PrismaDeudor;
  ultimaActuacion: PrismaUltimaActuacion | null;
  juzgados       : PrismaJuzgado[];
  procesos       : PrismaProceso[];
  notas          : PrismaNota[];
  tareas         : PrismaTarea[];
}

export type Category =
  | 'Terminados'
  | 'LiosJuridicos'
  | 'Bancolombia'
  | 'Reintegra'
  | 'Insolvencia';

export interface PrismaDemanda {
  id                     : number;
  departamento           : Departamento;
  capitalAdeudado        : string;
  entregaGarantiasAbogado: Date | null;
  tipoProceso            : TipoProceso;
  mandamientoPago        : Date | null;
  etapaProcesal          : null | string;
  fechaPresentacion      : Date | null;
  municipio              : string;
  obligacion             : string[];
  radicado               : null | string;
  vencimientoPagare      : Date[];
  expediente             : null | string;
  carpetaNumero          : number;
  despacho               : null;
}

export type Departamento =
  | 'BOGOT�'
  | 'CUNDINAMARCA'
  | 'TOLIMA'
  | 'CUN DINAMARCA'
  | 'CUNDINNAMARCA'
  | 'BOYAC�'
  | 'CNDINAMARCA'
  | 'ANTIOQUIA';

export type TipoProceso =
  | 'HIPOTECARIO'
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'ACUMULADO';

export interface PrismaDeudor {
  id             : number;
  cedula         : string;
  primerNombre   : string;
  primerApellido : string;
  segundoNombre  : null | string;
  segundoApellido: null | string;
  direccion      : null | string;
  email          : null | string;
  telCelular     : null | string;
  telFijo        : null | string;
  carpetaNumero  : number;
}

export interface PrismaJuzgado {
  id  : number;
  tipo: string;
  url : string;
}

export interface PrismaNota {
  id           : number;
  date         : Date;
  createdAt    : Date;
  pathname     : null | string;
  carpetaNumero: number;
  content      : string;
  title        : string;
  updatedAt    : Date;
}

export interface PrismaProceso {
  idProceso           : number;
  idConexion          : number;
  llaveProceso        : string;
  fechaProceso        : Date;
  fechaUltimaActuacion: Date | null;
  despacho            : string;
  departamento        : Departamento;
  sujetosProcesales   : string;
  esPrivado           : boolean;
  cantFilas           : number;
  carpetaNumero       : number;
}

export interface PrismaTarea {
  id       : number;
  dueDate  : null;
  carpetaId: number;
  complete : boolean;
  content  : string;
  createdAt: Date;
  title    : string;
  updatedAt: Date;
  subTareas: PrismaSubPrismaTarea[];
}

export interface PrismaSubPrismaTarea {
  text      : string;
  date      : Date;
  isComplete: boolean;
  tareaId   : number;
}

export interface PrismaUltimaActuacion {
  createdAt       : Date;
  idRegActuacion  : number;
  llaveProceso    : string;
  consActuacion   : number;
  fechaActuacion  : Date;
  actuacion       : string;
  anotacion       : null | string;
  fechaInicial    : Date | null;
  fechaRegistro   : Date;
  fechaFinal      : Date | null;
  codRegla        : CodRegla;
  conDocumentos   : boolean;
  cant            : number;
  carpetaNumero   : number;
  procesoIdProceso: null;
}

export type CodRegla = '00                              ';

// Converts JSON strings to/from your types
export class Convert {
  public static toPrismaCarpeta(
    json: string 
  ): PrismaCarpeta {
    return JSON.parse(
      json 
    );
  }

  public static prismaCarpetaToJson(
    value: PrismaCarpeta 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toPrismaDemanda(
    json: string 
  ): PrismaDemanda {
    return JSON.parse(
      json 
    );
  }

  public static PrismademandaToJson(
    value: PrismaDemanda 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toPrismaDeudor(
    json: string 
  ): PrismaDeudor {
    return JSON.parse(
      json 
    );
  }

  public static deudorToJson(
    value: PrismaDeudor 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toPrismaJuzgado(
    json: string 
  ): PrismaJuzgado {
    return JSON.parse(
      json 
    );
  }

  public static juzgadoToJson(
    value: PrismaJuzgado 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toPrismaNota(
    json: string 
  ): PrismaNota {
    return JSON.parse(
      json 
    );
  }

  public static notaToJson(
    value: PrismaNota 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toProceso(
    json: string 
  ): PrismaProceso {
    return JSON.parse(
      json 
    );
  }

  public static procesoToJson(
    value: PrismaProceso 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toPrismaTarea(
    json: string 
  ): PrismaTarea {
    return JSON.parse(
      json 
    );
  }

  public static tareaToJson(
    value: PrismaTarea 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toPrismaSubPrismaTarea(
    json: string 
  ): PrismaSubPrismaTarea {
    return JSON.parse(
      json 
    );
  }

  public static subPrismaTareaToJson(
    value: PrismaSubPrismaTarea 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toUltimaActuacion(
    json: string 
  ): PrismaUltimaActuacion {
    return JSON.parse(
      json 
    );
  }

  public static ultimaActuacionToJson(
    value: PrismaUltimaActuacion 
  ): string {
    return JSON.stringify(
      value 
    );
  }
}
