/* eslint-disable @typescript-eslint/no-explicit-any */
// Fetch con reintentos inteligentes según status y errores de red
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

      // Reintentar solo si el status es 429, 500, 502, 503, 504
      if ( [
        429,
        500,
        502,
        503,
        504
      ].includes( response.status ) ) {
        if ( attempt < maxRetries - 1 ) {
          await wait( retryDelay );
          attempt++;

          continue;
        }
      }

      return response;
    } catch ( error: any ) {
      // Si es error de red, reintentar
      const isNetworkError
        = error
        && ( error.code === 'ECONNRESET'
          || error.code === 'ENOTFOUND'
          || error.code === 'ECONNREFUSED'
          || error.name === 'FetchError' );

      if ( isNetworkError && attempt < maxRetries - 1 ) {
        await wait( retryDelay );
        attempt++;

        continue;
      }

      throw error;
    }
  }

  throw new Error( 'fetchWithSmartRetry: No se pudo obtener respuesta satisfactoria', );
}

import * as fs from 'fs';
import * as path from 'path';
import { ConsultaActuacion, outActuacion } from '../types/actuaciones.js';
import Actuacion from '../models/actuacion.js';

//GG 2. Custom Error
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
  ) {
    super( message );
    this.name = 'ApiError';
  }
}

//GG --- Helper: Delay ---
export const wait = ( ms: number ) => {
  return new Promise( ( resolve ) => {
    return setTimeout(
      resolve, ms 
    );
  } );
};

//GG --- Helper: File Logger ---
export class FileLogger {
  private filePath: string;

  constructor( filename: string ) {
    this.filePath = path.join(
      __dirname, filename 
    );
  }

  //? Logs failures.
  //? 'context' helps us know which main API request this sub-item belonged to.
  public logFailure(
    contextId: string | number,
    subItem: unknown,
    error: string,
    phase: 'FETCH' | 'DB_ITEM',
  ) {
    let currentLog = [];

    if ( fs.existsSync( this.filePath ) ) {
      try {
        currentLog = JSON.parse( fs.readFileSync(
          this.filePath, 'utf-8' 
        ) );
      } catch {
        /*ignore*/
      }
    }

    currentLog.push( {
      timestamp: new Date()
        .toISOString(),
      phase,
      parentId: contextId, //? The ID used for the fetch URL
      error,
      data    : subItem, //? The specific item that failed (or the whole request if phase is FETCH)
    } );

    fs.writeFileSync(
      this.filePath, JSON.stringify(
        currentLog, null, 2 
      ) 
    );
  }
}

//GG --- Main Class ---
export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  private readonly RATE_LIMIT_DELAY_MS = 12000; //? 12 seconds per request

  constructor( baseUrl: string ) {
    this.baseUrl = baseUrl;
    this.logger = new FileLogger( 'failed_sync_ops.json' );
  }

  //GG Basic Fetch with Retry Logic
  private async fetchWithRetry<T>(
    endpoint: string,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;

    while ( attempt < maxRetries ) {
      try {
        const response = await fetchWithSmartRetry( `${ this.baseUrl }${ endpoint }`, );

        if ( !response.ok ) {
          throw new ApiError(
            `HTTP Error: ${ response.status }`, response.status 
          );
        }

        return ( await response.json() ) as T;
      } catch ( error ) {
        attempt++;

        const isClientError
          = error instanceof ApiError
          && error.statusCode
          && error.statusCode >= 400
          && error.statusCode < 500;

        if ( attempt >= maxRetries || isClientError ) {
          throw error;
        }

        await wait( 2000 ); //? Short wait for retry
      }
    }

    throw new Error( 'Unreachable' );
  }

  /**
   * Complex Batch Handler
   * 1. Fetches data (Rate Limited)
   * 2. Extracts 'actuaciones' array
   * 3. Iterates and Upserts items individually
   */
  public async processActuaciones<
    U extends { idProceso: number; carpetaNumero: number; carpetaId: number },
  >(
    items: U[],
    pathBuilder: ( item: U ) => string,
    dbHandler: ( actuacion: any, parentItem: U ) => Promise<void>,
  ): Promise<void> {
    console.log( `🚀 Starting process for ${ items.length } URL targets...` );

    for ( const [
      index,
      parentItem
    ] of items.entries() ) {
      //GG --- A. Rate Limiting (Throttle the Fetch) ---
      if ( index > 0 ) {
        console.log( '⏳ Waiting 12s for rate limit...' );
        await wait( this.RATE_LIMIT_DELAY_MS );
      }

      //GG --- B. The Fetch Step ---
      let responseData: ConsultaActuacion;

      try {
        const endpoint = pathBuilder( parentItem );

        console.log( `🌐 Fetching: ${ endpoint }` );
        responseData = await this.fetchWithRetry<ConsultaActuacion>( endpoint );
      } catch ( err ) {
        const msg = err instanceof Error
          ? err.message
          : 'Unknown Fetch Error';

        console.error( `❌ FETCH FAILED for Parent ID ${ parentItem.idProceso }: ${ msg }`, );
        //?? Log the PARENT item as failed because we couldn't even get the list
        this.logger.logFailure(
          parentItem.idProceso, parentItem, msg, 'FETCH' 
        );

        continue; //? Move to next URL
      }

      //GG --- C. The Array Processing Step ---
      const actuacionesList = responseData.actuaciones || [];

      console.log( `   📂 Found ${ actuacionesList.length } actuaciones. Processing DB writes...`, );

      if ( actuacionesList.length === 0 ) {
        console.warn( `   ⚠️ Warning: 'actuaciones' array is empty for ID ${ parentItem.idProceso }`, );
      }

      for ( const actuacion of actuacionesList ) {
        const outActuacion: outActuacion = {
          ...actuacion,
          fechaActuacion:
            actuacion.fechaActuacion instanceof Date
              ? actuacion.fechaActuacion
              : new Date( actuacion.fechaActuacion ),
          fechaFinal: actuacion.fechaFinal
            ? actuacion.fechaFinal instanceof Date
              ? actuacion.fechaFinal
              : new Date( actuacion.fechaFinal )
            : null,
          fechaInicial: actuacion.fechaInicial
            ? actuacion.fechaInicial instanceof Date
              ? actuacion.fechaInicial
              : new Date( actuacion.fechaInicial )
            : null,
          fechaRegistro:
            actuacion.fechaRegistro instanceof Date
              ? actuacion.fechaRegistro
              : new Date( actuacion.fechaRegistro ),
          createdAt     : new Date(),
          idProceso     : parentItem.idProceso,
          isUltimaAct   : actuacion.cant === actuacion.consActuacion,
          idRegActuacion: `${ actuacion.idRegActuacion }`,
        };

        try {
          //? Call the Prisma handler for this specific sub-item
          await dbHandler(
            outActuacion, parentItem 
          );

          //? Optional: Add a tiny delay here if DB is overwhelmed, usually not needed for upserts
          //? process.stdout.write('.'); // Progress indicator
        } catch ( dbErr ) {
          const msg = dbErr instanceof Error
            ? dbErr.message
            : 'DB Error';

          console.error( `\n   ❌ DB UPSERT FAILED for an item inside Parent ${ parentItem.idProceso }: ${ msg }`, );

          //? Log specific sub-item failure, but continue the loop!
          this.logger.logFailure(
            parentItem.idProceso,
            actuacion,
            msg,
            'DB_ITEM',
          );
        }
      }

      try {
        await Actuacion.prismaUpdaterActuaciones(
          actuacionesList.map( ( actuacion ) => {
            return {
              ...actuacion,
              fechaActuacion:
                actuacion.fechaActuacion instanceof Date
                  ? actuacion.fechaActuacion
                  : new Date( actuacion.fechaActuacion ),
              fechaFinal: actuacion.fechaFinal
                ? actuacion.fechaFinal instanceof Date
                  ? actuacion.fechaFinal
                  : new Date( actuacion.fechaFinal )
                : null,
              fechaInicial: actuacion.fechaInicial
                ? actuacion.fechaInicial instanceof Date
                  ? actuacion.fechaInicial
                  : new Date( actuacion.fechaInicial )
                : null,
              fechaRegistro:
                actuacion.fechaRegistro instanceof Date
                  ? actuacion.fechaRegistro
                  : new Date( actuacion.fechaRegistro ),
              createdAt     : new Date(),
              idProceso     : parentItem.idProceso,
              isUltimaAct   : actuacion.cant === actuacion.consActuacion,
              idRegActuacion: `${ actuacion.idRegActuacion }`,
            };
          } ),
          parentItem.carpetaNumero,
          parentItem.carpetaId,
        );
      } catch ( error ) {
        const msg = error instanceof Error
          ? error.message
          : 'DB Error';

        console.error( `\n   ❌ DB UPSERT FAILED for an item inside Parent ${ parentItem.idProceso }: ${ msg }`, );

        //? Log specific sub-item failure, but continue the loop!
        this.logger.logFailure(
          parentItem.idProceso,
          actuacionesList,
          msg,
          'DB_ITEM',
        );
      }

      console.log( `\n   ${ parentItem.carpetaNumero }✅ Finished processing items for Parent ${ parentItem.idProceso }`, );
    }
  }
}
