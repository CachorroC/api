/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

// 1. ADD THIS: Import dotenv to load variables from .env file
import 'dotenv/config';

import path from 'path';
import * as fs from 'fs/promises';
import { client } from './prisma.js';
import { Prisma } from '../prisma/generated/prisma/client.js';

// ==========================================
// CONFIGURATION
// ==========================================
// Define endpoints and tokens here to keep them centralized.
// WE CHANGED THIS: Now using process.env with safe fallbacks
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const NEW_ITEMS_LOG_FILE = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const RAMA_JUDICIAL_BASE_URL = process.env.RAMA_JUDICIAL_BASE_URL || 'https://consultaprocesos.ramajudicial.gov.co:448';

// ==========================================
// SECTION 1: TYPES & INTERFACES
// ==========================================

// Structure for the internal process object we iterate over
export interface ProcessRequest {
  idProceso    : number;
  carpetaNumero: number;
  llaveProceso : string;
  carpetaId    : number;
}

// Structure of the raw data coming from the External API (Rama Judicial)
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

// Structure of the full API response
export interface ConsultaActuacionResponse {
  actuaciones: FetchResponseActuacion[];
  paginacion: {
    cantidadRegistros: number;
    registrosPagina  : number;
    cantidadPaginas  : number;
    pagina           : number;
  };
}

// Custom error class for better error handling in logs
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
  ) {
    super( message );
    this.name = 'ApiError';
  }
}

// ==========================================
// SECTION 2: UTILITIES
// ==========================================

// Standard wait function to prevent rate limiting issues
const wait = ( ms: number ) => {
  return new Promise( ( resolve ) => {
    return setTimeout(
      resolve, ms
    );
  } );
};

// Helper to sanitize dates. If the API returns invalid strings, this returns null
// to prevent the Database from crashing.
function ensureDate( dateInput: string | Date | null | undefined ): Date | null {
  if ( !dateInput ) {
    return null;
  }

  const d = new Date( dateInput );

  return isNaN( d.getTime() )
    ? null
    : d;
}

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
    } catch {
      /* ignore */
    }
  }

  // Logs failures (e.g. failed webhook, failed DB write)
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
    }
  }
}
// ==========================================
// SECTION 3: NOTIFICATION SERVICES
// ==========================================

class TelegramService {
  /**
   * Cleans text to ensure it doesn't break Telegram's HTML parser.
   * If text contains < or >, telegram might think it's a tag and crash.
   */
  private static cleanText( text: string | null | undefined ): string {
    if ( !text ) {
      return '';
    }

    // 1. Escape special HTML chars
    const escaped = text
      .toString()
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

    // 2. Truncate if too long (Telegram limit is 4096, we keep it safe)
    if ( escaped.length > 3000 ) {
      return escaped.substring(
        0, 3000
      ) + '... (cortado)';
    }

    return escaped;
  }

  static async sendNotification(
    actuacion: FetchResponseActuacion,
    processInfo: ProcessRequest,
  ) {
    // Basic check to ensure we have tokens before trying to send
    if (
      !TELEGRAM_BOT_TOKEN
      || !TELEGRAM_CHAT_ID
      || TELEGRAM_BOT_TOKEN.includes( 'YOUR_BOT' )
    ) {
      console.warn( '⚠️ Telegram Token not configured.' );

      return;
    }

    // Prepare clean variables
    const cleanActuacion = this.cleanText( actuacion.actuacion );
    const cleanAnotacion = this.cleanText( actuacion.anotacion );
    const cleanLlave = this.cleanText( processInfo.llaveProceso );
    const cleanCarpeta = this.cleanText( String( processInfo.carpetaNumero ) );

    // Build the message safely
    const message = `
🚨 <b>NUEVA ACTUACIÓN DETECTADA</b> 🚨

📂 <b>Proceso:</b> ${ cleanLlave }
📁 <b>Carpeta:</b> ${ cleanCarpeta }

📅 <b>Fecha:</b> ${ new Date( actuacion.fechaActuacion )
  .toLocaleDateString() }
📝 <b>Actuación:</b> ${ cleanActuacion }
${ cleanAnotacion
  ? `ℹ️ <b>Anotación:</b> ${ cleanAnotacion }`
  : '' }

🔗 <a href="https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion?NumeroRadicacion=${ processInfo.llaveProceso }">Ver en Rama Judicial</a>
    `;

    try {
      const url = `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`;

      const response = await fetch(
        url, {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        // Log the specific error from Telegram to help debug if it happens again
        const errorData = ( await response.json() ) as any;

        throw new Error( `${ response.statusText } - ${ errorData.description }` );
      }
    } catch ( err ) {
      // If HTML fails (rare edge case), fallback to plain text so you still get the alert
      console.warn( '⚠️ Standard HTML message failed, attempting fallback...' );
      await this.sendFallbackMessage(
        actuacion, processInfo
      );
    }
  }

  /**
   * Fallback method that sends PLAIN TEXT if the fancy HTML version fails
   */
  private static async sendFallbackMessage(
    actuacion: FetchResponseActuacion,
    processInfo: ProcessRequest,
  ) {
    const message = `
🚨 NUEVA ACTUACIÓN (TEXTO PLANO) 🚨

Proceso: ${ processInfo.llaveProceso }
Carpeta: ${ processInfo.carpetaNumero }
Fecha: ${ new Date( actuacion.fechaActuacion )
  .toLocaleDateString() }
Actuación: ${ actuacion.actuacion }
Anotación: ${ actuacion.anotacion || 'N/A' }
    `;

    const url = `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`;
    await fetch(
      url, {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify( {
          chat_id: TELEGRAM_CHAT_ID,
          text   : message,
        // No parse_mode here = Safe plain text
        } ),
      }
    );
  }
}

// ==========================================
// SECTION 4: DATABASE SERVICE
// ==========================================

class ActuacionService {
  static async upsertActuacion(
    apiData: FetchResponseActuacion,
    parentProc: ProcessRequest,
  ) {
    const fechaActuacion = ensureDate( apiData.fechaActuacion ) || new Date();
    const fechaRegistro = ensureDate( apiData.fechaRegistro ) || new Date();
    const fechaInicial = ensureDate( apiData.fechaInicial );
    const fechaFinal = ensureDate( apiData.fechaFinal );

    const isUltima = apiData.cant === apiData.consActuacion;
    const idRegString = String( apiData.idRegActuacion );

    const dataPayload: Prisma.ActuacionCreateInput = {
      idRegActuacion: idRegString,
      consActuacion : apiData.consActuacion,
      actuacion     : apiData.actuacion,
      anotacion     : apiData.anotacion,
      cant          : apiData.cant,
      carpetaNumero : parentProc.carpetaNumero,
      codRegla      : apiData.codRegla,
      conDocumentos : apiData.conDocumentos,
      createdAt     : new Date(),
      llaveProceso  : parentProc.llaveProceso,
      fechaActuacion: fechaActuacion,
      fechaRegistro : fechaRegistro,
      fechaInicial  : fechaInicial,
      fechaFinal    : fechaFinal,
      idProceso     : parentProc.idProceso,
      isUltimaAct   : isUltima,
      proceso       : {
        connect: {
          idProceso: parentProc.idProceso,
        },
      },
    };

    return await client.actuacion.upsert( {
      where: {
        idRegActuacion: idRegString,
      },
      create: dataPayload,
      update: {
        fechaActuacion,
        fechaRegistro,
        fechaInicial,
        fechaFinal,
        isUltimaAct  : isUltima,
        consActuacion: apiData.consActuacion,
        cant         : apiData.cant,
      },
    } );
  }

  static async updateCarpetaIfNewer(
    actuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest,
  ) {
    const incomingLast = actuaciones.find( ( a ) => {
      return a.consActuacion === a.cant;
    } );

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
          ?.getTime() || 0;
      const savedDate = ensureDate( carpeta.fecha )
        ?.getTime() || 0;

      if ( incomingDate > savedDate ) {
        console.log( `🔄 Updating Carpeta ${ parentProc.carpetaNumero } with new Actuacion date.`, );

        if ( carpeta.idRegUltimaAct ) {
          await client.actuacion
            .update( {
              where: {
                idRegActuacion: carpeta.idRegUltimaAct,
              },
              data: {
                isUltimaAct: false,
              },
            } )
            .catch( () => {
              return null;
            } );
        }

        await client.carpeta.update( {
          where: {
            numero: parentProc.carpetaNumero,
          },
          data: {
            fecha          : ensureDate( incomingLast.fechaActuacion ),
            revisado       : false,
            updatedAt      : new Date(),
            ultimaActuacion: {
              connect: {
                idRegActuacion: String( incomingLast.idRegActuacion ),
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
    }
  }

  private static async saveNewItemsToLog(
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
      await fs.mkdir(
        path.dirname( filePath ), {
          recursive: true,
        }
      );
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          filePath, 'utf-8'
        );
        currentData = JSON.parse( fileContent );

        if ( !Array.isArray( currentData ) ) {
          currentData = [];
        }
      } catch ( e ) {
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
    }
  }

  // ==========================================
  // LOGIC: DETECT & NOTIFY
  // ==========================================

  static async handleNewActuacionNotifications(
    apiActuaciones: FetchResponseActuacion[],
    parentProc: ProcessRequest,
    logger: FileLogger,
  ): Promise<void> {
    try {
      // 1. Get existing IDs
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

      // 2. Find NEW items
      const newActuaciones = apiActuaciones.filter( ( apiAct ) => {
        return !existingIds.has( String( apiAct.idRegActuacion ) );
      } );

      if ( newActuaciones.length === 0 ) {
        return;
      }

      console.log( `✨ Found ${ newActuaciones.length } NEW Actuaciones. Processing notifications...`, );

      // 3. Save to JSON File
      await this.saveNewItemsToLog(
        newActuaciones, parentProc
      );

      // 4. Process Each New Item
      for ( const act of newActuaciones ) {
        // A. Send Webhook
        try {
          const response = await fetch(
            WEBHOOK_URL, {
              method : 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify( {
                ...act,
                carpetaNumero: parentProc.carpetaNumero,
                llaveProceso : parentProc.llaveProceso,
              } ),
            }
          );

          if ( !response.ok ) {
            throw new Error( `Status ${ response.status }` );
          }
        } catch ( postError: any ) {
          console.error( `⚠️ Webhook Failed: ${ postError.message }` );
          await logger.logFailure(
            parentProc.idProceso,
            act,
            postError.message,
            'WEBHOOK',
          );
        }

        // B. [NEW] Send Telegram Notification
        try {
          await TelegramService.sendNotification(
            act, parentProc
          );
          console.log( `   📱 Telegram sent for Actuacion ${ act.idRegActuacion }`, );
          // Small delay to prevent Telegram rate limits
          await wait( 500 );
        } catch ( teleError: any ) {
          console.error( `⚠️ Telegram Failed: ${ teleError.message }` );
          await logger.logFailure(
            parentProc.idProceso,
            act,
            teleError.message,
            'TELEGRAM',
          );
        }
      }
    } catch ( error: any ) {
      console.error( `❌ Error in handleNewActuacionNotifications: ${ error.message }`, );
    }
  }
}

// ==========================================
// SECTION 5: API CLIENT
// ==========================================

export async function fetchWithSmartRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  retryDelay = 2000,
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

export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  private readonly RATE_LIMIT_DELAY_MS = 12000;

  constructor( baseUrl: string ) {
    this.baseUrl = baseUrl;
    this.logger = new FileLogger( 'failed_sync_ops.json' );
  }

  private async fetchWithRetry<T>( endpoint: string ): Promise<T> {
    const response = await fetchWithSmartRetry( `${ this.baseUrl }${ endpoint }` );

    if ( !response.ok ) {
      throw new ApiError(
        `HTTP ${ response.status }`, response.status
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
      if ( index > 0 ) {
        await wait( this.RATE_LIMIT_DELAY_MS );
      }

      let apiResponse: ConsultaActuacionResponse;

      try {
        const endpoint = pathBuilder( parentItem );
        console.log( `🌐 [${ index + 1 }/${ items.length }] Fetching: ${ parentItem.idProceso }`, );
        apiResponse
          = await this.fetchWithRetry<ConsultaActuacionResponse>( endpoint );
      } catch ( err: any ) {
        console.error( `❌ FETCH FAILED ID ${ parentItem.idProceso }: ${ err.message }`, );
        await this.logger.logFailure(
          parentItem.idProceso,
          parentItem,
          err.message,
          'FETCH',
        );

        continue;
      }

      const actuacionesList = apiResponse.actuaciones || [];

      if ( actuacionesList.length === 0 ) {
        continue;
      }

      // Handle Notifications (File, Webhook, Telegram)
      await ActuacionService.handleNewActuacionNotifications(
        actuacionesList,
        parentItem,
        this.logger,
      );

      // Upsert to DB
      for ( const act of actuacionesList ) {
        try {
          await ActuacionService.upsertActuacion(
            act, parentItem
          );
        } catch ( dbErr: any ) {
          console.error( `   ❌ DB UPSERT ERROR: ${ dbErr.message }` );
          await this.logger.logFailure(
            parentItem.idProceso,
            act,
            dbErr.message,
            'DB_ITEM',
          );
        }
      }

      await ActuacionService.updateCarpetaIfNewer(
        actuacionesList, parentItem
      );
      console.log( `   ✅ Synced ${ actuacionesList.length } items for Carpeta ${ parentItem.carpetaNumero }`, );
    }
  }
}

// ==========================================
// SECTION 6: MAIN EXECUTION
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
        };
      }

      return carpeta.idProcesos.map( ( idProceso ) => {
        return {
          idProceso,
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
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
  const api = new RobustApiClient( 'https://consultaprocesos.ramajudicial.gov.co:448', );

  try {
    const processesToCheck = await getProcesosToUpdate();
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
  } finally {
    await client.$disconnect();
  }
}

runSync();
