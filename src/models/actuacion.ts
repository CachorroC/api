/**
 * @fileoverview Actuacion Module - Legal Action/Motion Processor
 *
 * This module manages legal actions (actuaciones) from the Colombian Judiciary system.
 * It provides:
 * - Data transformation from API responses to database models
 * - Change detection to identify new actuations
 * - Notification dispatching (webhooks, Telegram) for new actions
 * - Concurrent data processing with configurable concurrency limits
 *
 * Key Classes:
 * - Actuacion: Represents a single legal action with full metadata
 * - ActuacionService: Service layer for processing batches of actuations
 *
 * @module actuacion
 */

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

/**
 * Concurrency-limited map function for processing array items asynchronously.
 *
 * This function processes an array of items through an async mapper function
 * while limiting the number of concurrent operations. It's useful for rate-limited
 * API interactions or resource-constrained scenarios.
 *
 * Implementation uses Promise.race() to wait for the fastest concurrent promise,
 * then continues when space opens up in the execution queue.
 *
 * @async
 * @template T - The type of input array elements
 * @template R - The type of mapped result elements
 * @param {T[]} array - The array of items to process
 * @param {(item: T) => Promise<R>} mapper - Async function that transforms each item
 * @param {number} concurrency - Maximum number of concurrent operations allowed
 * @returns {Promise<R[]>} Array of results in the same order as input items
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5];
 * const results = await pMap(
 *   numbers,
 *   async (n) => ({ value: n * 2 }),
 *   2 // Process 2 at a time
 * );
 */
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

/**
 * Represents a single legal action (actuación) in a judicial process.
 *
 * This class encapsulates all metadata and details of a court action or motion,
 * including dates, descriptions, documents, and case references. It serves as the
 * data model for storing and processing judicial actions from the Rama Judicial API.
 *
 * Properties are automatically converted and validated during construction:
 * - Date strings are converted to Date objects
 * - Null/undefined dates are preserved as null
 * - String identifiers are coerced to ensure consistency
 * - Records the creation timestamp
 *
 * @class Actuacion
 * @implements {DatabaseActuacionType} - Implements the database type interface
 *
 * @property {Date} createdAt - Timestamp when this record was created locally
 * @property {string} idProceso - The process ID reference
 * @property {boolean} isUltimaAct - Flag indicating if this is the latest action for the process
 * @property {number} carpetaNumero - The case folder number
 * @property {string} actuacion - Description of the legal action/motion
 * @property {string|null} anotacion - Optional annotation or notes
 * @property {number} cant - Quantity or count
 * @property {string} codRegla - Rule or regulation code
 * @property {boolean} conDocumentos - Whether this action has associated documents
 * @property {number} consActuacion - Consecutive action number
 * @property {Date} fechaActuacion - Date when the action occurred
 * @property {Date|null} fechaFinal - Optional end date
 * @property {Date|null} fechaInicial - Optional start date
 * @property {Date} fechaRegistro - Date when the action was registered
 * @property {string} idRegActuacion - Unique identifier for this action record
 * @property {string} llaveProceso - The case filing number (process key)
 */
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

  /**
   * Constructs an Actuacion instance from API response data.
   *
   * This constructor transforms raw API data into a strongly-typed Actuacion object:
   * 1. Initializes the creation timestamp to track when this record was added locally
   * 2. Copies and validates all metadata from the API response
   * 3. Converts date strings to JavaScript Date objects
   * 4. Handles null/undefined dates gracefully
   * 5. Coerces identifiers to strings for consistency
   *
   * Process Relationships:
   * - Links to a specific process via idProceso
   * - Belongs to a case folder via carpetaNumero
   * - Tracks the case filing number via llaveProceso
   *
   * @param {Object} params - Constructor parameters object
   * @param {FetchResponseActuacionType} params.actuacion - Raw actuacion data from the API
   * @param {string} params.idProceso - The process ID this action belongs to
   * @param {boolean} params.isUltimaAct - Whether this is the latest action for the process
   * @param {number} params.carpetaNumero - The case folder number for this action
   *
   * @example
   * const actuacion = new Actuacion({
   *   actuacion: apiData,
   *   idProceso: '123456',
   *   isUltimaAct: true,
   *   carpetaNumero: 1
   * });
   */
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

/**
 * Service class for processing batches of legal actions from the Colombian Judiciary API.
 *
 * This service handles:
 * 1. **Data transformation**: Converts raw API responses to database-compatible formats
 * 2. **Change detection**: Identifies new actions not yet in the database
 * 3. **Concurrent processing**: Processes multiple batches with configurable concurrency
 * 4. **Notifications**: Dispatches webhooks and Telegram messages for new actions
 * 5. **Error tracking**: Logs failed operations to JSON files
 *
 * Workflow:
 * - API response → getLatestByDate() → mapToPrismaInput() → processActuaciones()
 *                                                           ↓
 *                                                     processNotifications()
 *
 * Key Responsibilities:
 * - Determine the latest action in a batch (for isUltimaAct flag)
 * - Sanitize text fields to ensure data quality
 * - Compare new actions against existing database records
 * - Log and notify about new actions
 * - Handle database inserts with proper error handling
 *
 * @class ActuacionService
 */
export class ActuacionService {
  /**
   * Finds the most recent legal action from a batch based on temporal precedence.
   *
   * Priority order for determining "latest":
   * 1. **fechaActuacion** (action date) - Primary timestamp
   * 2. **fechaRegistro** (registration date) - Secondary fallback
   * 3. **consActuacion** (consecutive number) - Final tiebreaker
   *
   * This method handles dates that may be null or invalid gracefully.
   *
   * @private
   * @param {FetchResponseActuacionType[]} actuaciones - Array of raw action records from API
   * @returns {FetchResponseActuacionType | null} The action with the latest timestamp,
   *                                              or null if array is empty
   *
   * @example
   * const latestAction = ActuacionService.getLatestByDate(apiResults);
   * if (latestAction) {
   *   console.log(`Latest action: ${latestAction.actuacion}`);
   * }
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
   * Transforms raw API action data into a Prisma-compatible CreateInput object.
   *
   * This transformation performs:
   * 1. **Date handling**: Converts string dates to Date objects with fallback to current date
   * 2. **Text sanitization**: Cleans special characters and invalid UTF-8 from action descriptions
   * 3. **Latest flag**: Sets isUltimaAct based on whether this action is the most recent
   * 4. **Relationship setup**: Connects the action to its parent process
   * 5. **Null safety**: Preserves null for optional date fields
   *
   * Text sanitization is critical as the Judiciary API may contain encoding issues
   * common in legacy government systems.
   *
   * @private
   * @static
   * @param {FetchResponseActuacionType} apiData - Raw action data from the Judiciary API
   * @param {ProcessRequest} parentProc - Metadata of the parent legal process
   * @param {FetchResponseActuacionType | null} actualLatestItem - The latest action in batch (for flagging)
   * @returns {Prisma.ActuacionCreateInput} Database-ready input object for Prisma createOne
   *
   * @example
   * const input = ActuacionService.mapToPrismaInput(
   *   apiAction,
   *   { idProceso: '123', carpetaNumero: 1, llaveProceso: '2024-1234', nombre: 'Case' },
   *   latestAction
   * );
   * await client.actuacion.create({ data: input });
   */
  private static mapToPrismaInput(
    apiData: FetchResponseActuacionType,
    parentProc: ProcessRequest,
    actualLatestItem: FetchResponseActuacionType | null,
  ): Prisma.ActuacionCreateInput {
    const isUltima = actualLatestItem
      ? String(
        apiData.idRegActuacion
      ) === String(
        actualLatestItem.idRegActuacion
      )
      : false;

    return {
      idRegActuacion: String(
        apiData.idRegActuacion
      ),
      consActuacion: apiData.consActuacion,
      // Pass directly to avoid String(null) becoming "null"
      actuacion    : sanitizeText(
        apiData.actuacion as string
      ) || 'Sin descripción',
      anotacion: apiData.anotacion
        ? sanitizeText(
            apiData.anotacion as string
          )
        : null,
      cant         : apiData.cant,
      carpetaNumero: parentProc.carpetaNumero,
      // Sanitize the remaining string fields
      codRegla     : String(
        apiData.codRegla as string
      ),
      conDocumentos: apiData.conDocumentos,
      llaveProceso : String(
        parentProc.llaveProceso
      ),
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
   * Dispatches notifications for newly discovered legal actions.
   *
   * This method handles alerting external systems about new actions:
   * 1. **File logging**: Records new items to a JSON log for audit trail
   * 2. **Webhook dispatch**: POSTs to configured webhook URL with action details
   * 3. **Telegram alerts**: Sends messages via Telegram service if configured
   * 4. **Rate limiting**: Includes 2-second delays between notifications to respect limits
   * 5. **Error resilience**: Catches and logs errors without interrupting the sync
   *
   * Webhook Payload Structure:
   * ```json
   * {
   *   "title": "{carpetaNumero} {nombre}: {actuacion}",
   *   "body": "{actuacion} {anotacion}",
   *   "icon": "/icons/notification_icon.png",
   *   "data": {
   *     "numero": number,
   *     "idProceso": string,
   *     ...
   *   }
   * }
   * ```
   *
   * @private
   * @static
   * @async
   * @param {FetchResponseActuacionType[]} newItems - Array of actions not yet in database
   * @param {ProcessRequest} parentProc - Metadata of the parent legal process
   * @param {FileLogger} logger - Logger instance for recording dispatch attempts
   * @returns {Promise<void>} Completes after all notifications are sent
   *
   * @example
   * const newActions = [apiAction1, apiAction2];
   * await ActuacionService.processNotifications(
   *   newActions,
   *   { idProceso: '123', carpetaNumero: 1, nombre: 'Case Name', ... },
   *   fileLogger
   * );
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
                'Content-Type'           : 'application/json',
                'CF-Access-Client-Id'    : process.env.CF_ACCESS_CLIENT_ID ?? '',
                'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '',
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
          console.log(
            `webhook fetch post request sent, response: ${ response.status } - ${ response.statusText }`
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
            {
              data: act,
              ...parentProc
            },
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
          {
            data: act,
            ...parentProc
          },
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
            {
              data: act,
              ...parentProc
            },
            postError.message,
            'WEBHOOK',
          );
        }
      }
    }
  }

  /**
   * Synchronizes a batch of legal actions from the API against the database.
   *
   * This is the main orchestrator method that:
   * 1. **Identifies newest action**: Determines the most recent action in the batch
   * 2. **Detects changes**: Compares incoming actions against existing database records
   * 3. **Inserts new records**: Creates database entries for previously unseen actions
   * 4. **Updates existing records**: Refreshes the isUltimaAct flag and counts
   * 5. **Sends notifications**: Dispatches webhooks and Telegram messages for new actions
   * 6. **Updates parent folder**: Marks the case folder with the newest action timestamp
   * 7. **Error tracking**: Logs any insert/update failures to the failure log
   *
   * Concurrency: Uses concurrent processing (limit 10) to efficiently update existing records.
   *
   * Workflow:
   * ```
   * API Batch → getLatestByDate()
   *             ↓
   *          Identify existing from database
   *          Split into new + existing
   *          ↓
   *      New: mapToPrismaInput() → Insert + Notify
   *      Existing: Update isUltimaAct + counts
   *          ↓
   *     updateCarpetaIfNewer() → Mark newest action in case folder
   * ```
   *
   * @static
   * @async
   * @param {FetchResponseActuacionType[]} apiActuaciones - All action records from API response
   * @param {ProcessRequest} parentProc - The parent process metadata containing:
   *                                      - idProceso: Process ID
   *                                      - carpetaNumero: Case folder number
   *                                      - llaveProceso: Case filing number
   *                                      - nombre: Case name
   * @param {FileLogger} logger - Logger for recording failures and successful inserts
   * @returns {Promise<void>}
   *
   * @throws {Error} Caught internally; errors are logged but don't interrupt sync
   *
   * @example
   * const apiResults = await fetchActuacionesRaw(processId);
   * const parentProc = { idProceso, carpetaNumero, llaveProceso, nombre };
   * await ActuacionService.syncBatch(apiResults, parentProc, logger);
   */
  static async syncBatch(
    apiActuaciones: FetchResponseActuacionType[],
    parentProc: ProcessRequest,
    logger: FileLogger,
    arrayBufferData: ArrayBuffer
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
            {
              data: actuacionNueva
            },
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
              {
                data: existingItems,
                ...parentProc
              },
              err.message,
              'DB_ITEM',
            );
          }
        },
        10,
      );
    }

    await this.updateCarpetaIfNewer(
      apiActuaciones, parentProc, arrayBufferData
    );
  }

  /**
   * Updates the parent case folder if a newer legal action is detected.
   *
   * This method keeps the case folder record synchronized with the latest court action:
   * 1. **Identifies newest action** from the incoming batch using getLatestByDate()
   * 2. **Compares dates**: Checks if the incoming action is newer than the stored one
   * 3. **Detects action changes**: If dates are equal, checks if the action ID differs
   * 4. **Resets flags**: Clears isUltimaAct from the previous latest action
   * 5. **Updates folder record**: Sets the new latest action ID and date on the case folder
   *
   * When to update:
   * - New action date > stored action date
   * - OR same date but different action ID
   * - OR no previous action date stored
   *
   * Side effect: Automatically resets isUltimaAct on the old latest action if needed.
   * This maintains relational integrity across the database.
   *
   * @static
   * @async
   * @param {FetchResponseActuacionType[]} actuaciones - Full batch of actions for context
   * @param {ProcessRequest} parentProc - Parent process metadata with carpetaNumero
   * @returns {Promise<void>}
   *
   * @example
   * const newActions = await api.getActions(processId);
   * await ActuacionService.updateCarpetaIfNewer(
   *   newActions,
   *   { carpetaNumero: 1, idProceso: '123', ... }
   * );
   * // Now carpeta.fecha and carpeta.idRegUltimaAct reflect the newest action
   */
  static async updateCarpetaIfNewer(
    actuaciones: FetchResponseActuacionType[],
    parentProc: ProcessRequest,
    arrayBufferData: ArrayBuffer
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

        let savedActuacion;

        // 👇 START OF REFACTORED TRY-CATCH BLOCK 👇
        // 👇 START OF REFACTORED TRY-CATCH BLOCK 👇
        try {
          // Attempt 1: Standard Upsert - Explicitly override ALL string fields
          savedActuacion = await client.actuacion.upsert(
            {
              where: {
                idRegActuacion: `${ incomingLast.idRegActuacion }`
              },
              create: {
                ...incomingLast,
                actuacion: sanitizeText(
                  incomingLast.actuacion as string
                ) || 'Sin descripción',
                anotacion: incomingLast.anotacion
                  ? sanitizeText(
                      incomingLast.anotacion as string
                    )
                  : null,
                codRegla: sanitizeText(
                  incomingLast.codRegla as string
                ),
                llaveProceso: sanitizeText(
                  incomingLast.llaveProceso as string
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
        } catch ( error: any ) {
          console.log(
            `⚠️ First upsert failed for ${ incomingLast.idRegActuacion }: ${ error.message }. Attempting UTF-8 ArrayBuffer fallback...`
          );

          try {
            if ( !arrayBufferData ) {
              throw new Error(
                'No ArrayBuffer provided for fallback.'
              );
            }

            const decoder = new TextDecoder(
              'iso-8859-1'
            );
            const decodedText = decoder.decode(
              arrayBufferData
            );
            const parsedJson = JSON.parse(
              decodedText
            );

            let fallbackData = incomingLast;

            const findInJson = (
              obj: any
            ): any => {
              if ( Array.isArray(
                obj
              ) ) {
                for ( const item of obj ) {
                  const found = findInJson(
                    item
                  );

                  if ( found ) {
                    return found;
                  }
                }
              } else if ( obj && typeof obj === 'object' ) {
                if ( String(
                  obj.idRegActuacion
                ) === String(
                  incomingLast.idRegActuacion
                ) ) {
                  return obj;
                }

                for ( const key of Object.keys(
                  obj
                ) ) {
                  const found = findInJson(
                    obj[ key ]
                  );

                  if ( found ) {
                    return found;
                  }
                }
              }

              return null;
            };

            const foundRecord = findInJson(
              parsedJson
            );

            if ( foundRecord ) {
              fallbackData = {
                ...incomingLast,
                ...foundRecord
              };
            }

            // Attempt 2: Retry Upsert and override ALL strings with the decoded/sanitized data
            savedActuacion = await client.actuacion.upsert(
              {
                where: {
                  idRegActuacion: `${ incomingLast.idRegActuacion }`
                },
                create: {
                  ...incomingLast,
                  actuacion: sanitizeText(
                    fallbackData.actuacion as string
                  ) || 'Sin descripción',
                  anotacion: fallbackData.anotacion
                    ? sanitizeText(
                        fallbackData.anotacion as string
                      )
                    : null,
                  codRegla: sanitizeText(
                    fallbackData.codRegla as string
                  ),
                  llaveProceso: sanitizeText(
                    fallbackData.llaveProceso as string
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
              `✅ Fallback upsert successful for ${ incomingLast.idRegActuacion }`
            );

          } catch ( fallbackError: any ) {
            console.log(
              `❌ Fallback upsert also failed: ${ fallbackError.message }`
            );

            return;
          }
        }
        // 👆 END OF REFACTORED TRY-CATCH BLOCK 👆
        // 👆 END OF REFACTORED TRY-CATCH BLOCK 👆

        // Safety check: if somehow savedActuacion is still undefined, halt to avoid crash
        if ( !savedActuacion ) {
          return;
        }

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
