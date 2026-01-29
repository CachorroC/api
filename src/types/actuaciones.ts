// To parse this data:
//
//   import { Convert } from "./file";
//
//   const consultaActuaci

export type Message =
  | 'OK'
  | 'Object reference not set to an instance of an object.'
  | 'No se pueden ver actuaciones de un proceso privado'
  | 'Internal Server Error'
  | 'Forbidden';

export interface ConsultaActuacion {
  actuaciones: intActuacion[] | fetchResponseActuaciones[];
  paginacion : Paginacion;
}

export type fetchResponseActuaciones = {
  actuacion     : string;
  anotacion     : null | string;
  cant          : number;
  codRegla      : string;
  conDocumentos : boolean;
  consActuacion : number;
  fechaActuacion: Date | string;
  fechaFinal    : Date | string | null;
  fechaInicial  : Date | string | null;
  fechaRegistro : Date | string;
  idRegActuacion: number;
  llaveProceso  : string;
};
type ExtendedType = Omit<fetchResponseActuaciones, 'idRegActuacion'> & {
  idRegActuacion: string;
};

export interface databaseActuacion extends ExtendedType {
  fechaActuacion: Date;
  fechaFinal    : Date | null;
  fechaInicial  : Date | null;
  fechaRegistro : Date;
  idProceso     : number;
  idRegActuacion: string;
  isUltimaAct   : boolean;
  createdAt     : Date;
}

export interface intActuacion {
  actuacion     : string;
  anotacion     : null | string;
  cant          : number;
  codRegla      : string;
  conDocumentos : boolean;
  consActuacion : number;
  fechaActuacion: Date;
  fechaFinal    : Date | null;
  fechaInicial  : Date | null;
  fechaRegistro : Date;
  idRegActuacion: string;
  llaveProceso  : string;
}

export interface outActuacion extends intActuacion {
  createdAt     : Date;
  idProceso     : number;
  isUltimaAct   : boolean;
  carpetaNumero?: number;
}

export type CodRegla = '00                              ';

export interface Paginacion {
  cantidadRegistros: number;
  registrosPagina  : number;
  cantidadPaginas  : number;
  pagina           : number;
  paginas          : null;
}

// Converts JSON strings to/from your types
export class actuacionConvert {
  public static actuacioneToJson(
    value: intActuacion 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static consultaActuacionToJson(
    value: ConsultaActuacion 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static paginacionToJson(
    value: Paginacion 
  ): string {
    return JSON.stringify(
      value 
    );
  }

  public static toActuacione(
    json: string 
  ): outActuacion {
    return JSON.parse(
      json 
    );
  }

  public static toConsultaActuacion(
    json: string 
  ): ConsultaActuacion {
    return JSON.parse(
      json 
    );
  }

  public static toPaginacion(
    json: string 
  ): Paginacion {
    return JSON.parse(
      json 
    );
  }
}
