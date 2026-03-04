export type Message =
  | 'OK'
  | 'Object reference not set to an instance of an object.'
  | 'No se pueden ver actuaciones de un proceso privado'
  | 'Internal Server Error'
  | 'Forbidden';

export type FetchResponseActuacionType = {
  idRegActuacion: number;
  llaveProceso  : string;
  consActuacion : number;
  fechaActuacion: string;
  actuacion     : string;
  anotacion     : null | string;
  fechaInicial  : string | null;
  fechaFinal    : string | null;
  fechaRegistro : string;
  codRegla      : string;
  conDocumentos : boolean;
  cant          : number;
};

export type DatabaseActuacionType = Omit<
  FetchResponseActuacionType,
  | 'idRegActuacion'
  | 'fechaActuacion'
  | 'fechaInicial'
  | 'fechaFinal'
  | 'fechaRegistro'
> & {
  idRegActuacion: string;
  fechaActuacion: Date;
  fechaInicial  : Date | null;
  fechaFinal    : Date | null;
  fechaRegistro : Date;
  idProceso     : string;
  isUltimaAct   : boolean;
  createdAt     : Date;
  carpetaNumero : number;
};

export type Paginacion = {
  cantidadRegistros: number;
  registrosPagina  : number;
  cantidadPaginas  : number;
  pagina           : number;
  paginas?         : null;
};

// Converts JSON strings to/from your types
export class Convert {
  public static toConsultaActuacion(
    json: string 
  ): ConsultaActuacion[] {
    return JSON.parse(
      json 
    );
  }

  public static ConsultaActuacionToJson(
    value: ConsultaActuacion[] 
  ): string {
    return JSON.stringify(
      value 
    );
  }
}

export interface ConsultaActuacion<T = FetchResponseActuacionType> {
  actuaciones: T[];
  paginacion : Paginacion;
}

export interface ProcessRequest {
  idProceso    : string;
  carpetaNumero: number;
  llaveProceso : string;
  carpetaId    : number;
  nombre       : string;
  category?    : string | null;
}
