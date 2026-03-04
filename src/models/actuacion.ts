/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '../prisma/generated/prisma/client.js';
import { client } from '../services/prisma.js';
import { TelegramService } from '../services/telegramService.js';
import { DatabaseActuacionType,
  FetchResponseActuacionType,
  ProcessRequest, } from '../types/actuaciones.js';
import { sleep } from '../utils/awaiter.js';
import { ensureDate, formatDateToString } from '../utils/ensureDate.js';
import { sanitizeText } from '../utils/textSanitizer.js';
import { ApiError } from './ApiError.js';
import { FileLogger } from './FileLogger.js';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const NEW_ACTUACION_WEBHOOK_URL = process.env.NEW_ACTUACION_WEBHOOK_URL || '';

async function pMap<T, R>(
  array: T[],
  mapper: ( item: T ) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for ( const item of array ) {
    const p = Promise.resolve()
      .then(
        () => {
          return mapper(
            item 
          );
        } 
      );
    results.push(
      p as unknown as R 
    );

    const e: Promise<void> = p.then(
      () => {
        executing.splice(
          executing.indexOf(
            e 
          ), 1 
        );
      } 
    );
    executing.push(
      e 
    );

    if ( executing.length >= concurrency ) {
      await Promise.race(
        executing 
      );
    }
  }

  return Promise.all(
    results 
  );
}

export default class Actuacion implements DatabaseActuacionType {
  createdAt     : Date;
  idProceso     : string;
  isUltimaAct   : boolean;
  carpetaNumero : number;
  actuacion     : string;
  anotacion     : string | null;
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
  constructor(
    {
      actuacion,
      idProceso,
      isUltimaAct,
      carpetaNumero,
    }: {
      actuacion    : FetchResponseActuacionType;
      idProceso    : string;
      isUltimaAct  : boolean;
      carpetaNumero: number;
    } 
  ) {
    this.createdAt = new Date();
    this.idProceso = idProceso;
    this.isUltimaAct = isUltimaAct;
    this.carpetaNumero = carpetaNumero;
    this.actuacion = actuacion.actuacion;
    this.anotacion = actuacion.anotacion;
    this.cant = actuacion.cant;
    this.codRegla = actuacion.codRegla;
    this.conDocumentos = actuacion.conDocumentos;
    this.consActuacion = actuacion.consActuacion;
    this.fechaActuacion = new Date(
      actuacion.fechaActuacion 
    );
    this.fechaFinal = actuacion.fechaFinal
      ? new Date(
          actuacion.fechaFinal 
        )
      : null;
    this.fechaInicial = actuacion.fechaInicial
      ? new Date(
          actuacion.fechaInicial 
        )
      : null;
    this.fechaRegistro = new Date(
      actuacion.fechaRegistro 
    );
    this.idRegActuacion = `${ actuacion.idRegActuacion }`;
    this.llaveProceso = actuacion.llaveProceso;
  }
}

export class ActuacionService {
  /**
   * Evaluates an array of API records to determine the absolute latest one based on
   * `fechaActuacion`, falling back to `fechaRegistro`, and finally `consActuacion`.
   * * @param actuaciones - List of raw Actuaciones from the API.
   * @returns The most recent Actuacion object, or null if the array is empty.
   */
  private static getLatestByDate(
    actuaciones: FetchResponseActuacionType[],
  ): FetchResponseActuacionType | null {
    if ( !actuaciones || actuaciones.length === 0 ) {
      return null;
    }

    return actuaciones.reduce(
      (
        prev, current 
      ) => {
        const prevDate = ensureDate(
          prev.fechaActuacion 
        )
          ?.getTime() || 0;
        const currDate = ensureDate(
          current.fechaActuacion 
        )
          ?.getTime() || 0;

        if ( currDate > prevDate ) {
          return current;
        }

        if ( currDate === prevDate ) {
          const prevReg = ensureDate(
            prev.fechaRegistro 
          )
            ?.getTime() || 0;
          const currReg = ensureDate(
            current.fechaRegistro 
          )
            ?.getTime() || 0;

          if ( currReg > prevReg ) {
            return current;
          }

          if ( currReg === prevReg ) {
            return current.consActuacion > prev.consActuacion
              ? current
              : prev;
          }
        }

        return prev;
      } 
    );
  }

  /**
   * Transforms the raw API data object into a standardized Prisma input object
   * suitable for database insertion or updating.
   * * @param apiData - Raw item from the Rama Judicial API.
   * @param parentProc - Metadata regarding the parent process.
   * @param actualLatestItem - The latest item determined from the batch to flag `isUltimaAct`.
   * @returns A strongly-typed Prisma CreateInput object.
   */
  private static mapToPrismaInput(
    apiData: FetchResponseActuacionType,
    parentProc: ProcessRequest,
    actualLatestItem: FetchResponseActuacionType | null,
  ): Prisma.ActuacionCreateInput {
    const isUltima = actualLatestItem
      ? String(
        apiData.idRegActuacion 
      )
        === String(
          actualLatestItem.idRegActuacion 
        )
      : false;
    // Apply sanitization here 👇
    const cleanActuacion
      = sanitizeText(
        String(
          apiData.actuacion 
        ) 
      ) || 'Sin descripción';
    const cleanAnotacion = sanitizeText(
      String(
        apiData.anotacion 
      ) 
    );

    return {
      idRegActuacion: String(
        apiData.idRegActuacion 
      ),
      consActuacion : apiData.consActuacion,
      actuacion     : cleanActuacion,
      anotacion     : cleanAnotacion,
      cant          : apiData.cant,
      carpetaNumero : parentProc.carpetaNumero,
      codRegla      : apiData.codRegla,
      conDocumentos : apiData.conDocumentos,
      llaveProceso  : parentProc.llaveProceso,
      fechaActuacion: ensureDate(
        apiData.fechaActuacion 
      ) ?? new Date(),
      fechaRegistro: ensureDate(
        apiData.fechaRegistro 
      ) ?? new Date(),
      fechaInicial: ensureDate(
        apiData.fechaInicial 
      ),
      fechaFinal: ensureDate(
        apiData.fechaFinal 
      ),
      idProceso  : parentProc.idProceso,
      isUltimaAct: isUltima,
      proceso    : {
        connect: {
          idProceso: parentProc.idProceso,
        },
      },
    };
  }

  /**
   * Dispatches alerts (Webhooks and Telegram) for newly discovered 'Actuaciones'.
   * Includes brief delays between dispatches to respect rate limits.
   * * @param newItems - The list of Actuaciones that are verified as new to the database.
   * @param parentProc - Metadata of the parent process.
   * @param logger - The file logger instance for recording dispatch failures.
   */
  private static async processNotifications(
    newItems: FetchResponseActuacionType[],
    parentProc: ProcessRequest,
    logger: FileLogger,
  ) {
    if ( newItems.length === 0 ) {
      return;
    }

    console.log(
      `✨ Found ${ newItems.length } NEW Actuaciones. Processing notifications...`,
    );
    await logger.logNewItems(
      newItems, parentProc 
    );

    for ( const [
      index,
      act
    ] of newItems.entries() ) {
      if ( index > 0 ) {
        await sleep(
          2000 
        );
      }

      if ( WEBHOOK_URL ) {
        console.log(
          `🗯️ Iniciando el webhook: ${ WEBHOOK_URL }` 
        );

        try {
          const response = await fetch(
            WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(
                {
                  title: `${ parentProc.carpetaNumero } ${ parentProc.nombre }: ${ act.actuacion }`,
                  body : `${ act.actuacion } ${ act.anotacion || '' }`,
                  icon : '/icons/notification_icon.png',
                  data : {
                    numero        : parentProc.carpetaNumero,
                    idProceso     : parentProc.idProceso,
                    idRegActuacion: act.idRegActuacion,
                    url           : `/Carpeta/${ parentProc.carpetaNumero }/ultimasActuaciones/${ parentProc.idProceso }#actuacion-${ act.idRegActuacion }`,
                  },
                  actions: [
                    {
                      action: 'openCarpeta',
                      title : 'Abrir Carpeta',
                    },
                    {
                      action: 'openActuaciones',
                      title : 'Abrir Actuaciones',
                    },
                  ],
                } 
              ),
            } 
          );

          if ( !response.ok ) {
            throw new ApiError(
              `Status ${ response.status }`,
              'ActuacionService.processNotifications Webhook',
            );
          }
        } catch ( postError: any ) {
          console.log(
            `⚠️ Webhook Failed: ${ postError.message }` 
          );
          await logger.logFailure(
            parentProc.idProceso,
            act,
            postError.message,
            'WEBHOOK',
          );
        }
      }

      try {
        await TelegramService.sendNotification(
          act, parentProc 
        );
      } catch ( teleError: any ) {
        console.log(
          `⚠️ Telegram Failed: ${ teleError.message }` 
        );
        await logger.logFailure(
          parentProc.idProceso,
          act,
          teleError.message,
          'TELEGRAM',
        );
      }

      if ( NEW_ACTUACION_WEBHOOK_URL ) {
        try {
          const body = JSON.stringify(
            {
              ...act,
              ...parentProc,
            } 
          );
          const response = await fetch(
            NEW_ACTUACION_WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: body,
            } 
          );

          if ( !response.ok ) {
            throw new ApiError(
              `Status ${ response.status }`,
              'ActuacionService.processNotifications Webhook',
            );
          }
        } catch ( postError: any ) {
          console.log(
            `⚠️ Webhook Failed: ${ postError.message }` 
          );
          await logger.logFailure(
            parentProc.idProceso,
            act,
            postError.message,
            'WEBHOOK',
          );
        }
      }
    }
  }

  /**
   * Reconciles a batch of incoming API data against the local database.
   * Splits records into "New" (to be inserted) and "Existing" (to be updated),
   * and subsequently delegates to the notification service and parent-folder updater.
   * * @param apiActuaciones - Full list of actuacion records from the API response.
   * @param parentProc - Parent process context.
   * @param logger - Logger instance for capturing DB/Notification failures.
   */
  static async syncBatch(
    apiActuaciones: FetchResponseActuacionType[],
    parentProc: ProcessRequest,
    logger: FileLogger,
  ) {
    const latestItemByDate = this.getLatestByDate(
      apiActuaciones 
    );

    const existingRecords = await client.actuacion.findMany(
      {
        where: {
          idProceso: parentProc.idProceso,
        },
        select: {
          idRegActuacion: true,
        },
      } 
    );

    const existingIds = new Set(
      existingRecords.map(
        (
          r 
        ) => {
          return r.idRegActuacion;
        } 
      ),
    );

    const newItems = apiActuaciones.filter(
      (
        item 
      ) => {
        return !existingIds.has(
          String(
            item.idRegActuacion 
          ) 
        );
      } 
    );
    const existingItems = apiActuaciones.filter(
      (
        item 
      ) => {
        return existingIds.has(
          String(
            item.idRegActuacion 
          ) 
        );
      } 
    );

    if ( newItems.length > 0 ) {
      const createData = newItems.map(
        (
          item 
        ) => {
          return this.mapToPrismaInput(
            item, parentProc, latestItemByDate 
          );
        } 
      );

      for ( const actuacionNueva of createData ) {
        console.log(
          `Processing new actuacion: ${ actuacionNueva.idRegActuacion }`,
        );

        try {
          await client.actuacion.upsert(
            {
              where: {
                idRegActuacion: actuacionNueva.idRegActuacion,
              },
              create: actuacionNueva,
              update: {
                cant         : actuacionNueva.cant,
                consActuacion: actuacionNueva.consActuacion,
              },
            } 
          );
          console.log(
            `   ✅ Inserted ${ actuacionNueva.idRegActuacion } new records.`,
          );
        } catch ( error: any ) {
          console.log(
            `   ❌ Insert Failed for ${ actuacionNueva.idRegActuacion }: ${ error.message }`,
          );
          await logger.logFailure(
            parentProc.idProceso,
            actuacionNueva,
            error.message,
            'DB_ITEM',
          );
        }
      }

      await this.processNotifications(
        newItems, parentProc, logger 
      );
    }

    if ( existingItems.length > 0 ) {
      await pMap(
        existingItems,
        async (
          item 
        ) => {
          const isUltima = latestItemByDate
            ? String(
              item.idRegActuacion 
            )
              === String(
                latestItemByDate.idRegActuacion 
              )
            : item.cant === item.consActuacion;

          try {
            await client.actuacion.update(
              {
                where: {
                  idRegActuacion: String(
                    item.idRegActuacion 
                  ),
                },
                data: {
                  isUltimaAct: isUltima,
                  cant       : item.cant,
                },
              } 
            );
          } catch ( err: any ) {
            console.log(
              `   ❌ Update Failed: ${ err.message }` 
            );
            await logger.logFailure(
              parentProc.idProceso,
              existingItems,
              err.message,
              'DB_ITEM',
            );
          }
        },
        10,
      );
    }

    await this.updateCarpetaIfNewer(
      apiActuaciones, parentProc 
    );
  }

  /**
   * Examines the latest Actuacion and updates the parent `Carpeta` record if the date
   * or specific Actuacion ID differs from what is currently saved in the database.
   * Resets `isUltimaAct` flags locally to ensure relational integrity.
   * * @param actuaciones - Full array of fetched items for context.
   * @param parentProc - Parent process information mapping to the `Carpeta` table.
   */
  static async updateCarpetaIfNewer(
    actuaciones: FetchResponseActuacionType[],
    parentProc: ProcessRequest,
  ) {
    const incomingLast = this.getLatestByDate(
      actuaciones 
    );

    if ( !incomingLast ) {
      return;
    }

    try {
      const carpeta = await client.carpeta.findUnique(
        {
          where: {
            numero: parentProc.carpetaNumero,
          },
          select: {
            idRegUltimaAct: true,
            fecha         : true,
          },
        } 
      );

      if ( !carpeta ) {
        return;
      }

      const incomingParsed = ensureDate(
        incomingLast.fechaActuacion 
      );
      const savedParsed = ensureDate(
        carpeta.fecha 
      );

      const incomingTime = incomingParsed?.getTime() ?? 0;
      const savedTime = savedParsed?.getTime() ?? 0;

      const isNewerDate = incomingTime > savedTime;
      const isSameDateDifferentActuacion
        = incomingTime === savedTime
        && carpeta.idRegUltimaAct !== String(
          incomingLast.idRegActuacion 
        );

      if ( !savedParsed || isNewerDate || isSameDateDifferentActuacion ) {
        console.log(
          `carpeta.idRegUltimaAct is different from incomingLast.idRegActuacion? ${
            carpeta.idRegUltimaAct !== String(
              incomingLast.idRegActuacion 
            )
          }`,
        );

        if ( isNewerDate ) {
          console.log(
            `📅 Incoming actuacion date (${ formatDateToString(
              incomingParsed ?? new Date(),
            ) }) is newer than Carpeta date (${ formatDateToString(
              savedParsed ?? new Date(),
            ) }). Updating...`,
          );
        } else if ( isSameDateDifferentActuacion ) {
          console.log(
            '📅 Incoming actuacion date is the same as Carpeta date, but it\'s a different Actuacion ID. Updating...',
          );
        } else {
          console.log(
            '📅 Carpeta has no previous date. Updating...' 
          );
        }

        console.log(
          `🔄 Updating Carpeta ${ parentProc.carpetaNumero } date.` 
        );

        try {
          if (
            carpeta.idRegUltimaAct
            && carpeta.idRegUltimaAct !== String(
              incomingLast.idRegActuacion 
            )
          ) {
            await client.actuacion.updateMany(
              {
                where: {
                  idRegActuacion: carpeta.idRegUltimaAct,
                },
                data: {
                  isUltimaAct: false,
                },
              } 
            );
          }
        } catch ( error ) {
          console.log(
            `🚫 error resetting previous flag: ${ JSON.stringify(
              error 
            ) }`,
          );
        }

        const savedActuacion = await client.actuacion.upsert(
          {
            where: {
              idRegActuacion: `${ incomingLast.idRegActuacion }`,
            },
            create: {
              ...incomingLast,
              actuacion: String(
                incomingLast.actuacion 
              ) || 'Sin descripción',
              anotacion: String(
                incomingLast.anotacion 
              ),
              idProceso     : parentProc.idProceso,
              isUltimaAct   : true,
              idRegActuacion: `${ incomingLast.idRegActuacion }`,
              fechaActuacion:
              ensureDate(
                incomingLast.fechaActuacion 
              ) ?? new Date(),
              fechaRegistro: ensureDate(
                incomingLast.fechaRegistro 
              ) ?? new Date(),
              fechaInicial: ensureDate(
                incomingLast.fechaInicial 
              ) ?? undefined,
              fechaFinal: ensureDate(
                incomingLast.fechaFinal 
              ) ?? undefined,
              proceso: {
                connect: {
                  idProceso: parentProc.idProceso,
                },
              },
            },
            update: {
              cant: incomingLast.cant,
              fechaActuacion:
              ensureDate(
                incomingLast.fechaActuacion 
              ) ?? new Date(),
              fechaRegistro: ensureDate(
                incomingLast.fechaRegistro 
              ) ?? new Date(),
              fechaInicial: ensureDate(
                incomingLast.fechaInicial 
              ) ?? undefined,
              fechaFinal: ensureDate(
                incomingLast.fechaFinal 
              ) ?? undefined,
            },
          } 
        );

        console.log(
          `🔄 Updated the last actuacion:  ${ formatDateToString(
            savedActuacion.fechaActuacion,
          ) } date.`,
        );

        const updateCarpeta = await client.carpeta.update(
          {
            where: {
              numero: parentProc.carpetaNumero,
            },
            data: {
              fecha: ensureDate(
                savedActuacion.fechaActuacion 
              ),
              revisado       : false,
              updatedAt      : new Date(),
              ultimaActuacion: {
                connect: {
                  idRegActuacion: String(
                    savedActuacion.idRegActuacion 
                  ),
                },
              },
            },
          } 
        );

        if ( updateCarpeta.fecha ) {
          console.log(
            `🔄 Updated carpeta:  ${ formatDateToString(
              updateCarpeta.fecha,
            ) } date.`,
          );
        }
      }
    } catch ( error ) {
      console.log(
        `❌ Error updating carpeta ${ parentProc.carpetaNumero }:`,
        error,
      );
    }
  }
}
