// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rawDb = Convert.toRawDb(json);

export type RawDb = {
  NUMERO: number;
  DEMANDADO_IDENTIFICACION?: Empty;
  DEMANDADO_NOMBRE: string;
  DEMANDADO_TELEFONOS?: Empty;
  DEMANDADO_DIRECCION?: Empty;
  FECHA_VENCIMIENTO_PAGARE?: Empty;
  OBLIGACION_1?: EtapaProcesal;
  VALOR_CAPITAL_ADEUDADO?: EtapaProcesal;
  FECHA_ENTREGA_GARANTIAS_ABOGADO?: Empty;
  DEPARTAMENTO: Departamento;
  JUZGADO_CIUDAD: string;
  JUZGADO_ORIGEN?: string;
  TIPO_PROCESO?: string;
  JUZGADO_CIUDAD2?: string;
  RADICADO?: string;
  EXPEDIENTE?: EtapaProcesal;
  ETAPA_PROCESAL?: EtapaProcesal;
  FECHA_PRESENTACION_DEMANDA?: Empty;
  FECHA_MANDAMIENTO_DE_PAGO?: Empty;
  MEDIDA_SOLICITADA?: Empty;
  NUMERO_DE_OFICIO?: Empty;
  FECHA_DEL_OFICIO?: Empty;
  BIENES?: Empty;
  PLACAS_O_NUMERO_DE_MATRICULA?: Empty;
  DESCRIPCION_DE_LA_MEDIDA?: Empty;
  FECHA_RETIRO_DE_OFICIOS?: Empty;
  FECHA_RADICACION?: Empty;
  RESPUESTA_EMBARGO?: Empty;
  FECHA_SOLICITUD_CAPTURA_O_SECUESTRO?: Empty;
  BIENES_SECUESTRADOS?: Empty;
  PARQUEADERO?: Empty;
  FECHA_SOLICITUD_SENTENCIA?: Empty;
  CAUSAL_DE_TERMINACION?: string;
  OBSERVACIONES?: string;
  FECHA_DEVOLUCION_GARANTIAS?: Empty;
  category: Category;
  DEMANDADO_EMAIL?: Empty;
  CODEUDOR_IDENTIFICACION?: Empty;
  CODEUDOR_NOMBRE?: Empty;
  CODEUDOR_TELEFONOS?: Empty;
  CODEUDOR_DIRECCION?: Empty;
  OBLIGACION_2?: EtapaProcesal;
  FECHA_RECIBO_291?: Empty;
  RESULTADO_291?: Empty;
  FECHA_RECIBO_AVISO_292?: Empty;
  RESULTADO_292?: Empty;
  FECHA_PUBLICACION_EMPLAZAMIENTO?: Empty;
  FECHA_APORTA_NOTIFICACION_291?: Empty;
  TIPO_NOTIFICACION?: Empty;
  FECHA_DECRETO_SECUESTRO_O_CAPTURA?: Empty;
  FECHA_CAPTURA?: Empty;
  FECHA_SECUESTRO?: Empty;
  VALOR_COSTAS?: Empty;
  FECHA_NOMBRAMIENTO_CURADOR?: Empty;
  FECHA_AUTO_TERMINACION_PROCESO?: Empty;
  NOMBRE_SECUESTRE?: Empty;
  FECHA_SOLICITUD_LIQUIDACION?: Empty;
  FECHA_APROBACION_LIQUIDACION_DEL_CREDITO?: Empty;
  FECHA_APROBACION_COSTAS?: Empty;
  VALOR_AVALUO?: EtapaProcesal;
  FECHA_REMATE?: EtapaProcesal;
  FECHA_ADJUDICACION?: Empty;
  FECHA_RADICACION_MEMORIAL_TERMINACION?: Empty;
  FECHA_ORDENA_MEDIDAS_CAUTELARES?: Empty;
  FECHA_MANDAMIENTO_PAGO?: Empty;
  FECHA_AUTO_NOTIFICADO?: Empty;
  RESPESTA_EMBARGO?: Empty;
  VALOR_LIQUIDACION_DEL_CREDITO?: EtapaProcesal;
  "  "?: Empty;
  JUZGADO_EJECUCION?: string;
  EXTRA?: string;
  FECHA_CIERRE?: string;
  FECHA_PRESENTACION_LIQUIDACION?: Empty;
  "pendiente cesion del  "?: string;
  FECHA_APORTA_NOTIFICACION_292?: Empty;
  FECHA_ULTIMA_REVISION?: Date;
  ULTIMO_ESTADO_REVISADO?: Empty;
  FECHA_NOTIFICACION?: FechaNotificacionUnion;
  ULTIMO_MOVIMIENTO_IMPEDIR_DESISTIMIENTO?: Empty;
  FECHA_DE_SUSPENSION_DEL_PROCESO?: string;
  TERMINO_DE_SUSPENSION?: string;
  CERTIMAIL?: Certimail;
  FISICO?: Certimail;
  FECHA_SENTENCIA?: string;
  FECHA_DE_PRESENTACION_LIQUIDACION?: string;
  Columna1?: string;
  FECHA_ULTIMA_ACTUACION?: Date;
  ULTIMO_ESTADO_APARECE?: Empty;
  CONTACTO?: string;
  Columna4?: string;
  __EMPTY_1?: Date;
  __EMPTY_2?: Date;
  Columna3?: string;
  __EMPTY_3?: string;
  __EMPTY_4?: number;
};

export type Empty = number | string;

export type Certimail = "TRUE" | "FALSE" | "NO" | "SI" | "04/10/2018";

export type Departamento =
  | "CUNDINAMARCA"
  | "CUNDINNAMARCA"
  | "CUNDINAMARCA "
  | "TOLIMA"
  | "CUN DINAMARCA"
  | "CUNDINNAMARCA "
  | "BOYACÁ"
  | "CUNDINAMRCA"
  | "CNDINAMARCA"
  | "BOYACA";

export type EtapaProcesal = number | string;

export type FechaNotificacionUnion = Date | FechaNotificacionEnum | number;

export type FechaNotificacionEnum =
  | "9/04/2018"
  | "POSITIVO"
  | "NEGATIVO"
  | "10/09/2018"
  | "21/05/2018"
  | "08/10/2018"
  | "|";

export type Category =
  | "Terminados"
  | "Insolvencia"
  | "Reintegra"
  | "Lios Juridicos"
  | "Sin Tercero"
  | "Bancolombia";

// Converts JSON strings to/from your types
export class Convert {
  public static toRawDb(json: string): RawDb[] {
    return JSON.parse(json);
  }

  public static rawDbToJson(value: RawDb[]): string {
    return JSON.stringify(value);
  }
}
