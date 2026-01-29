import { Prisma } from '../prisma/generated/prisma/client.js';
import { IntDemanda, TipoProceso, intNotificacion } from '../types/carpetas.js';
import { RawDb } from '../types/raw-db.js';
import { capitalBuilder } from '../utils/capital-builder.js';
import { datesExtractor } from '../utils/date-validator.js';
import { ClassNotificacion } from './notificacion.js';
import { tipoProcesoBuilder } from './tipoProceso.js';

export class ClassDemanda implements IntDemanda {
  constructor( rawCarpeta: RawDb ) {
    const {
      VALOR_CAPITAL_ADEUDADO: capitalAdeudado,
      JUZGADO_EJECUCION,
      JUZGADO_ORIGEN,
      FECHA_ENTREGA_GARANTIAS_ABOGADO: entregaGarantiasAbogado,
      ETAPA_PROCESAL: etapaProcesal,
      DEPARTAMENTO: departamento,
      NUMERO,
      FECHA_PRESENTACION_DEMANDA: fechaPresentacion,
      TIPO_PROCESO: tipoProceso,
      FECHA_MANDAMIENTO_PAGO: mandamientoPago,
      JUZGADO_CIUDAD: municipio,
      RADICADO: radicado,
      EXPEDIENTE: llaveProceso,
      FECHA_VENCIMIENTO_PAGARE: vencimientoPagare,
      FECHA_ORDENA_MEDIDAS_CAUTELARES: fechaOrdenaMedidas,
      MEDIDA_SOLICITADA: medidaSolicitada,
      OBLIGACION_1: A,
      OBLIGACION_2: B,
      VALOR_LIQUIDACION_DEL_CREDITO,
      VALOR_AVALUO,
      BIENES,
      BIENES_SECUESTRADOS,
    } = rawCarpeta;

    const [
      newFechaOrdenaMedida
    ] = datesExtractor( fechaOrdenaMedidas );

    this.id = Number( NUMERO );
    this.bienes = BIENES
      ? String( BIENES )
      : BIENES_SECUESTRADOS
        ? String( BIENES_SECUESTRADOS )
        : null;
    this.medidasCautelares = {
      id               : Number( NUMERO ),
      fechaOrdenaMedida: newFechaOrdenaMedida ?? null,
      medidaSolicitada : medidaSolicitada
        ? String( medidaSolicitada )
        : null,
    };

    const obligacionesSet = new Set<string>();

    if ( A ) {
      obligacionesSet.add( String( A ) );
    }

    if ( B ) {
      obligacionesSet.add( String( B ) );
    }

    this.fechaPresentacion = datesExtractor( fechaPresentacion ) ?? null;
    this.notificacion = new ClassNotificacion( rawCarpeta );
    this.mandamientoPago = datesExtractor( mandamientoPago ) ?? null;

    const NewEntregaDeGarantias = datesExtractor( entregaGarantiasAbogado );

    if ( NewEntregaDeGarantias.length === 0 ) {
      this.entregaGarantiasAbogado = null;
    } else {
      const [
        firstEntrega
      ] = NewEntregaDeGarantias;

      this.entregaGarantiasAbogado = firstEntrega;
    }

    this.capitalAdeudado = new Prisma.Decimal( capitalBuilder( capitalAdeudado ) );
    this.tipoProceso = tipoProcesoBuilder( tipoProceso );
    this.etapaProcesal = etapaProcesal
      ? `${ etapaProcesal }`
      : null;
    this.municipio = municipio
      ? String( municipio )
      : null;
    this.obligacion = Array.from( obligacionesSet );
    this.radicado = radicado
      ? `${ radicado }`
      : null;
    this.vencimientoPagare = datesExtractor( vencimientoPagare );
    this.departamento = departamento
      ? departamento
      : null;
    this.despacho = JUZGADO_EJECUCION
      ? JUZGADO_EJECUCION
      : JUZGADO_ORIGEN
        ? JUZGADO_ORIGEN
        : null;
    this.llaveProceso = llaveProceso
      ? String( llaveProceso )
      : null;
    this.avaluo = new Prisma.Decimal( capitalBuilder( VALOR_AVALUO ) );
    this.liquidacion = new Prisma.Decimal( capitalBuilder( VALOR_LIQUIDACION_DEL_CREDITO ), );
  }
  liquidacion            : Prisma.Decimal;
  avaluo                 : Prisma.Decimal;
  capitalAdeudado        : Prisma.Decimal;
  carpetaNumero!         : number;
  departamento           : string | null;
  despacho               : string | null;
  bienes                 : string | null;
  entregaGarantiasAbogado: Date | null;
  etapaProcesal          : string | null;
  fechaPresentacion      : Date[];
  id                     : number;
  llaveProceso           : string | null;
  mandamientoPago        : Date[];
  municipio              : string | null;
  notificacion           : intNotificacion;
  obligacion             : string[];
  radicado               : string | null;
  tipoProceso            : TipoProceso;
  vencimientoPagare      : Date[];
  medidasCautelares: {
    id               : number;
    fechaOrdenaMedida: Date | null;
    medidaSolicitada : string | null;
  };
  static prismaDemanda( demanda: IntDemanda ) {
    const newMedidas: Prisma.MedidasCautelaresCreateWithoutDemandaInput = {
      id               : demanda.id,
      fechaOrdenaMedida: demanda.medidasCautelares.fechaOrdenaMedida,
      medidaSolicitada : demanda.medidasCautelares.medidaSolicitada,
    };

    const newNotificacion: Prisma.NotificacionCreateWithoutDemandaInput
      = ClassNotificacion.prismaNotificacion( demanda.notificacion );

    const newDemanda: Prisma.DemandaCreateWithoutCarpetaInput = {
      id                     : demanda.id,
      tipoProceso            : demanda.tipoProceso,
      avaluo                 : demanda.avaluo,
      capitalAdeudado        : demanda.capitalAdeudado,
      departamento           : demanda.departamento,
      despacho               : demanda.despacho,
      entregaGarantiasAbogado: demanda.entregaGarantiasAbogado,
      fechaPresentacion      : demanda.fechaPresentacion,
      vencimientoPagare      : demanda.vencimientoPagare,
      etapaProcesal          : demanda.etapaProcesal,
      liquidacion            : demanda.liquidacion,
      llaveProceso           : demanda.llaveProceso,
      mandamientoPago        : demanda.mandamientoPago,
      municipio              : demanda.municipio,
      obligacion             : demanda.obligacion,
      radicado               : demanda.radicado,
      medidasCautelares      : {
        connectOrCreate: {
          where: {
            id: demanda.id,
          },
          create: newMedidas,
        },
      },
      notificacion: {
        connectOrCreate: {
          where: {
            id: demanda.id,
          },
          create: newNotificacion,
        },
      },
    };

    return newDemanda;
  }
}
