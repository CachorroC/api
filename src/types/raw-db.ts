// To parse this data:
//
//   import { Convert, RawDb } from "./file";
//
//   const welcome = Convert.toRawDb(json);
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rawDb = Convert.toRawDb(json);
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rawDb = Convert.toRawDb(json);

import { Category } from './carpetas';

export interface RawDb {
  /*   [ x: string ]: string | number | undefined | Date | null; */

  __EMPTY?                                 : string;
  BIENES_SECUESTRADOS?                     : number | string;
  BIENES?                                  : number | string;
  category                                 : Category;
  CAUSAL_DE_TERMINACION?                   : string;
  CERTIMAIL?                               : Certimail;
  CODEUDOR_DIRECCION?                      : number | string;
  CODEUDOR_IDENTIFICACION?                 : number | string;
  CODEUDOR_NOMBRE?                         : number | string;
  CODEUDOR_TELEFONOS?                      : number | string;
  CONTACTO?                                : number | string;
  DEMANDADO_DIRECCION?                     : number | string;
  DEMANDADO_EMAIL?                         : number | string;
  DEMANDADO_IDENTIFICACION                 : number | string;
  DEMANDADO_NOMBRE                         : string;
  DEMANDADO_TELEFONOS?                     : number | string;
  DEPARTAMENTO?                            : Departamento;
  DESCRIPCION_DE_LA_MEDIDA?                : number | string;
  ETAPA_PROCESAL?                          : number | string;
  EXPEDIENTE?                              : number | string;
  EXTRA?                                   : string;
  EXTRA2?                                  : string;
  FECHA_ADJUDICACION?                      : number | string;
  FECHA_APORTA_NOTIFICACION_291?           : number | string;
  FECHA_APORTA_NOTIFICACION_292?           : number | string;
  FECHA_APROBACION_COSTAS?                 : number | string;
  FECHA_APROBACION_LIQUIDACION_DEL_CREDITO?: number | string;
  FECHA_AUTO_NOTIFICADO?                   : number | string;
  FECHA_AUTO_TERMINACION_PROCESO?          : number | string;
  FECHA_CAPTURA?                           : number | string;
  FECHA_CIERRE?                            : string;
  FECHA_DE_PRESENTACION_LIQUIDACION?       : string;
  FECHA_DE_SUSPENSION_DEL_PROCESO?         : string;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?       : number | string;
  FECHA_DEL_OFICIO?                        : number | string;
  FECHA_DEVOLUCION_GARANTIAS?              : number | string;
  FECHA_ENTREGA_GARANTIAS_ABOGADO?         : number | string;
  FECHA_MANDAMIENTO_DE_PAGO?               : number | string;
  FECHA_MANDAMIENTO_PAGO?                  : number | string;
  FECHA_NOMBRAMIENTO_CURADOR?              : number | string;
  FECHA_NOTIFICACION?                      : Date | FechaNotificacionEnum | number;
  FECHA_ORDENA_MEDIDAS_CAUTELARES?         : number | string;
  FECHA_PRESENTACION_DEMANDA?              : number | string;
  FECHA_PRESENTACION_LIQUIDACION?          : number | string;
  FECHA_PUBLICACION_EMPLAZAMIENTO?         : number | string;
  FECHA_RADICACION_MEMORIAL_TERMINACION?   : number | string;
  FECHA_RADICACION?                        : number | string;
  FECHA_ULTIMA_REVISION?                   : number | string;

  FECHA_ULTIMA_ACTUACION?                 : number | string;
  FECHA_RECIBO_291?                       : number | string;
  FECHA_RECIBO_AVISO_292?                 : number | string;
  FECHA_REMATE?                           : number | string;
  FECHA_RETIRO_DE_OFICIOS?                : number | string;
  FECHA_SECUESTRO?                        : number | string;
  FECHA_SENTENCIA?                        : string;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?    : number | string;
  FECHA_SOLICITUD_LIQUIDACION?            : number | string;
  FECHA_SOLICITUD_SENTENCIA?              : number | string;
  FECHA_VENCIMIENTO_PAGARE?               : number | string;
  FISICO?                                 : Certimail;
  JUZGADO_CIUDAD_1?                       : string;
  JUZGADO_CIUDAD                          : number | string;
  JUZGADO_EJECUCION?                      : string;
  JUZGADO_ORIGEN?                         : string;
  MEDIDA_SOLICITADA?                      : number | string;
  NOMBRE_SECUESTRE?                       : number | string;
  NUMERO_DE_OFICIO?                       : number | string;
  NUMERO                                  : number | string;
  OBLIGACION_1?                           : number | string;
  OBLIGACION_2?                           : number | string;
  OBSERVACIONES?                          : string;
  PARQUEADERO?                            : number | string;
  PLACAS_O_NUMERO_DE_MATRICULA?           : number | string;
  RADICADO?                               : string;
  RESPESTA_EMBARGO?                       : number | string;
  RESPUESTA_EMBARGO?                      : number | string;
  RESULTADO_291?                          : number | string;
  RESULTADO_292?                          : number | string;
  TERMINO_DE_SUSPENSION?                  : string;
  TIPO_NOTIFICACION?                      : number | string;
  TIPO_PROCESO?                           : TipoProceso;
  ULTIMO_MOVIMIENTO_IMPEDIR_DESISTIMIENTO?: string;
  VALOR_AVALUO?                           : number | string;
  VALOR_CAPITAL_ADEUDADO?                 : number | string;
  VALOR_COSTAS?                           : number | string;
  VALOR_LIQUIDACION_DEL_CREDITO?          : number | string;
}

export type Certimail = 'SI' | 'NO' | 'FALSE' | 'TRUE' | '04/10/2018';

export type Departamento =
  | 'CUNDINAMARCA'
  | 'CUNDINNAMARCA'
  | 'CUNDINAMARCA '
  | 'TOLIMA'
  | 'CUN DINAMARCA'
  | 'CUNDINNAMARCA '
  | 'BOYACÁ'
  | 'CUNDINAMRCA'
  | 'CNDINAMARCA'
  | 'BOYACA'
  | 'ATLANTICO';

export type FechaNotificacionEnum =
  | '9/04/2018'
  | 'POSITIVO'
  | 'NEGATIVO'
  | '10/09/2018'
  | '21/05/2018'
  | '08/10/2018'
  | '|';

export type TipoProceso =
  | 'HIPOTECARIO'
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'SINGULAR ACUMULADO CON HIPOTECARIO'
  | 'SINGULAR ACUM HIPOTECARIO'
  | 'PRENDARO'
  | ' HIPOTECARIO'
  | '7 CME'
  | 'HMM PISO 1'
  | '  SINGULAR'
  | 'HIPOTECARIA'
  | '5 CME'
  | 'HIPOTECARO'
  | 'SINGULAR ACUMULADO CON HIPOTECARIO CAJA SOCIAL'
  | 'SOACHA'
  | 'HIPOTECARIO '
  | '18 PROMISCUO PCC'
  | 'SINGULAR ';

// Converts JSON strings to/from your types
export class ConvertRawDb {
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

// Converts JSON strings to/from your types

export interface RawWorkSheets {
  BANCOLOMBIA   : Bancolombia[];
  INSOLVENCIA   : Insolvencia[];
  LIOS_JURIDICOS: LiosJuridico[];
  REINTEGRA     : Reintegra[];
  TERMINADOS    : Terminado[];
}

export interface Bancolombia {
  BIENES?                             : string;
  DESCRIPCION_MEDIDA?                 : string;
  DEUDOR_CEDULA                       : number | string;
  DEUDOR_CONTACTO?                    : number | string;
  DEUDOR_DIRECCION?                   : string;
  DEUDOR_EMAIL?                       : string;
  DEUDOR_NOMBRE                       : string;
  DEUDOR_TELEFONOS?                   : number | string;
  ETAPA_PROCESAL?                     : string;
  EXPEDIENTE?                         : string;
  EXTRA                               : string;
  FECHA_APORTA_NOTIFICACION_291?      : Date;
  FECHA_APORTA_NOTIFICACION_292?      : Date;
  FECHA_AUTO_NOTIFICADO?              : Date;
  FECHA_CAPTURA_O_SECUESTRO?          : Date;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?  : Date;
  FECHA_ENTREGA_GARANTIAS_ABOGADO     : Date;
  FECHA_MANDAMIENTO_PAGO?             : string;
  FECHA_PRESENTACION_DEMANDA?         : string;
  FECHA_RADICACION?                   : Date;
  FECHA_RETIRO_OFICIOS?               : string;
  FECHA_SECUESTRO?                    : string;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?: string;
  FECHA_VENCIMIENTO_PAGARE?           : string;
  JUZGADO_CIUDAD                      : string;
  JUZGADO_DE_ORIGEN?                  : string;
  JUZGADO_DEPARTAMENTO                : BancolombiaJuzgadoDepartamento;
  JUZGADO_UBICACION?                  : string;
  MEDIDA_SOLICITADA?                  : string;
  NUMERO                              : number;
  OBLIGACION_0?                       : number | string;
  OBSERVACIONES?                      : string;
  OFICIO_NUMERO?                      : number | string;
  PLACAS_O_MATRICULA?                 : string;
  RADICADO?                           : string;
  RESPUESTA_EMBARGO?                  : string;
  TIPO_DE_NOTIFICACION?               : string;
  TIPO_PROCESO                        : BancolombiaTipoProceso;
  VALOR_CAPITAL_ADEUDADO?             : number;
  CERTIMAIL?                          : Certimail;
  CODEUDOR_CEDULA?                    : number | string;
  CODEUDOR_NOMBRE?                    : string;
  FECHA_OFICIO?                       : string;
  FECHA_ORDENA_MEDIDAS_CAUTELARES?    : Date;
  FECHA_RECIBO_291?                   : Date;
  FISICO?                             : Certimail;
  JUZGADO_DE_EJECUCION?               : string;
  RESULTADO_291?                      : Resultado291;
  RESULTADO_292?                      : Resultado291;
  FECHA_PRESENTACION_LIQUIDACION?     : string;
  FECHA_SOLICITUD_LIQUIDACION?        : Date;
  VALOR_AVALUO?                       : string;
  CODEUDOR_DIRECCION?                 : string;
  CODEUDOR_TELEFONOS?                 : number | string;
  FECHA_APROBACION_LIQUIDACION?       : Date;
  FECHA_SENTENCIA?                    : Date;
  VALOR_LIQUIDACION?                  : number;
  FECHA_RECIBO_292?                   : Date;
  OBLIGACION_1?                       : number | string;
  VALOR_COSTAS?                       : number;
  FECHA_APROBACION_COSTAS?            : Date;
}

export type BancolombiaJuzgadoDepartamento =
  | 'CUNDINAMARCA'
  | 'BOYACA'
  | 'ATLANTICO';

export type Resultado291 =
  | 'POSITIVO'
  | 'ABIERTO'
  | 'NEGATIVO'
  | '02/11/2018'
  | 'N/A';

export type BancolombiaTipoProceso =
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'HIPOTECARIO'
  | 'HIPOTECARO'
  | 'SINGULAR ';

export interface Insolvencia {
  BIENES                                : number | string;
  CAUSAL_TERMINACION?                   : string;
  CODEUDOR_CEDULA?                      : Resultado291;
  CODEUDOR_DIRECCION?                   : Resultado291;
  CODEUDOR_NOMBRE?                      : Resultado291;
  CODEUDOR_TELEFONOS?                   : Resultado291;
  DEUDOR_CEDULA                         : number;
  DEUDOR_DIRECCION                      : string;
  DEUDOR_EMAIL                          : number | string;
  DEUDOR_NOMBRE                         : string;
  DEUDOR_TELEFONOS                      : string;
  ETAPA_PROCESAL                        : number | string;
  EXPEDIENTE                            : string;
  EXTRA                                 : string;
  FECHA_ADJUDICACION?                   : Date | number;
  FECHA_APORTA_NOTIFICACION_291         : number | string;
  FECHA_APROBACION_COSTAS?              : number | string;
  FECHA_AUTO_NOTIFICADO?                : Resultado291;
  FECHA_CAPTURA?                        : string;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?    : number | string;
  FECHA_DEVOLUCION_GARANTIAS?           : string;
  FECHA_ENTREGA_GARANTIAS_ABOGADO       : number | string;
  FECHA_MANDAMIENTO_PAGO                : number | string;
  FECHA_OFICIO?                         : number | string;
  FECHA_ORDENA_MEDIDAS_CAUTELARES       : Resultado291;
  FECHA_PRESENTACION_DEMANDA            : string;
  FECHA_RADICACION?                     : string;
  FECHA_RADICACION_MEMORIAL_TERMINACION?: string;
  FECHA_SECUESTRO?                      : string;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?  : string;
  FECHA_SOLICITUD_SENTENCIA?            : Date | Resultado291;
  FECHA_VENCIMIENTO_PAGARE              : number | string;
  JUZGADO_CIUDAD                        : number | string;
  JUZGADO_DE_ORIGEN                     : string;
  JUZGADO_DEPARTAMENTO                  : BancolombiaJuzgadoDepartamento;
  JUZGADO_UBICACION                     : string;
  MEDIDA_SOLICITADA                     : Resultado291;
  NOMBRE_SECUESTRO?                     : string;
  NUMERO                                : number;
  OBLIGACION_0                          : number;
  OBLIGACION_1                          : number | string;
  OFICIO_NUMERO?                        : OficioNumero;
  RADICADO                              : string;
  RESPUESTA_EMBARGO                     : number | string;
  TIPO_PROCESO                          : BancolombiaTipoProceso;
  VALOR_CAPITAL_ADEUDADO                : number;
  VALOR_COSTAS?                         : string;
  VALOR_LIQUIDACION?                    : string;
  DESCRIPCION_MEDIDA?                   : number | string;
  FECHA_NOMBRAMIENTO_CURADOR?           : string;
  FECHA_RETIRO_OFICIOS?                 : string;
  PLACAS_O_MATRICULA?                   : string;
  TIPO_DE_NOTIFICACION?                 : string;
  BIENES_SECUESTRADOS?                  : string;
  FECHA_APORTA_NOTIFICACION_292?        : string;
  FECHA_APROBACION_LIQUIDACION?         : Date;
  FECHA_PRESENTACION_LIQUIDACION?       : Resultado291;
  FECHA_PUBLICACION_EMPLAZAMIENTO?      : Resultado291;
  FECHA_RECIBO_292?                     : Date | Resultado291;
  FECHA_REMATE?                         : number;
  FECHA_SENTENCIA?                      : Resultado291;
  FECHA_SOLICITUD_LIQUIDACION?          : Resultado291;
  PARQUEADERO?                          : Resultado291;
  RESULTADO_291?                        : string;
  RESULTADO_292?                        : string;
  VALOR_AVALUO?                         : number;
}

export type OficioNumero =
  | 'EMPLAZAMIENTO'
  | 'CERTIMAIL'
  | 'PERSONAL'
  | 'CORREO'
  | 'OK'
  | 'AVISO'
  | 'CORREO // DESISTIMIENDO DE NELIDA'
  | 'N/A'
  | 'FISICA';

export interface LiosJuridico {
  DEUDOR_CEDULA                  : number;
  DEUDOR_DIRECCION               : string;
  DEUDOR_EMAIL                   : string;
  DEUDOR_NOMBRE                  : string;
  DEUDOR_TELEFONOS               : number | string;
  EXPEDIENTE                     : string;
  EXTRA                          : string;
  EXTRA_2                        : string;
  FECHA_CIERRE                   : string;
  FECHA_ENTREGA_GARANTIAS_ABOGADO: string;
  FECHA_VENCIMIENTO_PAGARE?      : Date;
  JUZGADO_CIUDAD                 : string;
  JUZGADO_DE_EJECUCION?          : string;
  JUZGADO_DE_ORIGEN              : string;
  JUZGADO_DEPARTAMENTO           : BancolombiaJuzgadoDepartamento;
  JUZGADO_UBICACION              : string;
  NUMERO                         : number | string;
  OBLIGACION_0                   : number | string;
  OBLIGACION_1                   : string;
  RADICADO                       : string;
  TIPO_PROCESO                   : BancolombiaTipoProceso;
  VALOR_CAPITAL_ADEUDADO         : number | string;
  CODEUDOR_CEDULA?               : number;
  CODEUDOR_DIRECCION?            : string;
  CODEUDOR_NOMBRE?               : string;
  CODEUDOR_TELEFONOS?            : number;
}

export interface Reintegra {
  BIENES?                             : string;
  CERTIMAIL?                          : Certimail;
  CODEUDOR_CEDULA?                    : number | string;
  CODEUDOR_DIRECCION?                 : string;
  CODEUDOR_NOMBRE?                    : string;
  CODEUDOR_TELEFONOS?                 : CodeudorTelefonosEnum | number;
  DESCRIPCION_MEDIDA?                 : string;
  DEUDOR_CEDULA                       : number | string;
  DEUDOR_DIRECCION                    : string;
  DEUDOR_NOMBRE                       : string;
  DEUDOR_TELEFONOS                    : number | string;
  ETAPA_PROCESAL?                     : string;
  EXPEDIENTE                          : string;
  EXTRA?                              : string;
  FECHA_APORTA_NOTIFICACION_292?      : string;
  FECHA_AUTO_NOTIFICADO?              : number | string;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?  : string;
  FECHA_ENTREGA_GARANTIAS_ABOGADO     : string;
  FECHA_MANDAMIENTO_PAGO?             : string;
  FECHA_NOMBRAMIENTO_CURADOR?         : Date | Resultado291;
  FECHA_OFICIO?                       : string;
  FECHA_ORDENA_MEDIDAS_CAUTELARES?    : number | string;
  FECHA_PRESENTACION_DEMANDA?         : string;
  FECHA_PUBLICACION_EMPLAZAMIENTO?    : Date | Resultado291;
  FECHA_RADICACION?                   : number | string;
  FECHA_RECIBO_291?                   : string;
  FECHA_RECIBO_292?                   : string;
  FECHA_RETIRO_OFICIOS?               : string;
  FECHA_VENCIMIENTO_PAGARE?           : string;
  FISICO?                             : Certimail;
  JUZGADO_CIUDAD                      : string;
  JUZGADO_DE_EJECUCION?               : string;
  JUZGADO_DE_ORIGEN                   : string;
  JUZGADO_DEPARTAMENTO                : ReintegraJuzgadoDepartamento;
  JUZGADO_UBICACION                   : string;
  MEDIDA_SOLICITADA?                  : string;
  NUMERO                              : number;
  OBLIGACION_0                        : number | string;
  OBLIGACION_1                        : number | string;
  OFICIO_NUMERO?                      : number | string;
  PLACAS_O_MATRICULA?                 : string;
  RADICADO                            : string;
  RESPUESTA_EMBARGO?                  : string;
  RESULTADO_291?                      : Date | Resultado291;
  RESULTADO_292?                      : Resultado291;
  TIPO_DE_NOTIFICACION?               : OficioNumero;
  TIPO_PROCESO?                       : ReintegraTipoProceso;
  VALOR_CAPITAL_ADEUDADO              : number;
  DEUDOR_EMAIL?                       : string;
  FECHA_APORTA_NOTIFICACION_291?      : string;
  FECHA_SOLICITUD_LIQUIDACION?        : string;
  FECHA_SOLICITUD_SENTENCIA?          : string;
  VALOR_LIQUIDACION?                  : number | string;
  FECHA_APROBACION_LIQUIDACION?       : number | string;
  FECHA_PRESENTACION_LIQUIDACION?     : string;
  FECHA_SENTENCIA?                    : string;
  VALOR_COSTAS?                       : number | string;
  FECHA_CAPTURA_O_SECUESTRO?          : FechaCapturaOSecuestro;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?: string;
  PARQUEADERO?                        : Parqueadero;
  BIENES_SECUESTRADOS?                : Resultado291;
  FECHA_SECUESTRO?                    : Resultado291;
  NOMBRE_SECUESTRO?                   : Resultado291;
}

export type CodeudorTelefonosEnum =
  | 'N/A'
  | '2067151//3015485509'
  | '7264921//3203987609'
  | '5643632//3125598323'
  | '3118869672'
  | '3144245852'
  | '3114472300';

export type FechaCapturaOSecuestro =
  | '     '
  | 'A LA ESPERA'
  | '19/11/2018'
  | 'N/A';

export type ReintegraJuzgadoDepartamento =
  | 'CUNDINAMARCA'
  | 'TOLIMA'
  | 'CUNDINNAMARCA'
  | 'BOYACÁ'
  | 'CUNDINAMRCA'
  | 'CNDINAMARCA';

export type Parqueadero = 'LA PRINCIPAL SAS' | 'N/A';

export type ReintegraTipoProceso =
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'HMM PISO 1'
  | '  SINGULAR'
  | '5 CME';

export interface Terminado {
  BIENES?                                    : number | string;
  BIENES_SECUESTRADOS?                       : number | string;
  CAUSAL_TERMINACION?                        : string;
  DESCRIPCION_MEDIDA?                        : number | string;
  DEUDOR_CEDULA                              : number | string;
  DEUDOR_DIRECCION?                          : number | string;
  DEUDOR_EMAIL?                              : string;
  DEUDOR_NOMBRE                              : string;
  DEUDOR_TELEFONOS?                          : number | string;
  ETAPA_PROCESAL?                            : number | string;
  EXPEDIENTE?                                : number | string;
  EXTRA?                                     : string;
  FECHA_DEVOLUCION_GARANTIAS?                : number | string;
  FECHA_ENTREGA_GARANTIAS_ABOGADO?           : string;
  FECHA_MANDAMIENTO_PAGO?                    : number | string;
  FECHA_OFICIO?                              : number | string;
  FECHA_PRESENTACION_DEMANDA?                : number | string;
  FECHA_RADICACION?                          : number | string;
  FECHA_RETIRO_OFICIOS?                      : number | string;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?       : number | string;
  FECHA_SOLICITUD_SENTENCIA?                 : string;
  FECHA_VENCIMIENTO_PAGARE?                  : null | string;
  JUZGADO_CIUDAD                             : string;
  JUZGADO_DE_ORIGEN?                         : string;
  JUZGADO_DEPARTAMENTO                       : TerminadoJuzgadoDepartamento;
  JUZGADO_UBICACION?                         : string;
  MEDIDA_SOLICITADA?                         : number | string;
  NUMERO                                     : number;
  OBLIGACION_0?                              : number | string;
  OFICIO_NUMERO?                             : number | string;
  PARQUEADERO?                               : number | string;
  PLACAS_O_MATRICULA?                        : number | string;
  RADICADO?                                  : string;
  RESPUESTA_EMBARGO?                         : number | string;
  TIPO_PROCESO?                              : TerminadoTipoProceso;
  VALOR_CAPITAL_ADEUDADO?                    : number | string;
  CODEUDOR_CEDULA?                           : number | string;
  CODEUDOR_DIRECCION?                        : number | string;
  CODEUDOR_NOMBRE?                           : number | string;
  CODEUDOR_TELEFONOS?                        : number | string;
  FECHA_APORTA_NOTIFICACION_291?             : number | string;
  FECHA_APORTA_NOTIFICACION_292?             : number | string;
  FECHA_AUTO_NOTIFICADO?                     : Date | FechaAutoNotificadoEnum | number;
  FECHA_CAPTURA_O_SECUESTRO?                 : number | string;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?         : number | string;
  FECHA_ORDENA_MEDIDAS_CAUTELARES?           : number | string;
  FECHA_PUBLICACION_EMPLAZAMIENTO?           : number | string;
  FECHA_RECIBO_292?                          : number | string;
  FECHA_SECUESTRO?                           : number | string;
  OBLIGACION_1?                              : number | string;
  RESULTADO_291?                             : number | string;
  RESULTADO_292?                             : number | string;
  TIPO_DE_NOTIFICACION?                      : number | string;
  VALOR_COSTAS?                              : number | string;
  FECHA_AUTO_TERMINACION_PROCESO?            : number | string;
  FECHA_NOMBRAMIENTO_CURADOR?                : number | string;
  FECHA_ADJUDICACION?                        : number | string;
  FECHA_APROBACION_COSTAS?                   : number | string;
  FECHA_APROBACION_LIQUIDACION?              : number | string;
  FECHA_REMATE?                              : number | string;
  FECHA_SOLICITUD_LIQUIDACION?               : number | string;
  NOMBRE_SECUESTRO?                          : number | string;
  VALOR_AVALUO?                              : number | string;
  FECHA_RADICACION_MEMORIAL_TERMINACION?     : number | string;
  FECHA_PRESENTACION_LIQUIDACION?            : number | string;
  VALOR_LIQUIDACION?                         : number | string;
  ' ULTIMO_MOVIMIENTO_IMPEDIR_DESISTIMIENTO'?: string;
  FECHA_SUSPENSION_PROCESO?                  : string;
  'TERMINO_SUSPENSION '?                     : string;
  FECHA_SENTENCIA?                           : string;
}

export type FechaAutoNotificadoEnum =
  | 'N/A'
  | 'POSITIVO'
  | 'NEGATIVO'
  | '9/04/2018'
  | '10/09/2018'
  | '21/05/2018'
  | '08/10/2018'
  | '|';

export type TerminadoJuzgadoDepartamento =
  | 'CUNDINAMARCA'
  | 'CUNDINNAMARCA'
  | 'CUNDINAMARCA '
  | 'CUN DINAMARCA'
  | 'CUNDINNAMARCA ';

export type TerminadoTipoProceso =
  | 'HIPOTECARIO'
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'SINGULAR ACUMULADO CON HIPOTECARIO'
  | 'SINGULAR ACUM HIPOTECARIO'
  | 'PRENDARO'
  | ' HIPOTECARIO'
  | '7 CME'
  | 'HIPOTECARIA'
  | 'SINGULAR ACUMULADO CON HIPOTECARIO CAJA SOCIAL'
  | 'SOACHA'
  | 'HIPOTECARIO '
  | '18 PROMISCUO PCC';

// Converts JSON strings to/from your types
export class Convert {
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
  public static toRawWorkSheets(
    json: string 
  ): RawWorkSheets {
    return JSON.parse(
      json 
    );
  }

  public static welcomeToJson(
    value: RawWorkSheets 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toBancolombia(
    json: string 
  ): Bancolombia {
    return JSON.parse(
      json 
    );
  }

  public static bancolombiaToJson(
    value: Bancolombia 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toInsolvencia(
    json: string 
  ): Insolvencia {
    return JSON.parse(
      json 
    );
  }

  public static insolvenciaToJson(
    value: Insolvencia 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toLiosJuridico(
    json: string 
  ): LiosJuridico {
    return JSON.parse(
      json 
    );
  }

  public static liosJuridicoToJson(
    value: LiosJuridico 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toReintegra(
    json: string 
  ): Reintegra {
    return JSON.parse(
      json 
    );
  }

  public static reintegraToJson(
    value: Reintegra 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toTerminado(
    json: string 
  ): Terminado {
    return JSON.parse(
      json 
    );
  }

  public static terminadoToJson(
    value: Terminado 
  ): string {
    return JSON.stringify(
      value 
    );
  }
}
