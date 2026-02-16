
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

const NEW_ITEMS_LOG_FILE = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';
const RAMA_JUDICIAL_BASE_URL = process.env.RAMA_JUDICIAL_BASE_URL || 'https://consultaprocesos.ramajudicial.gov.co:448';

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
  category?    : string | null;
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

/**
 * 🧼 SANITIZATION UTILITY
 * Cleans strings to prevent Postgres encoding errors.
 * explicitly handles Rama Judicial's Latin-1 (ISO-8859-1) encoding issues.
 *//*
function fixEncoding( text: string | null | undefined ): string | null {
  if ( !text ) {
    return null;
  }

  // 1. Remove Null Bytes and common binary garbage
  let cleaned = text.replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''
  );

  // 2. Transcode Latin-1 to UTF-8
  // The error "0xf3 0x6e" implies Latin-1 bytes are present.
  // We convert the string to a binary buffer (preserving 0xF3),
  // then decode it as ISO-8859-1 to get the correct UTF-8 string.
  try {
    // Check if the string actually contains high-bit characters likely to be Latin-1
    if ( /[\xC0-\xFF]/.test( cleaned ) ) {
      const buffer = Buffer.from(
        cleaned, 'binary'
      );
      const decoder = new TextDecoder( 'iso-8859-1' );
      cleaned = decoder.decode( buffer );
    }
  } catch ( e ) {
    console.error(
      '⚠️ Encoding correction failed, falling back to ASCII cleaning:', e
    );
    // Fallback: If transcoding fails, strip non-ASCII characters to prevent crash
    // (This ensures the DB insert works, even if we lose an accent mark)
    cleaned = cleaned.replace(
      /[^\x20-\x7E]/g, ''
    );
  }

  return cleaned.normalize( 'NFC' )
    .trim();
}
 */
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
        const waitTime = retryAfterHeader
          ? ( parseInt(
              retryAfterHeader, 10
            ) * 1000 ) + 1000
          : baseDelay * Math.pow(
            2, attempt
          );

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

      // Check for server errors
      if ( [
        500,
        502,
        503,
        504
      ].includes( response.status ) ) {
        throw new ApiError(
          `Server Status ${ response.status }`,
          `🚫 failed request: fetchWithSmartRetry: ${ url } statusCode<500`
        );
      }

      return response;

    } catch ( error: any ) {
      if ( attempt >= totalAttempts ) {
        throw error;
      }

      const delay = ( baseDelay * attempt );
      console.log( `⚠️ [Retry] Attempt ${ attempt }/${ totalAttempts } failed for ${ url }. Retrying in ${ delay }ms...` );
      await wait( delay );
      attempt++;
    }
  }

  throw new ApiError(
    'fetchWithSmartRetry failed unexpectedly',
    `🚫 failed request: fetchWithSmartRetry: ${ url }`
  );
}

// ==========================================
// 5. INFRASTRUCTURE SERVICES (Logging & Alerts)
// ==========================================

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
          recursive: true
        }
      );
    } catch { /* ignore */ }
  }

  public async logFailure(
    contextId: string | number,
    subItem: any,
    error: string,
    phase: 'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM',
  ) {
    // 1. Extract Carpeta Number carefully
    // We check subItem directly, then subItem.data (common in your JSON logs), then subItem.proceso
    const carpetaNumero
      = subItem?.carpetaNumero
      || subItem?.data?.carpetaNumero // specifically for your 'data' object structure
      || subItem?.proceso?.carpetaNumero
      || null;
    const logTime = new Date;
    const formatedLogTime = new Intl.DateTimeFormat(
      'es-CO',  {
        weekday     : 'long',
        year        : 'numeric',
        month       : 'long',
        day         : 'numeric',
        hour        : 'numeric',
        minute      : 'numeric',
        second      : 'numeric',
        timeZoneName: 'short'
      }
    )
      .format( logTime );
    const logEntry = {
      timestamp        : logTime.toISOString(),
      formatedTimeStamp: formatedLogTime,
      phase,
      parentId         : contextId,
      error,
      data             : subItem,
      carpetaNumero    : carpetaNumero // Store at top level for easier lookup next time
    };

    try {
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          this.filePath, 'utf-8'
        );
        currentData = JSON.parse( fileContent );

        if ( !Array.isArray( currentData ) ) {
          currentData = [];
        }
      } catch {
        currentData = [];
      }

      // --- LOGIC CHANGE START ---
      const existingIndex = currentData.findIndex( ( item ) => {
        const incomingId = String( contextId );
        const itemId = String( item.parentId );

        // 1. If we have a REAL Process ID (not 0), match strictly on ID
        if ( incomingId !== '0' && itemId === incomingId ) {
          return true;
        }

        // 2. If Process ID is 0 (or missing), we MUST match on Carpeta Numero
        // Try to find carpeta number in the existing item (either top level or inside data)
        const itemCarpeta = item.carpetaNumero || item.data?.carpetaNumero;

        // Only match if both have a valid number
        if ( carpetaNumero && itemCarpeta && String( itemCarpeta ) === String( carpetaNumero ) ) {
          return true;
        }

        return false;
      } );

      if ( existingIndex !== -1 ) {
        // Update the existing log entry with the new timestamp/error
        currentData[ existingIndex ] = logEntry;
      } else {
        // No matching log found, create a new one
        currentData.push( logEntry );
      }
      // --- LOGIC CHANGE END ---

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

  public async logNewItems(
    newItems: FetchResponseActuacion[],
    parentProc: ProcessRequest,
  ) {
    const filePath = path.join(
      process.cwd(), 'logs', NEW_ITEMS_LOG_FILE
    );

    // Flatten the object so carpetaNumero is easily accessible
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

      // Upsert logic for New Items
      for ( const newItem of itemsToSave ) {
        const existingIndex = currentData.findIndex( ( existing ) => {
          return existing._meta && existing._meta.carpetaNumero === newItem._meta.carpetaNumero;
        } );

        if ( existingIndex !== -1 ) {
          // Replace with newer info
          currentData[ existingIndex ] = newItem;
        } else {
          // Add new
          currentData.push( newItem );
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

class ActuacionService {
  private static getLatestByDate( actuaciones: FetchResponseActuacion[] ): FetchResponseActuacion | null {
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
    /* let cleanActuacion, cleanAnotacion;

    const isFailedTarget = apiData.idRegActuacion === 2665047680 || apiData.idRegActuacion === 1176372381 || apiData.idRegActuacion === 2650029770 || apiData.idRegActuacion === 2649586500 || apiData.idRegActuacion === 2661117570 || apiData.idRegActuacion === 2651329310;

    if ( isFailedTarget ) {
      cleanActuacion = fixEncoding( apiData.actuacion ) || 'Sin descripción';
      cleanAnotacion = fixEncoding( apiData.anotacion ) || '';
    } else {
      cleanActuacion = String( apiData.actuacion ) || 'Sin descripción';
      cleanAnotacion = String( apiData.anotacion );
    } */

    const cleanActuacion = String( apiData.actuacion ) || 'Sin descripción';
    const cleanAnotacion = String( apiData.anotacion );

    // ✅ APPLY CLEANING HERE


    return {
      idRegActuacion: String( apiData.idRegActuacion ),
      consActuacion : apiData.consActuacion,
      actuacion     : cleanActuacion,
      anotacion     : cleanAnotacion,
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
      if ( index > 0 ) {
        await wait( 2000 );
      }

      // 1. Webhook (Optional)
      if ( WEBHOOK_URL ) {
        console.log( `🗯️ Iniciando el webhook: ${ WEBHOOK_URL }` );

        try {
          const response = await fetch(
            WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify( {
                title: `${ parentProc.carpetaNumero } ${ parentProc.nombre }`,
                body : `${ String( act.actuacion ) } ${ String( act.anotacion ) || '' }`,
                icon : '/icons/notification_icon.png',
                data : {
                  numero   : parentProc.carpetaNumero,
                  idProceso: parentProc.idProceso,
                  url      : `/Carpeta/${ parentProc.carpetaNumero }/ultimasActuaciones/${ parentProc.idProceso }#actuacion-${ act.idRegActuacion }`,
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
              `Status ${ response.status }`, 'ActuacionService.processNotifications Webhook'
            );
          }
        } catch ( postError: any ) {
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
        idProceso: parentProc.idProceso
      },
      select: {
        idRegActuacion: true
      },
    } );
    const existingIds = new Set( existingRecords.map( ( r ) => {
      return r.idRegActuacion;
    } ) );

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
        console.log( `Processing new actuacion: ${ actuacionNueva.idRegActuacion }` );

        try {
          await client.actuacion.upsert( {
            where: {
              idRegActuacion: actuacionNueva.idRegActuacion
            },
            create: actuacionNueva,
            update: {
              cant         : actuacionNueva.cant,
              consActuacion: actuacionNueva.consActuacion,
            },
          } );
          console.log( `   ✅ Inserted ${ actuacionNueva.idRegActuacion } new records.` );
        } catch ( error: any ) {
          console.log( `   ❌ Insert Failed for ${ actuacionNueva.idRegActuacion }: ${ error.message }` );
          // Log specific detail about the offending record
          await logger.logFailure(
            parentProc.idProceso,
            actuacionNueva, // Log the actual object causing the crash
            error.message,
            'DB_ITEM',
          );
        }
      }

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
            ? String( item.idRegActuacion ) === String( latestItemByDate.idRegActuacion )
            : item.cant === item.consActuacion;

          try {
            await client.actuacion.update( {
              where: {
                idRegActuacion: String( item.idRegActuacion )
              },
              data: {
                isUltimaAct: isUltima,
                cant       : item.cant,
              },
            } );
          } catch ( err: any ) {
            console.log( `   ❌ Update Failed: ${ err.message }` );
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
          numero: parentProc.carpetaNumero
        },
        select: {
          idRegUltimaAct: true,
          fecha         : true
        },
      } );

      if ( !carpeta ) {
        return;
      }

      const incomingDate = ensureDate( incomingLast.fechaActuacion )
        ?.getTime() ?? 0;
      const savedDate = ensureDate( carpeta.fecha )
        ?.getTime();

      if ( !savedDate || incomingDate > savedDate ) {
        console.log( `🔄 Updating Carpeta ${ parentProc.carpetaNumero } date.` );

        // Reset old ultima flag
        try {
          if ( carpeta.idRegUltimaAct && carpeta.idRegUltimaAct !== String( incomingLast.idRegActuacion ) ) {
            await client.actuacion.updateMany( {
              where: {
                idRegActuacion: carpeta.idRegUltimaAct
              },
              data: {
                isUltimaAct: false,
              },
            } );
          }
        } catch ( error ) {
          console.log( `🚫 error resetting previous flag: ${ JSON.stringify( error ) }` );

        }

        // 1. Create or Update the Actuacion FIRST with CLEAN data
        const savedActuacion = await client.actuacion.upsert( {
          where: {
            idRegActuacion: `${ incomingLast.idRegActuacion }`
          },
          create: {
            ...incomingLast,
            // Apply cleaning here too
            actuacion     : String( incomingLast.actuacion ) || 'Sin descripción',
            anotacion     : String( incomingLast.anotacion ),
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
          update: {
            cant: incomingLast.cant,
          },
        } );
        console.log( `🔄 Updated the last actuacion:  ${ savedActuacion.fechaActuacion } date.` );
        // 2. THEN update the Carpeta
        const updateCarpeta = await client.carpeta.update( {
          where: {
            numero: parentProc.carpetaNumero
          },
          data: {
            fecha          : ensureDate( savedActuacion.fechaActuacion ),
            revisado       : false,
            updatedAt      : new Date(),
            ultimaActuacion: {
              connect: {
                idRegActuacion: String( savedActuacion.idRegActuacion )
              },
            },
          },
        } );

        if ( updateCarpeta.fecha ) {
          console.log( `🔄 Updated carpeta:  ${ new Intl.DateTimeFormat(
            'es-CO',  {
              weekday     : 'long',
              year        : 'numeric',
              month       : 'long',
              day         : 'numeric',
              hour        : 'numeric',
              minute      : 'numeric',
              second      : 'numeric',
              timeZoneName: 'short'
            }
          )
            .format( updateCarpeta.fecha ) } date.` );
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
// 7. EXTERNAL API CLIENT (UPDATED)
// ==========================================

export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  private readonly RATE_LIMIT_DELAY_MS = 12000;

  constructor( baseUrl: string ) {
    this.baseUrl = baseUrl;
    this.logger = new FileLogger( 'failed_sync_ops.json' );
  }

  private getHeaders() {
    return {
      'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,es-CO;q=0.8,es-US;q=0.7,es;q=0.6',
      'Sec-Fetch-Dest' : 'document',
      'Sec-Fetch-Mode' : 'navigate',
      'Sec-Fetch-Site' : 'none',
    };
  }
  private async fetchWithRetry<T>( endpoint: string ): Promise<T> {
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

    // ✅ FIX: Manually decode the buffer as ISO-8859-1 (Latin-1)
    // This catches the 'ó', 'ú', 'ñ' bytes before JSON.parse mangles them.
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder( 'iso-8859-1' );
    const text = decoder.decode( arrayBuffer );

    try {
      return JSON.parse( text ) as T;
    } catch ( e ) {
      // Fallback in case the response wasn't actually JSON
      console.error(
        'Error parsing JSON after decoding:', e
      );

      throw new ApiError(
        'Invalid JSON response', '🚫 failed request: fetchWithRetry: JSON.parse'
      );
    }
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
            actuacionesList, parentItem, this.logger
          );
        }
      } catch ( err: any ) {
        console.log( `❌ FAILED ${ parentItem.carpetaNumero }: ${ err.message }` );
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

async function getProcesosToUpdate(): Promise<ProcessRequest[]> {
  // Ensure your Prisma schema has 'category' on the Carpeta model
  const carpetas = await client.carpeta.findMany();

  return carpetas
    .flatMap( ( carpeta ) => {
      // Common data structure
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
          idProceso: 0,
        };
      }

      return carpeta.idProcesos.map( ( idProceso ) => {
        return {
          ...baseData,
          idProceso,
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
  const startTime = new Date();
  ;

  const formattedCustomStartTime = new Intl.DateTimeFormat(
    'es-CO',  {
      weekday     : 'long',
      year        : 'numeric',
      month       : 'long',
      day         : 'numeric',
      hour        : 'numeric',
      minute      : 'numeric',
      second      : 'numeric',
      timeZoneName: 'short'
    }
  )
    .format( startTime );
  console.log( formattedCustomStartTime ); // Example output: "Monday, February 16, 2026 at 12:49 PM EST"

  console.log( `\n⏱️  Execution Started at: ${ formattedCustomStartTime }` );

  // --- FREQUENCY LOGIC ---
  const currentHour = startTime.getHours();
  const currentDay = startTime.getDay();
  // --- 1. Define Time Windows ---

  // Catches the 00:00 run (Range: 00:00 - 05:59)
  const isMidnightRun = currentHour < 6;

  // Catches the 12:00 run (Range: 12:00 - 17:59)
  const isNoonRun = currentHour >= 12 && currentHour < 18;

  const api = new RobustApiClient( RAMA_JUDICIAL_BASE_URL );

  try {
    const allProcesses = await getProcesosToUpdate();

    const processesToCheck = allProcesses.filter( ( proc ) => {
      // Normalize the category name
      const category = ( proc.category || 'default' ).toString()
        .toLowerCase()
        .trim();

/*
      // --- 2. Apply Logic ---

      // A. Bancolombia: Runs every 6 hours (00, 06, 12, 18)
      if ( category === 'bancolombia' ) {
        console.log( `category is bancolombia ${ proc.carpetaNumero }` );

        return true;
      }

      // B. Terminados: Runs once a week, ONLY at Midnight on Monday
      if ( category === 'terminados' ) {
        return isMidnightRun && currentDay === 1;
      }

      // C. Reintegra: Runs once a day, ONLY at Noon
      if ( category === 'reintegra' ) {
        return isNoonRun;
      }

      // D. Default / Others: Runs once a day, ONLY at Noon
      return isNoonRun; */
      return true;
    } );

    console.log( `🔎 Filter applied: Processing ${ processesToCheck.length } of ${ allProcesses.length } items.` );

    if ( processesToCheck.length > 0 ) {
      await api.processBatch(
        processesToCheck, ( proc ) => {
          return `/api/v2/Proceso/Actuaciones/${ proc.idProceso }`;
        }
      );
    } else {
      console.log( '😴 No processes scheduled for this run window.' );
    }

    console.log( '🎉 Sync Complete' );
  } catch ( error ) {
    console.log(
      'Fatal Error in runSync:', error
    );
  } finally {
    await client.$disconnect();
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor( ( durationMs / 1000 ) % 60 );
    const minutes = Math.floor( ( durationMs / ( 1000 * 60 ) ) % 60 );
    const hours = Math.floor( durationMs / ( 1000 * 60 * 60 ) );
    const durationString = `${ hours }h ${ minutes }m ${ seconds }s`;

    const formattedCustomEndTime = new Intl.DateTimeFormat(
      'es-CO',  {
        weekday     : 'long',
        year        : 'numeric',
        month       : 'long',
        day         : 'numeric',
        hour        : 'numeric',
        minute      : 'numeric',
        second      : 'numeric',
        timeZoneName: 'short'
      }
    )
      .format( endTime );
    console.log( formattedCustomEndTime );
    console.log( `\n🏁 Execution Finished at: ${ formattedCustomEndTime }` );
    console.log( `⏱️  Total Duration: ${ durationString } (${ durationMs }ms)` );
  }
}

runSync();