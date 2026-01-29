import { Prisma } from '../prisma/generated/prisma/client.js';
import { intNotificacion, intNotifier } from '../types/carpetas.js';
import { RawDb } from '../types/raw-db.js';
import { datesExtractor } from '../utils/date-validator.js';

export class ClassNotificacion implements intNotificacion {
  constructor( rawDb: RawDb ) {
    const {
      FISICO: fisico,
      CERTIMAIL: certimail,
      FECHA_AUTO_NOTIFICADO: autoNotificado,
      NUMERO,
      FECHA_RECIBO_291: fechaRecibido291,
      FECHA_APORTA_NOTIFICACION_291: fechaAporta291,
      RESULTADO_291: resultado291,
      FECHA_RECIBO_AVISO_292: fechaRecibido292,
      FECHA_APORTA_NOTIFICACION_292: fechaAporta292,
      RESULTADO_292: resultado292,
    } = rawDb;

    this.id = Number( NUMERO );
    this.certimail = certimail
      ? ( certimail === 'SI'
          ? true
          : false )
      : null;
    this.fisico = fisico
      ? ( fisico === 'SI'
          ? true
          : false )
      : null;
    this.autoNotificado = autoNotificado
      ? new Date( autoNotificado )
      : null;

    if ( autoNotificado ) {
      const [
        newAutoNotificado
      ] = datesExtractor( autoNotificado );

      this.autoNotificado = newAutoNotificado ?? null;
    } else {
      this.autoNotificado = null;
    }

    const [
      newFechaRecibido291
    ] = datesExtractor( fechaRecibido291 );

    const [
      newFechaAporta291
    ] = datesExtractor( fechaAporta291 );

    const newResultado291 = resultado291
      ? resultado291 === 'POSITIVO' || resultado291 === 'ABIERTO'
        ? true
        : false
      : null;

    this.notifiers.push( {
      tipo         : '291',
      fechaRecibido: newFechaRecibido291 ?? null,
      fechaAporta  : newFechaAporta291 ?? null,
      resultado    : newResultado291,
      carpetaNumero: Number( NUMERO ),
    } );

    const [
      newFechaRecibido292
    ] = datesExtractor( fechaRecibido292 );

    const [
      newFechaAporta292
    ] = datesExtractor( fechaAporta292 );

    const newResultado292 = resultado292
      ? resultado292 === 'POSITIVO' || resultado292 === 'ABIERTO'
        ? true
        : false
      : null;

    this.notifiers.push( {
      tipo         : '292',
      fechaRecibido: newFechaRecibido292 ?? null,
      fechaAporta  : newFechaAporta292 ?? null,
      resultado    : newResultado292,
      carpetaNumero: Number( NUMERO ),
    } );
  }
  id            : number;
  notifiers     : intNotifier[] = [];
  certimail     : boolean | null;
  fisico        : boolean | null;
  autoNotificado: Date | null;

  static prismaNotificacion( notificacion: intNotificacion ) {
    const newNotificacion: Prisma.NotificacionCreateWithoutDemandaInput = {
      id            : notificacion.id,
      autoNotificado: notificacion.autoNotificado,
      certimail     : notificacion.certimail,
      fisico        : notificacion.fisico,
      notifiers     : {
        connectOrCreate: notificacion.notifiers.map( ( notif ) => {
          const notifCarpetaInput: Prisma.NotifierTipoCarpetaNumeroCompoundUniqueInput
            = {
              tipo         : notif.tipo,
              carpetaNumero: notif.carpetaNumero,
            };

          const notifierConnectOrCreate: Prisma.NotifierCreateOrConnectWithoutNotificacionInput
            = {
              where: {
                tipo_carpetaNumero: notifCarpetaInput,
              },
              create: {
                tipo         : notif.tipo,
                carpetaNumero: notif.carpetaNumero,
                fechaAporta  : notif.fechaAporta,
                fechaRecibido: notif.fechaRecibido,
                resultado    : notif.resultado,
              },
            };

          return notifierConnectOrCreate;
        } ),
      },
    };

    return newNotificacion;
  }
}
