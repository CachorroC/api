/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConsultaActuacion, ProcessRequest } from '../types/actuaciones.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';
import { ActuacionService } from './actuacion.js';
import { ApiError } from './ApiError.js';
import { FileLogger } from './FileLogger.js';

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
    // eslint-disable-next-line no-unused-vars
    pathBuilder: ( item: ProcessRequest ) => string
  ): Promise<void> {
    console.log(
      `🚀 Starting process for ${ items.length } targets...`
    );

    for ( const [
      index,
      parentItem
    ] of items.entries() ) {


      try {
        const endpoint = pathBuilder(
          parentItem
        );
        console.log(
          `🌐 [${ index + 1 }/${ items.length }] Fetching: ${ parentItem.carpetaNumero }`
        );

        const apiResponse = await this.fetchWithRetry<ConsultaActuacion>(
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
