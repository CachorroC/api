/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
//process.env[ 'NODE_TLS_REJECT_UNAUTHORIZED' ] = '0';
//console.log(
//process.env.NODE_TLS_REJECT_UNAUTHORIZED
//);

// ==========================================
// 1. IMPORTS & SETUP
// ==========================================
import 'dotenv/config'; // Must be first to load .env
import path from 'path';
import * as fs from 'fs/promises';
import { client } from './prisma.js';
import { Prisma } from '../prisma/generated/prisma/client.js';
import { ensureDate, formatDateToString } from '../utils/ensureDate.js';
import { TelegramService } from './telegramService.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';

// ==========================================
// 2. CONFIGURATION & CONSTANTS
// ==========================================
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const NEW_ACTUACION_WEBHOOK_URL = process.env.NEW_ACTUACION_WEBHOOK_URL || '';

const NEW_ITEMS_LOG_FILE = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';
const RAMA_JUDICIAL_BASE_URL = process.env.RAMA_JUDICIAL_BASE_URL || 'https://consultaprocesos.ramajudicial.gov.co:448';

// ==========================================
// 3. TYPES, INTERFACES & ERRORS
// ==========================================

/**
 * Internal representation of a legal process to be synced.
 * Contains the necessary identifiers to fetch data from the Rama Judicial API
 * and map it back to the local database.
 */
export interface ProcessRequest {
  idProceso    : string;
  carpetaNumero: number;
  llaveProceso : string;
  carpetaId    : number;
  nombre       : string;
  category?    : string | null;
}

/**
 * Raw data structure returned by the Rama Judicial API for a single "Actuación".
 */
export interface FetchResponseActuacion {
  actuacion     : string;
  anotacion     : string | null;
  cant          : number;
  codRegla      : string;
  conDocumentos : boolean;
  consActuacion : number;
  fechaActuacion: string | Date;
  fechaFinal    : string | Date | null;
  fechaInicial  : string | Date | null;
  fechaRegistro : string | Date;
  idRegActuacion: number;
  llaveProceso  : string;
}

/**
 * Full paginated response wrapper from the Rama Judicial Actuaciones endpoint.
 */
export interface ConsultaActuacionResponse {
  actuaciones: FetchResponseActuacion[];
  paginacion: {
    cantidadRegistros: number;
    registrosPagina  : number;
    cantidadPaginas  : number;
    pagina           : number;
  };
}

/**
 * Custom error class for API interactions.
 * Includes a `callerId` to easily trace which part of the sync process failed.
 */
export class ApiError extends Error {
  /**
   * @param message - The error description.
   * @param callerId - Identifier of the function or process that threw the error.
   * @param statusCode - Optional HTTP status code associated with the error.
   */
  constructor(
    public message: string,
    public callerId: string,
    public statusCode?: number
  ) {
    super(
      message
    );
    this.name = 'ApiError';
    this.callerId = callerId;
    console.log(
      `${ callerId }ApiError: ${ message }`
    );
  }
}

// ==========================================
// 4. GENERIC UTILITIES
// ==========================================

/**
 * Halts execution for a specified number of milliseconds.
 * Useful for rate-limiting and preventing server blocks.
 * * @param ms - Milliseconds to wait.
 * @returns A promise that resolves after the timeout.
 */
const wait = (
  ms: number
) => {
  return new Promise(
    (
      resolve
    ) => {
      return setTimeout(
        resolve, ms
      );
    }
  );
};

/**
 * Executes a mapper function over an array of items with controlled concurrency.
 * Ensures that no more than `concurrency` promises are running at the same time.
 * * @template T - The type of items in the input array.
 * @template R - The expected return type from the mapper function.
 * @param array - The array of items to process.
 * @param mapper - An async function applied to each item.
 * @param concurrency - Maximum number of concurrent operations.
 * @returns A promise resolving to an array of mapped results.
 */
async function pMap<T, R>(
  array: T[],
  mapper: ( item: T ) => Promise<R>,
  concurrency: number
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


// ==========================================
// 5. INFRASTRUCTURE SERVICES (Logging & Alerts)
// ==========================================

/**
 * Service responsible for writing system logs to local JSON files.
 * Provides a persistent fallback for monitoring sync failures and accumulating new items.
 */
class FileLogger {
  private filePath: string;

  /**
   * @param filename - The name of the JSON log file to target within the `/logs` directory.
   */
  constructor(
    filename: string
  ) {
    this.filePath = path.join(
      process.cwd(), 'logs', filename
    );
    this.ensureDir();
  }

  /**
   * Ensures the `logs` directory exists, creating it recursively if necessary.
   */
  private async ensureDir() {
    try {
      await fs.mkdir(
        path.dirname(
          this.filePath
        ), {
          recursive: true
        }
      );
    } catch {
      /* ignore */
    }
  }

  /**
   * Logs a failed operation during the synchronization process.
   * Upserts the error log based on Process ID or Carpeta Numero to avoid duplicate entries.
   * * @param contextId - The ID of the parent process (or '0' if unknown).
   * @param subItem - The specific data item being processed when the failure occurred.
   * @param error - The error message string.
   * @param phase - The pipeline phase where the error occurred ('FETCH', 'DB_ITEM', 'WEBHOOK', 'TELEGRAM').
   */
  public async logFailure(
    contextId: string | number,
    subItem: any,
    error: string,
    phase: 'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM'
  ) {
    const carpetaNumero = subItem?.carpetaNumero
      || subItem?.data?.carpetaNumero
      || subItem?.proceso?.carpetaNumero
      || null;

    const logTime = new Date();
    const formatedLogTime = new Intl.DateTimeFormat(
      'es-CO', {
        weekday     : 'long',
        year        : 'numeric',
        month       : 'long',
        day         : 'numeric',
        hour        : 'numeric',
        minute      : 'numeric',
        second      : 'numeric',
        timeZoneName: 'short',
      }
    )
      .format(
        logTime
      );

    const logEntry = {
      timestamp        : logTime.toISOString(),
      formatedTimeStamp: formatedLogTime,
      phase,
      parentId         : contextId,
      error,
      data             : subItem,
      carpetaNumero    : carpetaNumero,
    };

    try {
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          this.filePath, 'utf-8'
        );
        currentData = JSON.parse(
          fileContent
        );

        if ( !Array.isArray(
          currentData
        ) ) {
          currentData = [];
        }
      } catch {
        currentData = [];
      }

      const existingIndex = currentData.findIndex(
        (
          item
        ) => {
          const incomingId = String(
            contextId
          );
          const itemId = String(
            item.parentId
          );

          if ( incomingId !== '0' && itemId === incomingId ) {
            return true;
          }

          const itemCarpeta = item.carpetaNumero || item.data?.carpetaNumero;

          if ( carpetaNumero && itemCarpeta && String(
            itemCarpeta
          ) === String(
            carpetaNumero
          ) ) {
            return true;
          }

          return false;
        }
      );

      if ( existingIndex !== -1 ) {
        currentData[ existingIndex ] = logEntry;
      } else {
        currentData.push(
          logEntry
        );
      }

      await fs.writeFile(
        this.filePath, JSON.stringify(
          currentData, null, 2
        ), 'utf-8'
      );
    } catch ( e ) {
      console.log(
        'Failed to write to log file', e
      );
    }
  }

  /**
   * Accumulates newly detected 'Actuaciones' into a JSON file for backup and review.
   * Uses an upsert logic based on the `carpetaNumero` to maintain the latest status.
   * * @param newItems - Array of newly fetched Actuaciones.
   * @param parentProc - The parent process metadata.
   */
  public async logNewItems(
    newItems: FetchResponseActuacion[],
    parentProc: ProcessRequest
  ) {
    const filePath = path.join(
      process.cwd(), 'logs', NEW_ITEMS_LOG_FILE
    );

    const itemsToSave = newItems.map(
      (
        item
      ) => {
        return {
          ...item,
          _meta: {
            detectedAt: new Date()
              .toISOString(),
            carpetaNumero: parentProc.carpetaNumero,
            processId    : parentProc.idProceso,
          },
        };
      }
    );

    try {
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          filePath, 'utf-8'
        );
        currentData = JSON.parse(
          fileContent
        );

        if ( !Array.isArray(
          currentData
        ) ) {
          currentData = [];
        }
      } catch {
        currentData = [];
      }

      for ( const newItem of itemsToSave ) {
        const existingIndex = currentData.findIndex(
          (
            existing
          ) => {
            return existing._meta && existing._meta.carpetaNumero === newItem._meta.carpetaNumero;
          }
        );

        if ( existingIndex !== -1 ) {
          currentData[ existingIndex ] = newItem;
        } else {
          currentData.push(
            newItem
          );
        }
      }

      await fs.writeFile(
        filePath, JSON.stringify(
          currentData, null, 2
        ), 'utf-8'
      );
    } catch ( error ) {
      console.log(
        '❌ Failed to save new items to JSON file:', error
      );
    }
  }
}

// ==========================================
// 6. BUSINESS LOGIC (Database & Sync)
// ==========================================

/**
 * Core business logic for comparing, transforming, and saving legal records.
 * Handles the Prisma database integration and triggering external notifications.
 */
class ActuacionService {

  /**
   * Evaluates an array of API records to determine the absolute latest one based on
   * `fechaActuacion`, falling back to `fechaRegistro`, and finally `consActuacion`.
   * * @param actuaciones - List of raw Actuaciones from the API.
   * @returns The most recent Actuacion object, or null if the array is empty.
   */
  private static getLatestByDate(
    actuaciones: FetchResponseActuacion[]
  ): FetchResponseActuacion | null {
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
    apiData: FetchResponseActuacion,
    parentProc: ProcessRequest,
    actualLatestItem: FetchResponseActuacion | null
  ): Prisma.ActuacionCreateInput {
    const isUltima = actualLatestItem
      ? String(
        apiData.idRegActuacion
      ) === String(
        actualLatestItem.idRegActuacion
      )
      : false;

    const cleanActuacion = String(
      apiData.actuacion
    ) || 'Sin descripción';
    const cleanAnotacion = String(
      apiData.anotacion
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
      createdAt     : new Date(),
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
    newItems: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger
  ) {
    if ( newItems.length === 0 ) {
      return;
    }

    console.log(
      `✨ Found ${ newItems.length } NEW Actuaciones. Processing notifications...`
    );
    await logger.logNewItems(
      newItems, parentProc
    );

    for ( const [
      index,
      act
    ] of newItems.entries() ) {
      if ( index > 0 ) {
        await wait(
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
                'Content-Type': 'application/json'
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
                      title : 'Abrir Carpeta'
                    },
                    {
                      action: 'openActuaciones',
                      title : 'Abrir Actuaciones'
                    },
                  ],
                }
              ),
            }
          );

          if ( !response.ok ) {
            throw new ApiError(
              `Status ${ response.status }`, 'ActuacionService.processNotifications Webhook'
            );
          }
        } catch ( postError: any ) {
          console.log(
            `⚠️ Webhook Failed: ${ postError.message }`
          );
          await logger.logFailure(
            parentProc.idProceso, act, postError.message, 'WEBHOOK'
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
          parentProc.idProceso, act, teleError.message, 'TELEGRAM'
        );
      }

      if ( NEW_ACTUACION_WEBHOOK_URL ) {
        try {
          const body = JSON.stringify(
            {
              ...act,
              ...parentProc
            }
          );
          const response = await fetch(
            NEW_ACTUACION_WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: body,
            }
          );

          if ( !response.ok ) {
            throw new ApiError(
              `Status ${ response.status }`, 'ActuacionService.processNotifications Webhook'
            );
          }
        } catch ( postError: any ) {
          console.log(
            `⚠️ Webhook Failed: ${ postError.message }`
          );
          await logger.logFailure(
            parentProc.idProceso, act, postError.message, 'WEBHOOK'
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
    apiActuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger
  ) {
    const latestItemByDate = this.getLatestByDate(
      apiActuaciones
    );

    const existingRecords = await client.actuacion.findMany(
      {
        where: {
          idProceso: parentProc.idProceso
        },
        select: {
          idRegActuacion: true
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
      )
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
          `Processing new actuacion: ${ actuacionNueva.idRegActuacion }`
        );

        try {
          await client.actuacion.upsert(
            {
              where: {
                idRegActuacion: actuacionNueva.idRegActuacion
              },
              create: actuacionNueva,
              update: {
                cant         : actuacionNueva.cant,
                consActuacion: actuacionNueva.consActuacion,
              },
            }
          );
          console.log(
            `   ✅ Inserted ${ actuacionNueva.idRegActuacion } new records.`
          );
        } catch ( error: any ) {
          console.log(
            `   ❌ Insert Failed for ${ actuacionNueva.idRegActuacion }: ${ error.message }`
          );
          await logger.logFailure(
            parentProc.idProceso, actuacionNueva, error.message, 'DB_ITEM'
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
            ) === String(
              latestItemByDate.idRegActuacion
            )
            : item.cant === item.consActuacion;

          try {
            await client.actuacion.update(
              {
                where: {
                  idRegActuacion: String(
                    item.idRegActuacion
                  )
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
              parentProc.idProceso, existingItems, err.message, 'DB_ITEM'
            );
          }
        },
        10
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
    actuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest
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
            numero: parentProc.carpetaNumero
          },
          select: {
            idRegUltimaAct: true,
            fecha         : true
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
      const isSameDateDifferentActuacion = ( incomingTime === savedTime )
                                           && ( carpeta.idRegUltimaAct !== String(
                                             incomingLast.idRegActuacion
                                           ) );

      if ( !savedParsed || isNewerDate || isSameDateDifferentActuacion ) {
        console.log(
          `carpeta.idRegUltimaAct is different from incomingLast.idRegActuacion? ${ carpeta.idRegUltimaAct !== String(
            incomingLast.idRegActuacion
          ) }`
        );

        if ( isNewerDate ) {
          console.log(
            `📅 Incoming actuacion date (${ formatDateToString(
              incomingParsed ?? new Date()
            ) }) is newer than Carpeta date (${ formatDateToString(
              savedParsed ?? new Date()
            ) }). Updating...`
          );
        } else if ( isSameDateDifferentActuacion ) {
          console.log(
            '📅 Incoming actuacion date is the same as Carpeta date, but it\'s a different Actuacion ID. Updating...'
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
          if ( carpeta.idRegUltimaAct && carpeta.idRegUltimaAct !== String(
            incomingLast.idRegActuacion
          ) ) {
            await client.actuacion.updateMany(
              {
                where: {
                  idRegActuacion: carpeta.idRegUltimaAct
                },
                data: {
                  isUltimaAct: false
                },
              }
            );
          }
        } catch ( error ) {
          console.log(
            `🚫 error resetting previous flag: ${ JSON.stringify(
              error
            ) }`
          );
        }

        const savedActuacion = await client.actuacion.upsert(
          {
            where: {
              idRegActuacion: `${ incomingLast.idRegActuacion }`
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
              fechaActuacion: ensureDate(
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
                  idProceso: parentProc.idProceso
                }
              },
            },
            update: {
              cant          : incomingLast.cant,
              fechaActuacion: ensureDate(
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
            savedActuacion.fechaActuacion
          ) } date.`
        );

        const updateCarpeta = await client.carpeta.update(
          {
            where: {
              numero: parentProc.carpetaNumero
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
                  )
                },
              },
            },
          }
        );

        if ( updateCarpeta.fecha ) {
          console.log(
            `🔄 Updated carpeta:  ${ formatDateToString(
              updateCarpeta.fecha
            ) } date.`
          );
        }
      }
    } catch ( error ) {
      console.log(
        `❌ Error updating carpeta ${ parentProc.carpetaNumero }:`, error
      );
    }
  }
}

// ==========================================
// 7. EXTERNAL API CLIENT
// ==========================================

/**
 * Custom API client built specifically to communicate with the Rama Judicial systems.
 * Implements randomized delay mechanisms for rate limit compliance, smart retry logic,
 * and specific Latin-1 (ISO-8859-1) payload decoding to handle Spanish diacritics.
 */
export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  /** Fixed baseline delay to adhere to rate limits in ms */
  private readonly RATE_LIMIT_DELAY_MS = 12000;

  /**
   * @param baseUrl - The base URL of the judicial consultation endpoint.
   */
  constructor(
    baseUrl: string
  ) {
    this.baseUrl = baseUrl;
    this.logger = new FileLogger(
      'failed_sync_ops.json'
    );
  }

  /**
   * Generates specific headers to masquerade as standard browser traffic.
   */
  private getHeaders() {
    return {
      'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,es-CO;q=0.8,es-US;q=0.7,es;q=0.6',
      'Sec-Fetch-Dest' : 'document',
      'Sec-Fetch-Mode' : 'navigate',
      'Sec-Fetch-Site' : 'none',
    };
  }

  /**
   * Internal fetching mechanism that explicitly intercepts the raw array buffer.
   * It decodes using ISO-8859-1 to resolve corrupted court identifiers and accents
   * (e.g., 'ñ', 'ó') before parsing the JSON response.
   * * @template T - The expected JSON shape of the response.
   * @param endpoint - The specific API path to append to the baseUrl.
   * @returns A promise resolving to the decoded JSON object.
   * @throws {ApiError} If the HTTP status is not OK, or JSON parsing fails.
   */
  private async fetchWithRetry<T>(
    endpoint: string
  ): Promise<T> {
    const options = {
      headers: this.getHeaders()
    };
    const response = await fetchWithSmartRetry(
      `${ this.baseUrl }${ endpoint }`, options
    );

    if ( !response.ok ) {
      throw new ApiError(
        `HTTP ${ response.status } ${ response.statusText }`,
        '🚫 failed request: fetchWithRetry:',
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder(
      'utf-8'
    );
    const text = decoder.decode(
      arrayBuffer
    );

    try {
      return JSON.parse(
        text
      ) as T;
    } catch ( e ) {
      console.error(
        'Error parsing JSON after decoding:', e
      );

      throw new ApiError(
        'Invalid JSON response', '🚫 failed request: fetchWithRetry: JSON.parse'
      );
    }
  }

  /**
   * Executes the fetching sequence over an array of processes.
   * Introduces a randomized delay jitter on top of the strict rate-limit delay
   * to avoid triggering WAF blocks on the judicial API.
   * * @param items - Array of standardized ProcessRequests to fetch against.
   * @param pathBuilder - Callback generating the specific URL path for an item.
   */
  public async processBatch(
    items: ProcessRequest[],
    pathBuilder: ( item: ProcessRequest ) => string
  ): Promise<void> {
    console.log(
      `🚀 Starting process for ${ items.length } targets...`
    );

    for ( const [
      index,
      parentItem
    ] of items.entries() ) {
      if ( index > 0 ) {
        const variableDelay = this.RATE_LIMIT_DELAY_MS + Math.floor(
          Math.random() * 1000
        );
        await wait(
          variableDelay
        );
      }

      try {
        const endpoint = pathBuilder(
          parentItem
        );
        console.log(
          `🌐 [${ index + 1 }/${ items.length }] Fetching: ${ parentItem.carpetaNumero }`
        );

        const apiResponse = await this.fetchWithRetry<ConsultaActuacionResponse>(
          endpoint
        );
        const actuacionesList = apiResponse.actuaciones || [];

        if ( actuacionesList.length > 0 ) {
          await ActuacionService.syncBatch(
            actuacionesList, parentItem, this.logger
          );
        }
      } catch ( err: any ) {
        console.log(
          `❌ FAILED ${ parentItem.carpetaNumero }: ${ err.message }`
        );
        await this.logger.logFailure(
          parentItem.idProceso, parentItem, err.message, 'FETCH'
        );
      }
    }
  }
}

// ==========================================
// 8. MAIN EXECUTION ENTRY POINT
// ==========================================

/**
 * Retrieves all registered 'Carpetas' from the database and flattens them
 * into actionable `ProcessRequest` objects. Accounts for Carpetas without associated
 * process IDs by injecting a placeholder ID of '0'.
 * * @returns A promise resolving to a sorted array of processes ready for synchronization.
 */
async function getProcesosToUpdate(): Promise<ProcessRequest[]> {
  const carpetas = await client.carpeta.findMany();

  return carpetas
    .flatMap(
      (
        carpeta
      ) => {
        const baseData = {
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
          nombre       : carpeta.nombre,
          category     : carpeta.category,
        };

        if ( !carpeta.idProcesos || carpeta.idProcesos.length === 0 ) {
          return {
            ...baseData,
            idProceso: '0'
          };
        }

        return carpeta.idProcesos.map(
          (
            idProceso
          ) => {
            return {
              ...baseData,
              idProceso
            };
          }
        );
      }
    )
    .sort(
      (
        a, b
      ) => {
        return b.carpetaNumero - a.carpetaNumero;
      }
    );
}

/**
 * The primary executor function acting as a cron-job controller.
 * It determines the current time window, filters the database items by their `category`,
 * and delegates the filtered batch to the `RobustApiClient`.
 */
async function runSync() {
  const startTime = new Date();
  const formattedCustomStartTime = new Intl.DateTimeFormat(
    'es-CO', {
      weekday     : 'long',
      year        : 'numeric',
      month       : 'long',
      day         : 'numeric',
      hour        : 'numeric',
      minute      : 'numeric',
      second      : 'numeric',
      timeZoneName: 'short',
    }
  )
    .format(
      startTime
    );

  console.log(
    formattedCustomStartTime
  );
  console.log(
    `\n⏱️  Execution Started at: ${ formattedCustomStartTime }`
  );

  // --- FREQUENCY LOGIC ---
  const currentHour = startTime.getHours();
  const currentDay = startTime.getDay();

  // Time Windows
  const isMidnightRun = currentHour < 6;
  const isNoonRun = currentHour >= 12 && currentHour < 18;

  const api = new RobustApiClient(
    RAMA_JUDICIAL_BASE_URL
  );

  try {
    const allProcesses = await getProcesosToUpdate();

    const processesToCheck = allProcesses.filter(
      (
        proc
      ) => {
        const category = ( proc.category || 'default' ).toString()
          .toLowerCase()
          .trim();

        if ( category === 'bancolombia' ) {
          console.log(
            `category is bancolombia ${ proc.carpetaNumero }`
          );

          return true; // Runs every window
        }

        if ( category === 'terminados' ) {
          return isMidnightRun && currentDay === 3; // Wednesday Midnight (Day 3)
        }

        if ( category === 'reintegra' ) {
          return isNoonRun;
        }

        return isNoonRun;
      }
    );

    console.log(
      `🔎 Filter applied: Processing ${ processesToCheck.length } of ${ allProcesses.length } items.`
    );

    if ( processesToCheck.length > 0 ) {
      await api.processBatch(
        processesToCheck, (
          proc
        ) => {
          return `/api/v2/Proceso/Actuaciones/${ proc.idProceso }`;
        }
      );
    } else {
      console.log(
        '😴 No processes scheduled for this run window.'
      );
    }

    console.log(
      '🎉 Sync Complete'
    );
  } catch ( error ) {
    console.log(
      'Fatal Error in runSync:', error
    );
  } finally {
    await client.$disconnect();

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(
      ( durationMs / 1000 ) % 60
    );
    const minutes = Math.floor(
      ( durationMs / ( 1000 * 60 ) ) % 60
    );
    const hours = Math.floor(
      durationMs / ( 1000 * 60 * 60 )
    );
    const durationString = `${ hours }h ${ minutes }m ${ seconds }s`;

    const formattedCustomEndTime = new Intl.DateTimeFormat(
      'es-CO', {
        weekday     : 'long',
        year        : 'numeric',
        month       : 'long',
        day         : 'numeric',
        hour        : 'numeric',
        minute      : 'numeric',
        second      : 'numeric',
        timeZoneName: 'short',
      }
    )
      .format(
        endTime
      );

    console.log(
      formattedCustomEndTime
    );
    console.log(
      `\n🏁 Execution Finished at: ${ formattedCustomEndTime }`
    );
    console.log(
      `⏱️  Total Duration: ${ durationString } (${ durationMs }ms)`
    );
  }
}

runSync();