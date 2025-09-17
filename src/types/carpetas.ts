// To parse this data:
//
//   import { Convert } from "./file
//
//   const CarpetaRaw = Convert.toCarpetaRaw(json);

import { Prisma } from '@prisma/client';
import { outActuacion } from './actuaciones';
import { outProceso } from './procesos';
import { NotasBuilder } from '../models/nota';

export type IntCarpeta = {
  category           : string;
  ciudad             : string | null;
  codeudor           : Codeudor;
  demanda            : IntDemanda;
  juzgado            : Juzgado | null;
  juzgadoTipo        : string | null;
  deudor             : IntDeudor;
  notasCount         : number | null;
  fecha              : Date | null;
  id                 : number;
  idProcesos         : number[];
  idRegUltimaAct     : string | null;
  llaveProceso       : string;
  nombre             : string;
  numero             : number;
  procesos           : outProceso[];
  revisado           : boolean;
  fechaUltimaRevision: Date | null;
  terminado          : boolean;
  tipoProceso        : TipoProceso;
  ultimaActuacion    : outActuacion | null;
  notas              : NotasBuilder[];
};

export type Obligacion = {
  A?: string | number;
  B?: string | number;
};

export type Category = "Terminados" | "Insolvencia" | "Reintegra" | "Lios Juridicos" | "Sin Tercero" | "Bancolombia";

export interface Codeudor {
  cedula   : string | null;
  direccion: string | null;
  id       : number;
  nombre   : string | null;
  telefono : string | null;
}

export type ResultadoEnum =
  | ''
  | '31/03/1901'
  | 'POSITIVO'
  | 'CERTIMAIL'
  | '06/07/2018'
  | 'FISICA'
  | 'NEGATIVO'
  | 'FISICO'
  | '20/06/2018 JAIME'
  | '28/11/2017'
  | '09/04/2018 CERTIMAIL'
  | '15/06/2018'
  | '14/09/2018 WILSON'
  | 'PERSONAL'
  | '20/06/2018'
  | '8/03/2018'
  | '16/05/2018'
  | '14/09/2018 GLADIS'
  | '04/05/2018'
  | '06/06/2018'
  | '20/06 ANGELICA FISICO'
  | '10/06/2018'
  | '18/07/2018'
  | '11/05/2018';

export type FisicoEnum =
  | ''
  | 'NO'
  | 'PERSONAL'
  | 'EMBARGO VEHICULO'
  | 'SI'
  | 'INMUEBLE'
  | 'EMBARGO APTO'
  | 'NO TIENE EN CUENTA'
  | 'VEHICULO'
  | 'INMUEBLE/BANCOS'
  | 'CERTIMAIL'
  | '13/09/2017'
  | 'X'
  | 'ENVIADO 292 24/08/2018'
  | 'FISICO'
  | 'ENVIADO 24/08'
  | 'OK'
  | '17/09/2018 ENVIO 291'
  | '30/10/2018'
  | '13/11/2018';

export interface The291 {
  fechaRecibido?: number | string;
  resultado?    : number | string;
  fechaAporta?  : number | string;
}

export interface The292 {
  fechaRecibido?: string;
  fechaAporta?  : number | string;
  resultado?    : ResultadoEnum | number;
}

export type DepartamentoRaw =
  | 'CUNDINAMARCA'
  | 'ATLANTICO'
  | 'META'
  | 'CUNDINNAMARCA'
  | 'CUNDINAMARCA '
  | '18/01/2018'
  | 'SINGULAR'
  | 'HIPOTECARIO'
  | 'TOLIMA'
  | 'CUN DINAMARCA'
  | 'CUNDINNAMARCA '
  | 'BOYACÁ'
  | 'CUNDINAMRCA'
  | 'CNDINAMARCA'
  | '';

export interface IntDeudor {
  cedula         : string;
  direccion      : string | null;
  email          : string | null;
  id             : number;
  primerNombre   : string;
  segundoNombre  : string | null;
  primerApellido : string;
  segundoApellido: string | null;
  telCelular     : string | null;
  telFijo        : string | null;
}

export interface IntTel {
  fijo   : number | null;
  celular: number | null;
}

export interface IntDemanda {
  capitalAdeudado        : Prisma.Decimal;
  departamento           : string | null;
  carpetaNumero          : number;
  despacho               : null | string;
  entregaGarantiasAbogado: Date | null;
  etapaProcesal          : null | string;
  fechaPresentacion      : Date[];
  id                     : number;
  llaveProceso           : string | null;
  mandamientoPago        : Date[];
  medidasCautelares      : intMedidasCautelares;
  municipio              : string | null;
  notificacion           : intNotificacion;
  obligacion             : string[];
  radicado               : string | null;
  tipoProceso            : TipoProceso;
  vencimientoPagare      : Date[];
  avaluo                 : Prisma.Decimal;
  liquidacion            : Prisma.Decimal;
}

export type intLiquidacion = {
  valor            : Prisma.Decimal;
  fechaAprobacion  : Date | null;
  fechaPresentacion: Date | null;
};

export interface intMedidasCautelares {
  id               : number;
  fechaOrdenaMedida: Date | null;
  medidaSolicitada : string | null;
}

export interface intNotificacion {
  id            : number;
  certimail     : boolean | null;
  fisico        : boolean | null;
  autoNotificado: Date | null;
  notifiers     : intNotifier[];
}

export interface intNotifier {
  tipo         : '291' | '292';
  carpetaNumero: number;
  fechaRecibido: Date | null;
  resultado    : boolean | null;
  fechaAporta  : Date | null;
}

export type Juzgado = {
  id    : string;
  tipo  : string;
  ciudad: string;
  url   : string;
};

export type TipoProcesoRaw =
  | 'HIPOTECARIO'
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'SINGULAR ACUMULADO CON HIPOTECARIO'
  | 'SINGULAR ACUM HIPOTECARIO'
  | '11001400308320170071700'
  | '25473418900120170092400'
  | 'PRENDARO'
  | ' HIPOTECARIO'
  | 'HMM PISO 1'
  | '  SINGULAR'
  | 'HIPOTECARIA'
  | 'HIPOTECARO'
  | 'SINGULAR ACUMULADO CON HIPOTECARIO CAJA SOCIAL'
  | 'SOACHA'
  | 'ACUMULADO'
  | 'HIPOTECARIO ';

export type TipoProceso =
  | 'HIPOTECARIO'
  | 'PRENDARIO'
  | 'SINGULAR'
  | 'ACUMULADO' | 'VERBAL' ;
