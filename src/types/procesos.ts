// To parse this data:
//
//   import { Convert, ConsultaNumeroRadicacion } from "./file";
//
//   const consultaNumeroRadicacion = Convert.toConsultaNumeroRadicacion(json);

import { Juzgado } from "./carpetas";

export type RequestProceso = {
  StatusCode: number;
  Message: Message;
  ConsultaProcesos?: ConsultaProcesos;
};

export type ConsultaProcesos = {
  tipoConsulta: TipoConsulta;
  procesos: intProceso[];
  parametros: Parametros;
  paginacion: Paginacion;
};

export type Paginacion = {
  cantidadRegistros: number;
  registrosPagina: number;
  cantidadPaginas: number;
  pagina: number;
  paginas: null;
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

export type intProceso = {
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso: Date | null;
  fechaUltimaActuacion: Date | null;
  despacho: string;
  departamento: string;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
};

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
  | "Ejecutivo con Título Hipotecario"
  | "Ejecutivo Singular"
  | "Ejecutivo con Título Prendario"
  | "Abreviado"
  | "PROCESOS EJECUTIVOS HIPOTECARIOS O PRENDARIOS"
  | "Despachos Comisorios"
  | "Sin Tipo de Proceso"
  | "Ejecutivo Mixto"
  | "Solicitud entrega inmueble"
  | "Sucesión"
  | "SUCESIÓN"
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
  | "Restitución del inmueble arrendado"
  | "TITULO VALOR"
  | "En general"
  | "SINGULARES";

export type TipoProceso =
  | "EJECUTIVO C.G.P"
  | "De Ejecución"
  | "Declarativo"
  | "Codigo General del Proceso"
  | "Especial"
  | "EjecucionTramitePosterior"
  | "Especiales"
  | "De Liquidación"
  | "LIQUIDACIÓN C.G.P"
  | "Acción de Tutela"
  | "Otros Asuntos";

export type Departamento =
  | "BOGOTÁ"
  | "CUNDINAMARCA"
  | "META"
  | "HUILA"
  | "ANTIOQUIA"
  | "ATLÁNTICO";

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
