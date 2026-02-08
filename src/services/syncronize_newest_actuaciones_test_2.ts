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
import { ensureDate } from '../utils/ensureDate.js';
import { TelegramService } from './telegramService.js';
// ==========================================
// 2. CONFIGURATION & CONSTANTS
// ==========================================
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const NEW_ACTUACION_WEBHOOK_URL = process.env.NEW_ACTUACION_WEBHOOK_URL || '';

const NEW_ITEMS_LOG_FILE
  = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';
const RAMA_JUDICIAL_BASE_URL
  = process.env.RAMA_JUDICIAL_BASE_URL
  || 'https://consultaprocesos.ramajudicial.gov.co:448';

// ==========================================
// 3. TYPES, INTERFACES & ERRORS
// ==========================================
// Internal: Process object to iterate over
export interface ProcessRequest {
  idProceso    : number;
  carpetaNumero: number;
  llaveProceso : string;
  carpetaId    : number;
  nombre       : string;
}

// External: Raw data from Rama Judicial API
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

// External: Full API response wrapper
export interface ConsultaActuacionResponse {
  actuaciones: FetchResponseActuacion[];
  paginacion: {
    cantidadRegistros: number;
    registrosPagina  : number;
    cantidadPaginas  : number;
    pagina           : number;
  };
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public callerId: string,
    public statusCode?: number,
  ) {
    super( message );
    this.name = 'ApiError';
    this.callerId = callerId;
    console.log( `${ callerId }ApiError: ${ message }` );
  }
}
// ==========================================
// 4. GENERIC UTILITIES (UPDATED)
// ==========================================

const wait = ( ms: number ) => {
  return new Promise( ( resolve ) => {
    return setTimeout(
      resolve, ms
    );
  } );
};



// Optimization: Run promises with limited concurrency
async function pMap<T, R>(
  array: T[],
  mapper: ( item: T ) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for ( const item of array ) {
    const p = Promise.resolve()
      .then( () => {
        return mapper( item );
      } );

    results.push( p as unknown as R );
    const e: Promise<void> = p.then( () => {
      executing.splice(
        executing.indexOf( e ), 1
      );
    } );
    executing.push( e );

    if ( executing.length >= concurrency ) {
      await Promise.race( executing );
    }
  }

  return Promise.all( results );
}

//Wrapper for fetch with retries
// ==========================================
// 4. GENERIC UTILITIES (FIXED)
// ==========================================

export async function fetchWithSmartRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 5,
  baseDelay = 4000,
): Promise<Response> {
  const totalAttempts = maxRetries + 1;
  let attempt = 1;

  while ( attempt <= totalAttempts ) {
    if ( attempt > 1 ) {
      console.log( `🔄 fetchWithSmartRetry Attempt ${ attempt } for ${ url }` );
    }

    try {
      const response = await fetch(
        url, options
      );

      // --- HANDLE 429 (RATE LIMITS) ---
      if ( response.status === 429 ) {
        const retryAfterHeader = response.headers.get( 'retry-after' );
        // Telegram often sends retry-after in seconds
        const waitTime = retryAfterHeader
          ? ( parseInt(
              retryAfterHeader, 10
            ) * 1000 ) + 1000
          : baseDelay * Math.pow(
            2, attempt
          );

        console.warn( `⚠️ [429 Too Many Requests] Pausing for ${ waitTime }ms...` );
        console.log( `⚠️ [429 Too Many Requests] Pausing for ${ waitTime }ms...` );
        await wait( waitTime );
        attempt++;

        continue;
      }

      if ( response.status === 403 ) {
        await wait( 2000 );
        attempt++;
        console.log( response.statusText );

        continue;

      }

      // --- HANDLE 403 (FORBIDDEN) ---
      // If it's Telegram, a 403 usually means the user hasn't started the bot.
      // We should NOT retry this indefinitely, or we'll get stuck.
      /* if ( response.status === 403 ) {
        // We throw a specific error so we can log it gracefully without retrying
        throw new ApiError(
          `403 Forbidden: Check permissions or Bot settings. URL: ${ url }`, 403
        );
      } */

      // Check for server errors
      if ( [
        500,
        502,
        503,
        504
      ].includes( response.status ) ) {
        throw new ApiError(
          `Server Status ${ response.status }`, `🚫 failed request: fetchWithSmartRetry: ${ url } statusCode<500`
        );
      }

      return response;

    } catch ( error: any ) {
      // Stop if we ran out of attempts or if it's a 403 (don't retry forbidden)
      if ( attempt >= totalAttempts /* || error.name === 'AbortError'  || error.statusCode === 403 */ ) {
        throw error;
      }

      const delay = ( baseDelay * attempt );
      console.warn( `⚠️ [Retry] Attempt ${ attempt }/${ totalAttempts } failed for ${ url }. Retrying in ${ delay }ms...` );
      console.log( `⚠️ [Retry] Attempt ${ attempt }/${ totalAttempts } failed for ${ url }. Retrying in ${ delay }ms...` );
      await wait( delay );
      attempt++;
    }
  }

  throw new ApiError(
    'fetchWithSmartRetry failed unexpectedly', `🚫 failed request: fetchWithSmartRetry: ${ url }`
  );
}

// ==========================================
// 5. INFRASTRUCTURE SERVICES (Logging & Alerts)
// ==========================================

class FileLogger {
  private filePath: string;

  constructor( filename: string ) {
    this.filePath = path.join(
      process.cwd(), 'logs', filename
    );
    this.ensureDir();
  }

  private async ensureDir() {
    try {
      await fs.mkdir(
        path.dirname( this.filePath ), {
          recursive: true,
        }
      );
    } catch {      /* ignore */}
  }

  public async logFailure(
    contextId: string | number,
    subItem: unknown,
    error: string,
    phase: 'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM',
  ) {
    const logEntry = {
      timestamp: new Date()
        .toISOString(),
      phase,
      parentId: contextId,
      error,
      data    : subItem,
    };

    try {
      await fs.appendFile(
        this.filePath, JSON.stringify( logEntry ) + ',\n'
      );
    } catch ( e ) {
      console.error(
        'Failed to write to log file', e
      );
      console.log(
        'Failed to write to log file', e
      );
    }
  }

  public async logNewItems(
    newItems: FetchResponseActuacion[],
    parentProc: ProcessRequest,
  ) {
    const filePath = path.join(
      process.cwd(), 'logs', NEW_ITEMS_LOG_FILE
    );
    const itemsToSave = newItems.map( ( item ) => {
      return {
        ...item,
        _meta: {
          detectedAt: new Date()
            .toISOString(),
          carpetaNumero: parentProc.carpetaNumero,
          processId    : parentProc.idProceso,
        },
      };
    } );

    try {
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          filePath, 'utf-8'
        );
        currentData = JSON.parse( fileContent );

        if ( !Array.isArray( currentData ) ) {
          currentData = [];
        }
      } catch {
        currentData = [];
      }

      currentData.push( ...itemsToSave );
      await fs.writeFile(
        filePath,
        JSON.stringify(
          currentData, null, 2
        ),
        'utf-8',
      );
    } catch ( error ) {
      console.error(
        '❌ Failed to save new items to JSON file:', error
      );
      console.log(
        '❌ Failed to save new items to JSON file:', error
      );
    }
  }
}

// ==========================================
// 6. BUSINESS LOGIC (Database & Sync)
// ==========================================

class ActuacionService {
  // Priority: Event Date > Registration Date > ID Stability
  private static getLatestByDate( actuaciones: FetchResponseActuacion[], ): FetchResponseActuacion | null {
    if ( !actuaciones || actuaciones.length === 0 ) {
      return null;
    }

    return actuaciones.reduce( (
      prev, current
    ) => {
      const prevDate = ensureDate( prev.fechaActuacion )
        ?.getTime() || 0;
      const currDate = ensureDate( current.fechaActuacion )
        ?.getTime() || 0;

      if ( currDate > prevDate ) {
        return current;
      }

      if ( currDate === prevDate ) {
        const prevReg = ensureDate( prev.fechaRegistro )
          ?.getTime() || 0;
        const currReg = ensureDate( current.fechaRegistro )
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
    } );
  }

  private static mapToPrismaInput(
    apiData: FetchResponseActuacion,
    parentProc: ProcessRequest,
    actualLatestItem: FetchResponseActuacion | null,
  ): Prisma.ActuacionCreateInput {
    const isUltima = actualLatestItem
      ? String( apiData.idRegActuacion ) === String( actualLatestItem.idRegActuacion )
      : false;

    return {
      idRegActuacion: String( apiData.idRegActuacion ),
      consActuacion : apiData.consActuacion,
      actuacion     : apiData.actuacion,
      anotacion     : apiData.anotacion,
      cant          : apiData.cant,
      carpetaNumero : parentProc.carpetaNumero,
      codRegla      : apiData.codRegla,
      conDocumentos : apiData.conDocumentos,
      createdAt     : new Date(),
      llaveProceso  : parentProc.llaveProceso,
      fechaActuacion: ensureDate( apiData.fechaActuacion ) ?? new Date(),
      fechaRegistro : ensureDate( apiData.fechaRegistro ) ?? new Date(),
      fechaInicial  : ensureDate( apiData.fechaInicial ),
      fechaFinal    : ensureDate( apiData.fechaFinal ),
      idProceso     : parentProc.idProceso,
      isUltimaAct   : isUltima,
      proceso       : {
        connect: {
          idProceso: parentProc.idProceso,
        },
      },
    };
  }

  private static async processNotifications(
    newItems: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger,
  ) {
    if ( newItems.length === 0 ) {
      return;
    }

    console.log( `✨ Found ${ newItems.length } NEW Actuaciones. Processing notifications...` );
    await logger.logNewItems(
      newItems, parentProc
    );

    for ( const [
      index,
      act
    ] of newItems.entries() ) {

      // 🛑 SLOW DOWN!
      // If we have multiple updates, wait 2 seconds between sending messages.
      if ( index > 0 ) {
        await wait( 2000 );
      }

      // 1. Webhook (Optional)
      if ( WEBHOOK_URL ) {
        console.log( `🗯️ Iniciando el webhook para enviar las notificaciones: ${ WEBHOOK_URL }`  );

        try {
          const response = await fetch(
            WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify( {

                title: `${ parentProc.carpetaNumero } ${ parentProc.nombre }`,
                body : `${ act.actuacion } ${ act.anotacion }`,
                icon : '/icons/notification_icon.png',
                data : {
                  numero   : parentProc.carpetaNumero,
                  idProceso: parentProc.idProceso,
                  url      : `/Carpeta/${ parentProc.carpetaNumero }/ultimasActuaciones/${ parentProc.idProceso }`,
                },
                actions: [
                  {
                    action: 'openCarpeta',
                    title : 'Abrir Carpeta'
                  },
                  {
                    action: 'openActuaciones',
                    title : 'Abrir Actuaciones'
                  }
                ]

              } ),
            }
          );

          if ( !response.ok ) {
            throw new ApiError(
              `Status ${ response.status }`, 'ActuacionService.processNotifications Webhook'
            );
          }
        } catch ( postError: any ) {
          console.error( `⚠️ Webhook Failed: ${ postError.message }` );
          console.log( `⚠️ Webhook Failed: ${ postError.message }` );
          await logger.logFailure(
            parentProc.idProceso, act, postError.message, 'WEBHOOK'
          );
        }
      }


      // 2. Telegram
      try {
        await TelegramService.sendNotification(
          act, parentProc
        );
      } catch ( teleError: any ) {
        console.error( `⚠️ Telegram Failed: ${ teleError.message }` );
        console.log( `⚠️ Telegram Failed: ${ teleError.message }` );
        await logger.logFailure(
          parentProc.idProceso, act, teleError.message, 'TELEGRAM'
        );
      }

      if ( NEW_ACTUACION_WEBHOOK_URL ) {
        try {
          const body = JSON.stringify( {

            ...act,
            ...parentProc

          } );

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
              `Status ${ response.status }: Message: ${ response.statusText }`, 'ActuacionService.processNotifications Webhook'
            );
          }
        } catch ( postError: any ) {
          console.error( `⚠️ Webhook Failed: ${ postError.message }` );
          console.log( `⚠️ Webhook Failed: ${ postError.message }` );
          await logger.logFailure(
            parentProc.idProceso, act, postError.message, 'WEBHOOK'
          );
        }
      }
    }
  }
  static async syncBatch(
    apiActuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger,
  ) {
    const latestItemByDate = this.getLatestByDate( apiActuaciones );

    // 1. Identify New vs Existing
    const existingRecords = await client.actuacion.findMany( {
      where: {
        idProceso: parentProc.idProceso,
      },
      select: {
        idRegActuacion: true,
      },
    } );
    const existingIds = new Set( existingRecords.map( ( r ) => {
      return r.idRegActuacion;
    } ), );

    const newItems = apiActuaciones.filter( ( item ) => {
      return !existingIds.has( String( item.idRegActuacion ) );
    } );
    const existingItems = apiActuaciones.filter( ( item ) => {
      return existingIds.has( String( item.idRegActuacion ) );
    } );

    // 2. Insert New
    if ( newItems.length > 0 ) {
      const createData = newItems.map( ( item ) => {
        return this.mapToPrismaInput(
          item, parentProc, latestItemByDate
        );
      } );

      for ( const actuacionNueva of createData ) {
        console.log( `Processing new actuacion: ${ actuacionNueva.idRegActuacion }`, );

        try {
          await client.actuacion.upsert( {
            where: {
              idRegActuacion: actuacionNueva.idRegActuacion,
            },
            create: actuacionNueva,
            update: {
              cant         : actuacionNueva.cant,
              consActuacion: actuacionNueva.consActuacion,
            },
          } );
          console.log( `   ✅ Inserted ${ actuacionNueva.idRegActuacion } new records.`, );
        } catch ( error: any ) {
          console.error( `   ❌ Bulk Insert Failed: ${ error.message }` );
          console.log( `   ❌ Bulk Insert Failed: ${ error.message }` );
          await logger.logFailure(
            parentProc.idProceso,
            newItems,
            error.message,
            'DB_ITEM',
          );
        }
      }

      console.log( `   ✅ Inserted ${ newItems.length } new records.` );
      /* try {
        await client.actuacion.createMany( {
          data          : createData,
          skipDuplicates: true
        } );
        console.log( `   ✅ Inserted ${ newItems.length } new records.` );
      } catch ( err: any ) {
        console.error( `   ❌ Bulk Insert Failed: ${ err.message }` );
        await logger.logFailure(
          parentProc.idProceso, newItems, err.message, 'DB_ITEM'
        );
      } */

      await this.processNotifications(
        newItems, parentProc, logger
      );
    }

    // 3. Update Existing
    if ( existingItems.length > 0 ) {
      await pMap(
        existingItems,
        async ( item ) => {
          const isUltima = latestItemByDate
            ? String( item.idRegActuacion )
              === String( latestItemByDate.idRegActuacion )
            : item.cant === item.consActuacion;

          try {
            await client.actuacion.update( {
              where: {
                idRegActuacion: String( item.idRegActuacion ),
              },
              data: {
                fechaActuacion: ensureDate( item.fechaActuacion ) ?? undefined,
                fechaRegistro : ensureDate( item.fechaRegistro ) ?? undefined,
                fechaInicial  : ensureDate( item.fechaInicial ),
                fechaFinal    : ensureDate( item.fechaFinal ),
                isUltimaAct   : isUltima,
                consActuacion : item.consActuacion,
                cant          : item.cant,
              },
            } );
          } catch ( err: any ) {

            console.error( `   ❌ Bulk existing items change Failed: ${ err.message }` );
            console.log( `   ❌ Bulk existing items change Failed: ${ err.message }` );
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

    // 4. Update Carpeta Metadata
    await this.updateCarpetaIfNewer(
      apiActuaciones, parentProc
    );
  }

  static async updateCarpetaIfNewer(
    actuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest,
  ) {
    const incomingLast = this.getLatestByDate( actuaciones );

    if ( !incomingLast ) {
      return;
    }

    try {
      const carpeta = await client.carpeta.findUnique( {
        where: {
          numero: parentProc.carpetaNumero,
        },
        select: {
          idRegUltimaAct: true,
          fecha         : true,
        },
      } );

      if ( !carpeta ) {
        return;
      }

      const incomingDate
        = ensureDate( incomingLast.fechaActuacion )
          ?.getTime() || 0 ;
      const savedDate = ensureDate( carpeta.fecha )
        ?.getTime() ;

      if ( !savedDate || incomingDate > savedDate  ) {
        console.log( `🔄 Updating Carpeta ${ parentProc.carpetaNumero } date.` );

        // Reset old ultima flag
        try {
          if (
            carpeta.idRegUltimaAct
          && carpeta.idRegUltimaAct !== String( incomingLast.idRegActuacion )
          ) {
            await client.actuacion.updateMany( {
              where: {
                idRegActuacion: carpeta.idRegUltimaAct,
              },
              data: {
                isUltimaAct: false,
              },
            } );
          }

        } catch ( error ) {
          console.log( `🚫error tratando de actualizar la previa ultima actuacion: ${ JSON.stringify( error ) }` );
        }

        // 1. Create or Update the Actuacion FIRST
        const savedActuacion = await client.actuacion.upsert( {
          where: {
            idRegActuacion: `${ incomingLast.idRegActuacion }`
          },
          create: {
            ...incomingLast,
            idProceso     : parentProc.idProceso,
            isUltimaAct   : true,
            idRegActuacion: `${ incomingLast.idRegActuacion }`,
            fechaActuacion: ensureDate( incomingLast.fechaActuacion ) ?? new Date(),
            fechaRegistro : ensureDate( incomingLast.fechaRegistro ) ?? new Date(),
            fechaInicial  : ensureDate( incomingLast.fechaInicial ) ?? undefined,
            fechaFinal    : ensureDate( incomingLast.fechaFinal ) ?? undefined,
            proceso       : {
              connect: {
                idProceso: parentProc.idProceso
              }
            }
          },
          update: {},
        } );

        // 2. THEN update the Carpeta to connect to it

        await client.carpeta.update( {
          where: {
            numero: parentProc.carpetaNumero,
          },
          data: {
            fecha          : ensureDate( savedActuacion.fechaActuacion ),
            revisado       : false,
            updatedAt      : new Date(),
            ultimaActuacion: {
              connect: {
                idRegActuacion: String( savedActuacion.idRegActuacion ),
              },
            },
          },
        } );
      }
    } catch ( error ) {
      console.error(
        `❌ Error updating carpeta ${ parentProc.carpetaNumero }:`,
        error,
      );
      console.log(
        `❌ Error updating carpeta ${ parentProc.carpetaNumero }:`,
        error,
      );
    }
  }
}
// ==========================================
// 7. EXTERNAL API CLIENT (UPDATED)
// ==========================================

export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  // Increased delay to be safer
  private readonly RATE_LIMIT_DELAY_MS = 12000;

  constructor( baseUrl: string ) {
    this.baseUrl = baseUrl;
    this.logger = new FileLogger( 'failed_sync_ops.json' );
  }

  // Helper for Headers
  private getHeaders() {
    return {
      'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,es-CO;q=0.8,es-US;q=0.7,es;q=0.6',
      'Sec-Fetch-Dest' : 'document',
      'Sec-Fetch-Mode' : 'navigate',
      'Sec-Fetch-Site' : 'none',
      // These are crucial for Rama Judicial:
      //'Origin'         : 'https://consultaprocesos.ramajudicial.gov.co',
      //'Host'           : 'consultaprocesos.ramajudicial.gov.co',
    };
  }

  private async fetchWithRetry<T>( endpoint: string ): Promise<T> {
    // ✅ PASS HEADERS HERE
    const options = {
      headers: this.getHeaders()
    };
    const response = await fetchWithSmartRetry(
      `${ this.baseUrl }${ endpoint }`, options
    );

    if ( !response.ok ) {
      throw new ApiError(
        `HTTP ${ response.status } ${ response.statusText }`, '🚫 failed request: fetchWithRetry:', response.status
      );
    }

    return ( await response.json() ) as T;
  }

  public async processBatch(
    items: ProcessRequest[],
    pathBuilder: ( item: ProcessRequest ) => string,
  ): Promise<void> {
    console.log( `🚀 Starting process for ${ items.length } targets...` );

    for ( const [
      index,
      parentItem
    ] of items.entries() ) {
      // Add dynamic delay (3.5s to 4.5s) to look more human
      if ( index > 0 ) {
        const variableDelay = this.RATE_LIMIT_DELAY_MS + Math.floor( Math.random() * 1000 );
        await wait( variableDelay );
      }

      try {
        const endpoint = pathBuilder( parentItem );
        console.log( `🌐 [${ index + 1 }/${ items.length }] Fetching: ${ parentItem.carpetaNumero }` );

        const apiResponse = await this.fetchWithRetry<ConsultaActuacionResponse>( endpoint );
        const actuacionesList = apiResponse.actuaciones || [];

        if ( actuacionesList.length > 0 ) {
          await ActuacionService.syncBatch(
            actuacionesList,
            parentItem,
            this.logger,
          );
        }
      } catch ( err: any ) {
        console.error( `❌ FAILED ${ parentItem.carpetaNumero }: ${ err.message }` );
        await this.logger.logFailure(
          parentItem.idProceso,
          parentItem,
          err.message,
          'FETCH',
        );
      }
    }
  }
}
// ==========================================
// 8. MAIN EXECUTION ENTRY POINT
// ==========================================

async function getProcesosToUpdate(): Promise<ProcessRequest[]> {
  const carpetas = await client.carpeta.findMany();

  return carpetas
    .flatMap( ( carpeta ) => {
      if ( !carpeta.idProcesos || carpeta.idProcesos.length === 0 ) {
        return {
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
          idProceso    : 0,
          nombre       : carpeta.nombre,
        };
      }

      return carpeta.idProcesos.map( ( idProceso ) => {
        return {
          idProceso,
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
          nombre       : carpeta.nombre,
        };
      } );
    } )
    .sort( (
      a, b
    ) => {
      return b.carpetaNumero - a.carpetaNumero;
    } );
}

async function runSync() {
  // 1. RECORD START TIME
  const startTime = new Date();
  console.log( `\n⏱️  Execution Started at: ${ startTime.toISOString() }` );
  const api = new RobustApiClient( RAMA_JUDICIAL_BASE_URL );

  try {
    const processesToCheck = await getProcesosToUpdate();

    // The processor now handles strict sequential fetching + rate limiting
    await api.processBatch(
      processesToCheck, ( proc ) => {
        return `/api/v2/Proceso/Actuaciones/${ proc.idProceso }`;
      }
    );

    console.log( '🎉 Sync Complete' );
  } catch ( error ) {
    console.error(
      'Fatal Error in runSync:', error
    );
    console.log(
      'Fatal Error in runSync:', error
    );
  } finally {
    await client.$disconnect();
    // 2. RECORD END TIME
    const endTime = new Date();
    // 3. CALCULATE DURATION
    const durationMs = endTime.getTime() - startTime.getTime();
    // Convert to readable format (Hours, Minutes, Seconds)
    const seconds = Math.floor( ( durationMs / 1000 ) % 60 );
    const minutes = Math.floor( ( durationMs / ( 1000 * 60 ) ) % 60 );
    const hours = Math.floor( durationMs / ( 1000 * 60 * 60 ) );
    const durationString = `${ hours }h ${ minutes }m ${ seconds }s`;
    // 4. LOG TOTALS
    console.log( `\n🏁 Execution Finished at: ${ endTime.toISOString() }` );
    console.log( `⏱️  Total Duration: ${ durationString } (${ durationMs }ms)` );
  }
}

runSync();
