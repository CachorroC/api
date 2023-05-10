export interface intConsultaNumeroRadicacion {
  tipoConsulta: string;
  procesos: intProceso[];
  parametros: intParametros;
  paginacion: intPaginacion;
}

export interface intPaginacion {
  cantidadRegistros: number;
  registrosPagina: number;
  cantidadPaginas: number;
  pagina: number;
  paginas: null;
}

export interface intParametros {
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
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso?: string | null;
  fechaUltimaActuacion?: string | null;
  despacho: string;
  departamento: string;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
}

export interface intConsultaActuaciones {
  actuaciones: intActuacion[];
  paginacion: intPaginacion;
}

export interface intActuacion {
  idRegActuacion: number;
  llaveProceso: string;
  consActuacion: number;
  fechaActuacion: string;
  actuacion: string;
  anotacion: null | string;
  fechaInicial: null | string;
  fechaFinal: null | string;
  fechaRegistro: string;
  codRegla: string;
  conDocumentos: boolean;
  cant: number;
}
