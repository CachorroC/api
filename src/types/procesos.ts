// To parse this data:
//
//   import { Convert, ConsultaNumeroRadicacion } from "./file";
//
//   const consultaNumeroRadicacion = Convert.toConsultaNumeroRadicacion(json);

import { intActuacion } from "./actuaciones";
import { Juzgado } from "./carpetas";

export interface Data {
  StatusCode: number;
  Message: Message | string;
  procesos?: intProceso[];
  actuaciones?: intActuacion[];
}

export interface ConsultaNumeroRadicacion {
  tipoConsulta: string;
  procesos: intProceso[];
  parametros: Parametros;
  paginacion: Paginacion;
}

export type Message =
  | "OK"
  | 'El parametro "NumeroRadicacion" ha de contener 23 digitos.'
  | "Object reference not set to an instance of an object."
  | "No se pueden ver actuaciones de un proceso privado";

export interface Paginacion {
  cantidadRegistros: number;
  registrosPagina: number;
  cantidadPaginas: number;
  pagina: number;
  paginas: null;
}

export interface Parametros {
  numero: string;
  nombre: null;
  tipoPersona: null;
  idSujeto: null;
  ponente: null;
  claseProceso: null;
  codificacionDespacho: null;
  soloActivos: boolean;
}

export interface intProceso {
  cantFilas: number;
  departamento: Departamento;
  despacho: string;
  esPrivado: boolean;
  fechaProceso: Date | string | null;
  fechaUltimaActuacion: Date | string | null;
  idConexion: number;
  idProceso: number;
  llaveProceso: string;
  sujetosProcesales: string;
}

export interface outProceso extends intProceso {
  fechaProceso: Date | null;
  fechaUltimaActuacion: Date | null;
  juzgado: Juzgado;
}

export type Departamento = "BOGOTÁ" | "CUNDINAMARCA" | "ANTIOQUIA" | "META";

export type TipoConsulta = "NumeroRadicacion";

// Converts JSON strings to/from your types
export class Convert {
  public static toConsultaNumeroRadicacion(
    json: string,
  ): ConsultaNumeroRadicacion {
    return JSON.parse(json);
  }

  public static consultaNumeroRadicacionToJson(
    value: ConsultaNumeroRadicacion,
  ): string {
    return JSON.stringify(value);
  }

  public static toPaginacion(json: string): Paginacion {
    return JSON.parse(json);
  }

  public static paginacionToJson(value: Paginacion): string {
    return JSON.stringify(value);
  }

  public static toParametros(json: string): Parametros {
    return JSON.parse(json);
  }

  public static parametrosToJson(value: Parametros): string {
    return JSON.stringify(value);
  }

  public static toProceso(json: string): intProceso {
    return JSON.parse(json);
  }

  public static procesoToJson(value: intProceso): string {
    return JSON.stringify(value);
  }
}
