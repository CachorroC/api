/**
 * @module types/raw-db
 * @description Raw Database/Excel Column Type Definitions
 *
 * Generated type definitions mapping Excel worksheet columns to TypeScript properties.
 * Represents the raw, unvalidated data structure from Excel import before model transformation.
 *
 * DATA FLOW:
 * Excel Columns (String/Date/Number)
 *   ↓
 * xlsx.sheet_to_json<RawDb>() converts to this type
 *   ↓
 * RawDb interface preserves original Excel values (minimal transformation)
 *   ↓
 * Model classes (ClassDemanda, ClassDeudor, etc.) parse/validate/transform
 *   ↓
 * Prisma types (database storage)
 *
 * FIELD ORGANIZATION:
 * - NUMERO: Case folder identifier (primary key analog)
 * - DEMANDADO_*: Defendant/debtor information (name, ID, contact)
 * - JUZGADO_*: Court information (city, court origin, type)
 * - FECHA_*: Multiple date fields for different case stages
 * - OBLIGACION_*, VALOR_*: Financial amounts and obligations
 * - MEDIDA_*, CAUSAL_*: Case measures and termination causes
 * - status fields: ETAPA_PROCESAL, TIPO_PROCESO
 * - category: Added by data/carpetas.ts during import (not from Excel)
 *
 * OPTIONAL FIELDS:
 * Most fields marked with ? (optional) due to sparse Excel data
 * Many sheets don't populate all columns (workflows vary by case type)
 * Null/undefined preserved to indicate missing data
 *
 * TYPE UNIONS:
 * Empty: Fields that can be number | string (alignment with Excel parser)
 * EtapaProcesal: Can be number | string (inconsistent Excel data)
 * Departamento: Fixed enum of Colombian departments
 * Certimail: Notification method (TRUE, FALSE, NO, SI, or dates)
 * FechaNotificacionUnion: Mixed data types from date field
 *
 * DATA QUALITY NOTES:
 * - Departamento includes variations: 'CUNDINAMARCA', 'CUNDINNAMARCA', 'CUN DINAMARCA', 'BOYACÁ'
 * - Date fields stored as strings or numbers (no Date type at import)
 * - Empty enum includes malformed dates mixed with status values
 * - __EMPTY_* fields from xlsx parser indicate unnamed columns
 * - Type inconsistencies handled by model layer during transformation
 *
 * TO PARSE THIS DATA:
 * ```
 * import { RawDBConvert } from "./raw-db.ts";
 * const rawDb = RawDBConvert.toRawDb(jsonString);
 * ```
 */

export interface RawDb {
  NUMERO                                   : number;
  DEMANDADO_IDENTIFICACION?                : number | string;
  DEMANDADO_NOMBRE                         : string;
  DEMANDADO_TELEFONOS?                     : number | string;
  DEMANDADO_DIRECCION?                     : number | string;
  FECHA_VENCIMIENTO_PAGARE?                : number | string;
  OBLIGACION_1?                            : number | string;
  VALOR_CAPITAL_ADEUDADO?                  : number | string;
  FECHA_ENTREGA_GARANTIAS_ABOGADO?         : number | string;
  DEPARTAMENTO                             : Departamento;
  JUZGADO_CIUDAD                           : string;
  JUZGADO_ORIGEN?                          : string;
  TIPO_PROCESO?                            : string;
  JUZGADO_CIUDAD2?                         : string;
  RADICADO?                                : string;
  EXPEDIENTE?                              : string;
  ETAPA_PROCESAL?                          : number | string;
  FECHA_PRESENTACION_DEMANDA?              : number | string;
  FECHA_MANDAMIENTO_DE_PAGO?               : number | string;
  MEDIDA_SOLICITADA?                       : number | string;
  NUMERO_DE_OFICIO?                        : number | string;
  FECHA_DEL_OFICIO?                        : number | string;
  BIENES?                                  : number | string;
  PLACAS_O_NUMERO_DE_MATRICULA?            : number | string;
  DESCRIPCION_DE_LA_MEDIDA?                : number | string;
  FECHA_RETIRO_DE_OFICIOS?                 : number | string;
  FECHA_RADICACION?                        : number | string;
  RESPUESTA_EMBARGO?                       : number | string;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?     : number | string;
  BIENES_SECUESTRADOS?                     : number | string;
  PARQUEADERO?                             : number | string;
  FECHA_SOLICITUD_SENTENCIA?               : number | string;
  CAUSAL_DE_TERMINACION?                   : string;
  OBSERVACIONES?                           : string;
  FECHA_DEVOLUCION_GARANTIAS?              : string;
  category                                 : Category;
  DEMANDADO_EMAIL?                         : number | string;
  CODEUDOR_IDENTIFICACION?                 : number | string;
  CODEUDOR_NOMBRE?                         : number | string;
  CODEUDOR_TELEFONOS?                      : number | string;
  CODEUDOR_DIRECCION?                      : number | string;
  OBLIGACION_2?                            : number | string;
  FECHA_RECIBO_291?                        : number | string;
  RESULTADO_291?                           : number | string;
  FECHA_RECIBO_AVISO_292?                  : number | string;
  RESULTADO_292?                           : number | string;
  FECHA_PUBLICACION_EMPLAZAMIENTO?         : number | string;
  FECHA_APORTA_NOTIFICACION_291?           : number | string;
  TIPO_NOTIFICACION?                       : number | string;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?       : number | string;
  FECHA_CAPTURA?                           : number | string;
  FECHA_SECUESTRO?                         : number | string;
  VALOR_COSTAS?                            : number | string;
  FECHA_NOMBRAMIENTO_CURADOR?              : number | string;
  FECHA_AUTO_TERMINACION_PROCESO?          : number | string;
  NOMBRE_SECUESTRE?                        : number | string;
  FECHA_SOLICITUD_LIQUIDACION?             : number | string;
  FECHA_APROBACION_LIQUIDACION_DEL_CREDITO?: number | string;
  FECHA_APROBACION_COSTAS?                 : number | string;
  VALOR_AVALUO?                            : number | string;
  FECHA_REMATE?                            : number | string;
  FECHA_ADJUDICACION?                      : number | string;
  FECHA_RADICACION_MEMORIAL_TERMINACION?   : number | string;
  FECHA_ORDENA_MEDIDAS_CAUTELARES?         : number | string;
  FECHA_MANDAMIENTO_PAGO?                  : number | string;
  FECHA_AUTO_NOTIFICADO?                   : number | string;
  RESPESTA_EMBARGO?                        : number | string;
  VALOR_LIQUIDACION_DEL_CREDITO?           : number | string;
  IDENTIFICACION?                          : number | string;
  JUZGADO_EJECUCION?                       : string;
  EXTRA?                                   : string;
  Columna1?                                : string;
  FECHA_CIERRE?                            : string;
  FECHA_PRESENTACION_LIQUIDACION?          : number | string;
  FECHA_APORTA_NOTIFICACION_292?           : number | string;
  EXTRA2?                                  : string;
  FECHA_ULTIMA_ACTUACION?                  : Date;
  ULTIMO_ESTADO_APARECE?                   : number | string;
  FECHA_ULTIMA_REVISION?                   : Date;
  ULTIMO_ESTADO_REVISADO?                  : number | string;
  FECHA_NOTIFICACION?                      : FechaNotificacionEnum | number;
  ULTIMO_MOVIMIENTO_IMPEDIR_DESISTIMIENTO? : number | string;
  FECHA_DE_SUSPENSION_DEL_PROCESO?         : string;
  TERMINO_DE_SUSPENSION?                   : string;
  CERTIMAIL?                               : Certimail;
  FISICO?                                  : Certimail;
  FECHA_SENTENCIA?                         : string;
  FECHA_DE_PRESENTACION_LIQUIDACION?       : string;
  CONTACTO?                                : string;
  Columna4?                                : string;
  Columna3?                                : string;
}

export type Certimail = 'TRUE' | 'FALSE' | 'NO' | 'SI';

export type Departamento = 'CUNDINAMARCA' | 'CUNDINNAMARCA' | 'CUNDINAMARCA ' | 'TOLIMA' | 'CUN DINAMARCA' | 'CUNDINNAMARCA ' | 'BOYACÁ' | 'CUNDINAMRCA' | 'CNDINAMARCA' | 'BOYACA';

export type FechaNotificacionEnum = '9/04/2018' | 'POSITIVO' | 'NEGATIVO' | '10/09/2018' | '21/05/2018' | '08/10/2018' | '|';

export type Category = 'Terminados' | 'Insolvencia' | 'Reintegra' | 'LiosJuridicos' | 'SinTercero' | 'Bancolombia';

// Converts JSON strings to/from your types
export class RawDBConvert {
  public static toRawDb(
    json: string
  ): RawDb {
    return JSON.parse(
      json
    );
  }

  public static rawDbToJson(
    value: RawDb
  ): string {
    return JSON.stringify(
      value
    );
  }
}
