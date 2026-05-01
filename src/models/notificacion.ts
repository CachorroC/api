/**
 * @module models/notificacion
 * @description Judicial Notification Model
 *
 * Encapsulates notification/delivery (notificación) data for legal documents within a judicial process.
 * Handles multiple notification methods (physical, certimail) and validates notification results
 * through formal notification procedures (DILIGENCIAS 291 and 292).
 *
 * NOTIFICATION WORKFLOW:
 * Raw Data → Parse notification methods
 *   ↓
 * Extract notification dates (datesExtractor)
 *   ↓
 * Transform notification results (POSITIVO/ABIERTO → boolean)
 *   ↓
 * Build notifiers array with diligencia 291 and 292
 *   ↓
 * Store notification proof metadata
 *
 * DILIGENCIAS TYPES:
 * - 291: First formal notification attempt (electronic/physical service)
 * - 292: Second notification attempt (if first fails or requires confirmation)
 *
 * Each diligencia tracks:
 * - Receipt date (cuando el demandado recibe la notificación)
 * - Contribution date (cuando se aporta al proceso)
 * - Result status (POSITIVO/ABIERTO or null)
 */

import { Prisma } from '../prisma/generated/prisma/client.js';
import { intNotificacion, intNotifier } from '../types/carpetas.js';
import { RawDb } from '../types/raw-db.js';
import { datesExtractor } from '../utils/date-validator.js';

/**
 * @class ClassNotificacion
 * @implements {intNotificacion}
 * @description Transforms raw database notification records into typed notification objects.
 * Manages notification delivery proof via formal diligencias (legal notices).
 *
 * @property {number} id - Unique identifier for notification (case number)
 * @property {boolean | null} certimail - Whether certimail (registered mail) was used
 * @property {boolean | null} fisico - Whether physical service was used
 * @property {Date | null} autoNotificado - Auto-notification date if applicable
 * @property {intNotifier[]} notifiers - Array of diligencia records (291, 292, etc.)
 *
 * @constructor
 * @param {RawDb} rawDb - Raw database record containing FISICO, CERTIMAIL, NUMERO,
 *                        FECHA_RECIBO_291, FECHA_APORTA_NOTIFICACION_291, RESULTADO_291,
 *                        FECHA_RECIBO_292, FECHA_APORTA_NOTIFICACION_292, RESULTADO_292
 */
export class ClassNotificacion implements intNotificacion {
  constructor(
    rawDb: RawDb 
  ) {
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

    this.id = Number(
      NUMERO 
    );
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
      ? new Date(
          autoNotificado 
        )
      : null;

    if ( autoNotificado ) {
      const [
        newAutoNotificado
      ] = datesExtractor(
        autoNotificado 
      );

      this.autoNotificado = newAutoNotificado ?? null;
    } else {
      this.autoNotificado = null;
    }

    const [
      newFechaRecibido291
    ] = datesExtractor(
      fechaRecibido291 
    );

    const [
      newFechaAporta291
    ] = datesExtractor(
      fechaAporta291 
    );

    const newResultado291 = resultado291
      ? resultado291 === 'POSITIVO' || resultado291 === 'ABIERTO'
        ? true
        : false
      : null;

    this.notifiers.push(
      {
        tipo         : '291',
        fechaRecibido: newFechaRecibido291 ?? null,
        fechaAporta  : newFechaAporta291 ?? null,
        resultado    : newResultado291,
        carpetaNumero: Number(
          NUMERO 
        ),
      } 
    );

    const [
      newFechaRecibido292
    ] = datesExtractor(
      fechaRecibido292 
    );

    const [
      newFechaAporta292
    ] = datesExtractor(
      fechaAporta292 
    );

    const newResultado292 = resultado292
      ? resultado292 === 'POSITIVO' || resultado292 === 'ABIERTO'
        ? true
        : false
      : null;

    this.notifiers.push(
      {
        tipo         : '292',
        fechaRecibido: newFechaRecibido292 ?? null,
        fechaAporta  : newFechaAporta292 ?? null,
        resultado    : newResultado292,
        carpetaNumero: Number(
          NUMERO 
        ),
      } 
    );
  }
  id            : number;
  notifiers     : intNotifier[] = [];
  certimail     : boolean | null;
  fisico        : boolean | null;
  autoNotificado: Date | null;

  static prismaNotificacion(
    notificacion: intNotificacion 
  ) {
    const newNotificacion: Prisma.NotificacionCreateWithoutDemandaInput = {
      id            : notificacion.id,
      autoNotificado: notificacion.autoNotificado,
      certimail     : notificacion.certimail,
      fisico        : notificacion.fisico,
      notifiers     : {
        connectOrCreate: notificacion.notifiers.map(
          (
            notif 
          ) => {
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
          } 
        ),
      },
    };

    return newNotificacion;
  }
}
