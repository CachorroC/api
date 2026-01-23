// To parse this data:
//
//   import { Convert, ConsultaNumeroRadicacion } from "./file";
//
//   const consultaNumeroRadicacion = Convert.toConsultaNumeroRadicacion(json);

import { Juzgado } from "./carpetas.js";

// To parse this data:
//
//   import { Convert, ConsultaProcesos } from "./file";
//
//   const consultaProcesos = Convert.toConsultaProcesos(json);

export type Paginacion = {
  cantidadRegistros: number;
  registrosPagina: number;
  cantidadPaginas: number;
  pagina: number;
  paginas: null;
};

export type fetchResponseProceso = {
  cantFilas: number;
  departamento: string;
  despacho: string;
  esPrivado: boolean;
  fechaProceso: string | Date;
  fechaUltimaActuacion: string | Date;
  idConexion: number;
  idProceso: number;
  llaveProceso: string;
  sujetosProcesales: string;
};

export type intProceso = {
  cantFilas: number;
  departamento: string;
  despacho: string;
  esPrivado: boolean;
  fechaProceso: Date | null;
  fechaUltimaActuacion: Date | null;
  idConexion: number;
  idProceso: number;
  llaveProceso: string;
  sujetosProcesales: string;
};

export interface databaseProceso extends fetchResponseProceso {
  fechaProceso: Date;
  fechaUltimaActuacion: Date;
}
// Converts JSON strings to/from your types

export type ConsultaProcesos = {
  tipoConsulta: TipoConsulta;
  procesos: intProceso[] | fetchResponseProceso[];
  parametros: Parametros;
  paginacion: Paginacion;
};

export type Parametros = {
  numero: null | string;
  nombre: null | string;
  tipoPersona: null | string;
  idSujeto: null;
  ponente: null;
  claseProceso: null;
  codificacionDespacho: null;
  soloActivos: boolean;
};

export type Message =
  | "OK"
  | 'El parametro "NumeroRadicacion" ha de contener 23 digitos.'
  | "Object reference not set to an instance of an object."
  | "No se pueden ver actuaciones de un proceso privado";

export type DetalleProceso = {
  [key: string]: string | null | boolean | Date | number | Juzgado | undefined;
  claseProceso: ClaseProceso;
  contenidoRadicacion: null | string;
  despacho: string;
  esPrivado: boolean;
  fechaConsulta: Date;
  fechaProceso: Date;
  idConexion: number;
  idRegProceso: number;
  juzgado?: Juzgado;
  llaveProceso: string;
  ponente: string;
  recurso: Recurso | null;
  subclaseProceso: SubclaseProceso;
  tipoProceso: TipoProceso;
  ubicacion: null | string;
  ultimaActualizacion: Date;
};

export type ClaseProceso =
  | "EJECUTIVO"
  | "Ejecutivo con T�tulo Hipotecario"
  | "Ejecutivo Singular"
  | "Ejecutivo con T�tulo Prendario"
  | "Abreviado"
  | "PROCESOS EJECUTIVOS HIPOTECARIOS O PRENDARIOS"
  | "Despachos Comisorios"
  | "Sin Tipo de Proceso"
  | "Ejecutivo Mixto"
  | "Solicitud entrega inmueble"
  | "Sucesi�n"
  | "SUCESI�N"
  | "EJECUTIVOS DE MENOR Y MINIMA CUANTIA"
  | "DESPACHOS COMISORIOS"
  | "EJECUTIVO HIPOTECARIO"
  | "Tutelas"
  | "EJECUTIVO SINGULAR"
  | "Ordinario";

export type Recurso = "Sin Tipo de Recurso";

export type SubclaseProceso =
  | "En general / Sin subclase"
  | "Sin Subclase de Proceso"
  | "Por sumas de dinero"
  | "Restituci�n del inmueble arrendado"
  | "TITULO VALOR"
  | "En general"
  | "SINGULARES";

export type TipoProceso =
  | "EJECUTIVO C.G.P"
  | "De Ejecuci�n"
  | "Declarativo"
  | "Codigo General del Proceso"
  | "Especial"
  | "EjecucionTramitePosterior"
  | "Especiales"
  | "De Liquidaci�n"
  | "LIQUIDACI�N C.G.P"
  | "Acci�n de Tutela"
  | "Otros Asuntos";

export type Departamento =
  | "BOGOT�"
  | "CUNDINAMARCA"
  | "META"
  | "HUILA"
  | "ANTIOQUIA"
  | "ATL�NTICO";

export type TipoConsulta = "NumeroRadicacion" | "NombreRazonSocial";

export type outProceso = {
  fechaProceso: Date | null;
  fechaUltimaActuacion: Date | null;
  juzgado: Juzgado;
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  despacho: string;
  departamento: string;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
};
