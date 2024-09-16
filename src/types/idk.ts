// To parse this data:
//
//   import { Convert } from "./file";
//
//   const intCarpeta = Convert.toIntCarpeta(json);

export interface IntCarpeta {
  category: Category;
  codeudor: Codeudor | null;
  demanda: Demanda;
  deudor: Deudor;
  fecha: Date | null;
  idProcesos: number[];
  idRegUltimaAct: null;
  llaveProceso: string;
  notificacion: Notificacion | null;
  numero: number;
  revisado: boolean;
  terminado: boolean;
  tipoProceso: TipoProceso;
  ultimaActuacion: Actuacione | null;
  updatedAt: Date;
  nombre: string;
  _idProcesos: Actuaciones;
  _procesos: Actuaciones;
  _actuaciones: Actuaciones;
  actuaciones: Actuacione[];
  procesos: Proceso[];
}

export interface Actuaciones {}

export interface Actuacione {
  idRegActuacion: number;
  llaveProceso: string;
  consActuacion: number;
  fechaActuacion: Date;
  actuacion: string;
  anotacion: null | string;
  fechaInicial: Date | null;
  fechaFinal: Date | null;
  fechaRegistro: Date;
  codRegla: CodRegla;
  conDocumentos: boolean;
  cant: number;
  idProceso: number;
  isUltimaAct: boolean;
  createdAt?: Date;
}

export type CodRegla = "00                              ";

export type Category =
  | "Terminados"
  | "LiosJuridicos"
  | "Bancolombia"
  | "Reintegra"
  | "Insolvencia";

export interface Codeudor {
  nombre: null | string;
  cedula: null | string;
  direccion: null | string;
  telefono: null | string;
  id: number;
  carpetaNumero: number;
}

export interface Demanda {
  obligacion: string[];
  llaveProceso: string;
  medidasCautelares: MedidasCautelares | null;
  capitalAdeudado: number | null;
  departamento: DemandaDepartamento;
  despacho: null;
  entregaGarantiasAbogado: Date | null;
  etapaProcesal: null | string;
  expediente: string;
  fechaPresentacion: Date[];
  mandamientoPago: Date | null;
  municipio: string;
  radicado: null | string;
  tipoProceso: TipoProceso;
  vencimientoPagare: string[];
}

export type DemandaDepartamento =
  | "CUNDINAMARCA"
  | "CUNDINNAMARCA"
  | "TOLIMA"
  | "CUN DINAMARCA"
  | "BOYACÁ"
  | "CUNDINAMRCA"
  | "CNDINAMARCA"
  | "ATLANTICO";

export interface MedidasCautelares {
  fechaOrdenaMedida: null | string;
  medidaSolicitada: null | string;
}

export type TipoProceso =
  | "HIPOTECARIO"
  | "PRENDARIO"
  | "SINGULAR"
  | "ACUMULADO";

export interface Deudor {
  tel: Tel;
  primerNombre: string;
  segundoNombre: null | string;
  primerApellido: string;
  segundoApellido: null | string;
  cedula: number | null;
  direccion: null | string;
  email: null | string;
}

export interface Tel {
  fijo: number | null;
  celular: number | null;
}

export interface Notificacion {
  notifiers: Notifier[];
  certimail: boolean | null;
  fisico: boolean | null;
  autoNotificado: null | string;
}

export interface Notifier {
  tipo: string;
  fechaRecibido: Date | null;
  fechaAporta: Date | null;
  resultado: boolean | null;
}

export interface Proceso {
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso: Date;
  fechaUltimaActuacion: Date | null;
  despacho: string;
  departamento: ProcesoDepartamento;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
  juzgado: Juzgado;
}

export type ProcesoDepartamento = "BOGOTÁ" | "CUNDINAMARCA" | "ANTIOQUIA";

export interface Juzgado {
  id: number;
  tipo: string;
  url: string;
}

// Converts JSON strings to/from your types
export class Convert {
  public static toIntCarpeta(json: string): IntCarpeta {
    return JSON.parse(json);
  }

  public static intCarpetaToJson(value: IntCarpeta): string {
    return JSON.stringify(value);
  }

  public static toActuaciones(json: string): Actuaciones {
    return JSON.parse(json);
  }

  public static actuacionesToJson(value: Actuaciones): string {
    return JSON.stringify(value);
  }

  public static toActuacione(json: string): Actuacione {
    return JSON.parse(json);
  }

  public static actuacioneToJson(value: Actuacione): string {
    return JSON.stringify(value);
  }

  public static toCodeudor(json: string): Codeudor {
    return JSON.parse(json);
  }

  public static codeudorToJson(value: Codeudor): string {
    return JSON.stringify(value);
  }

  public static toDemanda(json: string): Demanda {
    return JSON.parse(json);
  }

  public static demandaToJson(value: Demanda): string {
    return JSON.stringify(value);
  }

  public static toMedidasCautelares(json: string): MedidasCautelares {
    return JSON.parse(json);
  }

  public static medidasCautelaresToJson(value: MedidasCautelares): string {
    return JSON.stringify(value);
  }

  public static toDeudor(json: string): Deudor {
    return JSON.parse(json);
  }

  public static deudorToJson(value: Deudor): string {
    return JSON.stringify(value);
  }

  public static toTel(json: string): Tel {
    return JSON.parse(json);
  }

  public static telToJson(value: Tel): string {
    return JSON.stringify(value);
  }

  public static toNotificacion(json: string): Notificacion {
    return JSON.parse(json);
  }

  public static notificacionToJson(value: Notificacion): string {
    return JSON.stringify(value);
  }

  public static toNotifier(json: string): Notifier {
    return JSON.parse(json);
  }

  public static notifierToJson(value: Notifier): string {
    return JSON.stringify(value);
  }

  public static toProceso(json: string): Proceso {
    return JSON.parse(json);
  }

  public static procesoToJson(value: Proceso): string {
    return JSON.stringify(value);
  }

  public static toJuzgado(json: string): Juzgado {
    return JSON.parse(json);
  }

  public static juzgadoToJson(value: Juzgado): string {
    return JSON.stringify(value);
  }
}
