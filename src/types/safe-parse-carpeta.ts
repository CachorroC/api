// To parse this data:
//
//   import { Convert } from "./file";
//
//   const prismaCarpeta = Convert.toPrismaCarpeta(json);

export interface PrismaCarpeta {
  id: number;
  numero: number;
  llaveProceso: null | string;
  nombre: string;
  idProcesos: number[];
  category: Category;
  fecha: Date | null;
  Prismademanda: PrismaDemanda | null;
  deudor: PrismaDeudor;
  ultimaActuacion: PrismaUltimaActuacion | null;
  juzgados: PrismaJuzgado[];
  procesos: PrismaProceso[];
  notas: PrismaNota[];
  tareas: PrismaTarea[];
}

export type Category =
  | "Terminados"
  | "LiosJuridicos"
  | "Bancolombia"
  | "Reintegra"
  | "Insolvencia";

export interface PrismaDemanda {
  id: number;
  departamento: Departamento;
  capitalAdeudado: string;
  entregaGarantiasAbogado: Date | null;
  tipoProceso: TipoProceso;
  mandamientoPago: Date | null;
  etapaProcesal: null | string;
  fechaPresentacion: Date | null;
  municipio: string;
  obligacion: string[];
  radicado: null | string;
  vencimientoPagare: Date[];
  expediente: null | string;
  carpetaNumero: number;
  despacho: null;
}

export type Departamento =
  | "BOGOTÁ"
  | "CUNDINAMARCA"
  | "TOLIMA"
  | "CUN DINAMARCA"
  | "CUNDINNAMARCA"
  | "BOYACÁ"
  | "CNDINAMARCA"
  | "ANTIOQUIA";

export type TipoProceso =
  | "HIPOTECARIO"
  | "PRENDARIO"
  | "SINGULAR"
  | "ACUMULADO";

export interface PrismaDeudor {
  id: number;
  cedula: string;
  primerNombre: string;
  primerApellido: string;
  segundoNombre: null | string;
  segundoApellido: null | string;
  direccion: null | string;
  email: null | string;
  telCelular: null | string;
  telFijo: null | string;
  carpetaNumero: number;
}

export interface PrismaJuzgado {
  id: number;
  tipo: string;
  url: string;
}

export interface PrismaNota {
  id: number;
  date: Date;
  createdAt: Date;
  pathname: null | string;
  carpetaNumero: number;
  content: string;
  title: string;
  updatedAt: Date;
}

export interface PrismaProceso {
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso: Date;
  fechaUltimaActuacion: Date | null;
  despacho: string;
  departamento: Departamento;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
  carpetaNumero: number;
}

export interface PrismaTarea {
  id: number;
  dueDate: null;
  carpetaId: number;
  complete: boolean;
  content: string;
  createdAt: Date;
  title: string;
  updatedAt: Date;
  subTareas: PrismaSubPrismaTarea[];
}

export interface PrismaSubPrismaTarea {
  text: string;
  date: Date;
  isComplete: boolean;
  tareaId: number;
}

export interface PrismaUltimaActuacion {
  createdAt: Date;
  idRegActuacion: number;
  llaveProceso: string;
  consActuacion: number;
  fechaActuacion: Date;
  actuacion: string;
  anotacion: null | string;
  fechaInicial: Date | null;
  fechaRegistro: Date;
  fechaFinal: Date | null;
  codRegla: CodRegla;
  conDocumentos: boolean;
  cant: number;
  carpetaNumero: number;
  procesoIdProceso: null;
}

export type CodRegla = "00                              ";

// Converts JSON strings to/from your types
export class Convert {
  public static toPrismaCarpeta(json: string): PrismaCarpeta {
    return JSON.parse(json);
  }

  public static prismaCarpetaToJson(value: PrismaCarpeta): string {
    return JSON.stringify(value);
  }

  public static toPrismaDemanda(json: string): PrismaDemanda {
    return JSON.parse(json);
  }

  public static PrismademandaToJson(value: PrismaDemanda): string {
    return JSON.stringify(value);
  }

  public static toPrismaDeudor(json: string): PrismaDeudor {
    return JSON.parse(json);
  }

  public static deudorToJson(value: PrismaDeudor): string {
    return JSON.stringify(value);
  }

  public static toPrismaJuzgado(json: string): PrismaJuzgado {
    return JSON.parse(json);
  }

  public static juzgadoToJson(value: PrismaJuzgado): string {
    return JSON.stringify(value);
  }

  public static toPrismaNota(json: string): PrismaNota {
    return JSON.parse(json);
  }

  public static notaToJson(value: PrismaNota): string {
    return JSON.stringify(value);
  }

  public static toProceso(json: string): PrismaProceso {
    return JSON.parse(json);
  }

  public static procesoToJson(value: PrismaProceso): string {
    return JSON.stringify(value);
  }

  public static toPrismaTarea(json: string): PrismaTarea {
    return JSON.parse(json);
  }

  public static tareaToJson(value: PrismaTarea): string {
    return JSON.stringify(value);
  }

  public static toPrismaSubPrismaTarea(json: string): PrismaSubPrismaTarea {
    return JSON.parse(json);
  }

  public static subPrismaTareaToJson(value: PrismaSubPrismaTarea): string {
    return JSON.stringify(value);
  }

  public static toUltimaActuacion(json: string): PrismaUltimaActuacion {
    return JSON.parse(json);
  }

  public static ultimaActuacionToJson(value: PrismaUltimaActuacion): string {
    return JSON.stringify(value);
  }
}
