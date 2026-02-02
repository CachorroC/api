/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

// ==========================================
// 1. IMPORTS & SETUP
// ==========================================
import 'dotenv/config'; // Must be first to load .env
import path from 'path';
import * as fs from 'fs/promises';
import { client } from './prisma.js';
import { Prisma } from '../prisma/generated/prisma/client.js';

// ==========================================
// 2. CONFIGURATION & CONSTANTS
// ==========================================
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const NEW_ITEMS_LOG_FILE = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
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
  nombre       : string
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
    public message: string, public statusCode?: number
  ) {
    super( message );
    this.name = 'ApiError';
    console.log( `ApiError: ${ message }` );
  }
}

// ==========================================
// 4. GENERIC UTILITIES
// ==========================================

const wait = ( ms: number ) => {
  return new Promise( ( resolve ) => {
    return setTimeout(
      resolve, ms
    );
  } );
};

function ensureDate( dateInput: string | Date | null | undefined ): Date | null {
  if ( !dateInput ) {
    return null;
  }

  const d = new Date( dateInput );

  return isNaN( d.getTime() )
    ? null
    : d;
}

// Optimization: Run promises with limited concurrency (Used for DB updates)
async function pMap<T, R>(
  array: T[],
  mapper: ( item: T ) => Promise<R>,
  concurrency: number
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

// Wrapper for fetch with retries
export async function fetchWithSmartRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  retryDelay = 2000
): Promise<Response> {
  let attempt = 0;

  while ( attempt < maxRetries ) {
    try {
      const response = await fetch(
        url, options
      );

      if ( [
        429,
        500,
        502,
        503,
        504
      ].includes( response.status ) ) {
        throw new Error( `Server Status ${ response.status }` );
      }

      return response;
    } catch ( error: any ) {
      attempt++;

      if ( attempt >= maxRetries ) {
        throw error;
      }

      await wait( retryDelay * attempt );
    }
  }

  throw new Error( 'fetchWithSmartRetry failed' );
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
          recursive: true
        }
      );
    } catch { /* ignore */ }
  }

  public async logFailure(
    contextId: string | number,
    subItem: unknown,
    error: string,
    phase: 'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM'
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
    newItems: FetchResponseActuacion[], parentProc: ProcessRequest
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
        filePath, JSON.stringify(
          currentData, null, 2
        ), 'utf-8'
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

class TelegramService {
  private static cleanText( text: string | null | undefined ): string {
    if ( !text ) {
      return '';
    }

    const escaped = text.toString()
      .replace(
        /&/g, '&amp;'
      )
      .replace(
        /</g, '&lt;'
      )
      .replace(
        />/g, '&gt;'
      )
      .replace(
        /"/g, '&quot;'
      )
      .replace(
        /'/g, '&#039;'
      );

    return escaped.length > 3000
      ? escaped.substring(
        0, 3000
      ) + '... (cortado)'
      : escaped;
  }

  static async sendNotification(
    actuacion: FetchResponseActuacion, processInfo: ProcessRequest
  ) {
    if ( !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID ) {
      return;
    }

    const cleanActuacion = this.cleanText( actuacion.actuacion );
    const cleanAnotacion = this.cleanText( actuacion.anotacion );
    const cleanLlave = this.cleanText( processInfo.llaveProceso );

    const message = `
🚨 <b>NUEVA ACTUACIÓN DETECTADA</b> 🚨

👤 <b>Nombre:</b> ${ processInfo.nombre }
📂 <b>Expediente:</b> ${ cleanLlave }
📁 <b>Carpeta:</b> ${ processInfo.carpetaNumero }

📅 <b>Fecha:</b> ${ new Date( actuacion.fechaActuacion )
  .toLocaleDateString() }
📝 <b>Actuación:</b> ${ cleanActuacion }
${ cleanAnotacion
  ? `ℹ️ <b>Anotación:</b> ${ cleanAnotacion }`
  : '' }

🔗 <a href="https://app.rsasesorjuridico.com/Carpeta/${ processInfo.carpetaNumero }">Ver en app</a>`;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`, {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( {
            chat_id                 : TELEGRAM_CHAT_ID,
            text                    : message,
            parse_mode              : 'HTML',
            disable_web_page_preview: true,
          } ),
        }
      );

      if ( !response.ok ) {
        const errorData = ( await response.json() ) as any;

        throw new ApiError( `${ response.statusText } - ${ errorData.description }` );
      }
    } catch ( err ) {
      console.warn( '⚠️ Standard HTML message failed, attempting fallback...' );
      console.log( '⚠️ Standard HTML message failed, attempting fallback...' );
      await this.sendFallbackMessage(
        actuacion, processInfo
      );
    }
  }

  private static async sendFallbackMessage(
    actuacion: FetchResponseActuacion, processInfo: ProcessRequest
  ) {
    const message = `
🚨 NUEVA ACTUACIÓN 🚨

Nombre: ${ processInfo.nombre }
Expediente: ${ processInfo.llaveProceso }
Carpeta: ${ processInfo.carpetaNumero }
Fecha: ${ new Date( actuacion.fechaActuacion )
  .toLocaleDateString() }
Actuación: ${ actuacion.actuacion }
Anotación: ${ actuacion.anotacion || 'N/A' }
Ver en app: https://app.rsasesorjuridico.com/Carpeta/${ processInfo.carpetaNumero }`;

    await fetch(
      `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`, {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          chat_id: TELEGRAM_CHAT_ID,
          text   : message
        } ),
      }
    );
  }
}

// ==========================================
// 6. BUSINESS LOGIC (Database & Sync)
// ==========================================

class ActuacionService {
  // Priority: Event Date > Registration Date > ID Stability
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
          return String( current.consActuacion ) > String( prev.consActuacion )
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
    actualLatestItem: FetchResponseActuacion | null
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
          idProceso: parentProc.idProceso
        }
      }
    };
  }

  private static async processNotifications(
    newItems: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger
  ) {
    if ( newItems.length === 0 ) {
      return;
    }

    console.log( `✨ Found ${ newItems.length } NEW Actuaciones. Processing notifications...` );
    await logger.logNewItems(
      newItems, parentProc
    );

    for ( const act of newItems ) {
      // 1. Webhook
      if ( WEBHOOK_URL ) {
        try {
          const response = await fetch(
            WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify( {
                ...act,
                carpetaNumero: parentProc.carpetaNumero,
                llaveProceso : parentProc.llaveProceso,
              } ),
            }
          );

          if ( !response.ok ) {
            throw new ApiError( `Status ${ response.status }` );
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
        await wait( 300 );
      } catch ( teleError: any ) {
        console.error( `⚠️ Telegram Failed: ${ teleError.message }` );
        console.log( `⚠️ Telegram Failed: ${ teleError.message }` );
        await logger.logFailure(
          parentProc.idProceso, act, teleError.message, 'TELEGRAM'
        );
      }
    }
  }

  static async syncBatch(
    apiActuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger
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
            update: actuacionNueva,
          } );
          console.log( `   ✅ Inserted ${ actuacionNueva.idRegActuacion } new records.` );
        } catch ( error: any ) {
          console.error( `   ❌ Bulk Insert Failed: ${ error.message }` );
          console.log( `   ❌ Bulk Insert Failed: ${ error.message }` );
          await logger.logFailure(
            parentProc.idProceso, newItems, error.message, 'DB_ITEM'
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
        existingItems, async ( item ) => {
          const isUltima = latestItemByDate
            ? String( item.idRegActuacion ) === String( latestItemByDate.idRegActuacion )
            : item.cant === item.consActuacion;

          try {
            await client.actuacion.update( {
              where: {
                idRegActuacion: String( item.idRegActuacion )
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
          } catch ( err ) { /* silent fail */ }
        }, 10
      );
    }

    // 4. Update Carpeta Metadata
    await this.updateCarpetaIfNewer(
      apiActuaciones, parentProc
    );
  }

  static async updateCarpetaIfNewer(
    actuaciones: FetchResponseActuacion[], parentProc: ProcessRequest
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
        ?.getTime() || 0;
      const savedDate = ensureDate( carpeta.fecha )
        ?.getTime() || 0;

      if ( incomingDate > savedDate ) {
        console.log( `🔄 Updating Carpeta ${ parentProc.carpetaNumero } date.` );

        // Reset old ultima flag
        if ( carpeta.idRegUltimaAct && carpeta.idRegUltimaAct !== String( incomingLast.idRegActuacion ) ) {
          await client.actuacion.updateMany( {
            where: {
              idRegActuacion: carpeta.idRegUltimaAct
            },
            data: {
              isUltimaAct: false
            },
          } );
        }

        await client.carpeta.update( {
          where: {
            numero: parentProc.carpetaNumero
          },
          data: {
            fecha          : ensureDate( incomingLast.fechaActuacion ),
            revisado       : false,
            updatedAt      : new Date(),
            ultimaActuacion: {
              connect: {
                idRegActuacion: String( incomingLast.idRegActuacion )
              }
            },
          },
        } );
      }
    } catch ( error ) {
      console.error(
        `❌ Error updating carpeta ${ parentProc.carpetaNumero }:`, error
      );
      console.log(
        `❌ Error updating carpeta ${ parentProc.carpetaNumero }:`, error
      );
    }
  }
}

// ==========================================
// 7. EXTERNAL API CLIENT
// ==========================================

export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  private readonly RATE_LIMIT_DELAY_MS = 2000;

  constructor( baseUrl: string ) {
    this.baseUrl = baseUrl;
    this.logger = new FileLogger( 'failed_sync_ops.json' );
  }

  private async fetchWithRetry<T> ( endpoint: string ): Promise<T> {
    const response = await fetchWithSmartRetry( `${ this.baseUrl }${ endpoint }` );

    if ( !response.ok ) {
      throw new ApiError(
        `HTTP ${ response.status } ${ response.statusText }`, response.status
      );
    }

    return ( await response.json() ) as T;
  }
  public async processBatch(
    items: ProcessRequest[], pathBuilder: ( item: ProcessRequest ) => string
  ): Promise<void> {
    console.log( `🚀 Starting process for ${ items.length } targets...` );

    for ( const [
      index,
      parentItem
    ] of items.entries() ) {
      if ( index > 0 ) {
        await wait( this.RATE_LIMIT_DELAY_MS );
      }

      try {
        const endpoint = pathBuilder( parentItem );
        console.log( `🌐 [${ index + 1 }/${ items.length }] Fetching: ${ parentItem.carpetaNumero } ${ parentItem.idProceso }` );

        // This call handles the rate limit wait internally
        const apiResponse = await this.fetchWithRetry<ConsultaActuacionResponse>( endpoint );
        const actuacionesList = apiResponse.actuaciones || [];

        if ( actuacionesList.length > 0 ) {
          await ActuacionService.syncBatch(
            actuacionesList, parentItem, this.logger
          );
        }
      } catch ( err: any ) {
        console.error( `❌ ${ parentItem.carpetaNumero }FETCH FAILED ID ${ parentItem.idProceso }: ${ err.message }` );
        console.log( `❌ ${ parentItem.carpetaNumero }FETCH FAILED ID ${ parentItem.idProceso }: ${ err.message }` );
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
  const carpetas = await client.carpeta.findMany();

  return carpetas
    .flatMap( ( carpeta ) => {
      if ( !carpeta.idProcesos || carpeta.idProcesos.length === 0 ) {
        return {
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
          idProceso    : 0,
          nombre       : carpeta.nombre
        };
      }

      return carpeta.idProcesos.map( ( idProceso ) => {
        return {
          idProceso,
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
          nombre       : carpeta.nombre
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
    const hours = Math.floor( ( durationMs / ( 1000 * 60 * 60 ) ) );
    const durationString = `${ hours }h ${ minutes }m ${ seconds }s`;
    // 4. LOG TOTALS
    console.log( `\n🏁 Execution Finished at: ${ endTime.toISOString() }` );
    console.log( `⏱️  Total Duration: ${ durationString } (${ durationMs }ms)` );
  }
}

runSync();