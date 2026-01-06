// To parse this data:
//
//   import { Convert } from "./file";
//
//   const consultaActuaci

export type Message =
  | "OK"
  | "Object reference not set to an instance of an object."
  | "No se pueden ver actuaciones de un proceso privado"
  | "Internal Server Error"
  | "Forbidden";

export interface ConsultaActuacion {
  actuaciones: intActuacion[];
  paginacion: Paginacion;
}

export interface intActuacion {
  idRegActuacion: string;
  llaveProceso: string;
  consActuacion: number;
  fechaActuacion: Date;
  actuacion: string;
  anotacion: null | string;
  fechaInicial: Date | null;
  fechaFinal: Date | null;
  fechaRegistro: Date;
  codRegla: string;
  conDocumentos: boolean;
  cant: number;
}

export interface outActuacion extends intActuacion {
  createdAt: Date;
  idProceso: number;
  isUltimaAct: boolean;
  carpetaNumero?: number;
}

export type CodRegla = "00                              ";

export interface Paginacion {
  cantidadRegistros: number;
  registrosPagina: number;
  cantidadPaginas: number;
  pagina: number;
  paginas: null;
}

// Converts JSON strings to/from your types
export class actuacionConvert {
  public static actuacioneToJson(value: intActuacion): string {
    return JSON.stringify(value);
  }

  public static consultaActuacionToJson(value: ConsultaActuacion): string {
    return JSON.stringify(value);
  }

  public static paginacionToJson(value: Paginacion): string {
    return JSON.stringify(value);
  }

  public static toActuacione(json: string): outActuacion {
    return JSON.parse(json);
  }

  public static toConsultaActuacion(json: string): ConsultaActuacion {
    return JSON.parse(json);
  }

  public static toPaginacion(json: string): Paginacion {
    return JSON.parse(json);
  }
}
