/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview RobustApiClient - Reliable API Client for Judiciary Integration
 *
 * This client provides resilient HTTP communication with the Colombian Judiciary API.
 * It handles:
 * - Rate limiting with jitter to avoid WAF blocks
 * - Character encoding fixes for legacy systems
 * - Batch processing with error tracking
 * - Browser-like headers to bypass detection
 *
 * Features:
 * - UTF-8/ISO-8859-1 encoding compatibility
 * - Automatic retry with smart delay injection
 * - Comprehensive error logging
 * - Batch operation sequencing
 *
 * @module RobustApiClient
 */

import { ConsultaActuacion, ProcessRequest } from '../types/actuaciones.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';
import { ActuacionService } from './actuacion.js';
import { ApiError } from './ApiError.js';
import { FileLogger } from './FileLogger.js';

type FetchWithRetryResult<T> = T & {
  jsonData       : T;
  arrayBufferData: ArrayBuffer;
};

/**
 * RobustApiClient - Resilient HTTP client for Judiciary API communication
 *
 * This client specializes in handling legacy government APIs that may have:
 * - Strict rate limiting (WAF/DDoS protection)
 * - Character encoding issues (mixed UTF-8/ISO-8859-1)
 * - Inconsistent error responses
 * - Session/cookie requirements
 *
 * Usage pattern:
 * ```typescript
 * const client = new RobustApiClient('https://api.judiciary.gov');
 * const processes: ProcessRequest[] = [...];
 * await client.processBatch(processes, (proc) => {
 *   return `/api/v2/Proceso/Actuaciones/${proc.idProceso}`;
 * });
 * ```
 *
 * @class RobustApiClient
 */
export class RobustApiClient {
  private baseUrl: string;
  private logger : FileLogger;
  /** Fixed baseline delay to adhere to rate limits in ms */
  private readonly RATE_LIMIT_DELAY_MS = 12000;

  /**
   * Constructs a new RobustApiClient instance.
   *
   * Initializes the API client with a base URL and creates a failure logger
   * for tracking API errors and sync failures. The logger writes to
   * failed_sync_ops.json in the project root.
   *
   * @param {string} baseUrl - The base URL of the Judiciary API endpoint
   *                          (e.g., 'https://consultaprocesos.ramajudicial.gov.co:448')
   *
   * @example
   * const client = new RobustApiClient('https://consultaprocesos.ramajudicial.gov.co:448');
   * const processes = await client.processBatch(...);
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
   * Generates custom HTTP headers that mimic browser traffic.
   *
   * This method produces headers designed to bypass simple bot detection:
   * - Standard Chrome User-Agent for latest version
   * - Locale preferences favoring Spanish (Colombia)
   * - Fetch metadata headers indicating document navigation
   *
   * Purpose: Many government APIs reject requests from automated clients.
   * By spoofing browser headers, we avoid 403 Forbidden responses.
   *
   * @private
   * @returns {Object} Header object with User-Agent, Accept-Language, Sec-Fetch-* fields
   *
   * @example
   * const headers = this.getHeaders();
   * // Returns:
   * // {
   * //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0...',
   * //   'Accept-Language': 'en-US,en;q=0.9,es-CO;q=0.8...',
   * //   'Sec-Fetch-Dest': 'document',
   * //   ...
   * // }
   */
  private getHeaders() {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,es-CO;q=0.8,es-US;q=0.7,es;q=0.6',
      'Sec-Fetch-Dest' : 'document',
      'Sec-Fetch-Mode' : 'navigate',
      'Sec-Fetch-Site' : 'none',
    };
  }

  /**
   * Makes an HTTP request with automatic retry and character encoding handling.
   *
   * This method is the core HTTP communication layer:
   * 1. **Request**: Sends GET request with browser headers and smart retry logic
   * 2. **Status Check**: Validates HTTP 200-299 response; throws ApiError otherwise
   * 3. **Encoding Fix**: Decodes response as UTF-8 (Judiciary API uses standard UTF-8)
   * 4. **JSON Parsing**: Parses decoded text as JSON; throws on parse failure
   * 5. **Error Tracking**: Logs failures via ApiError with caller context
   *
   * The smart retry mechanism (from fetchWithSmartRetry) handles:
   * - Rate limiting (with jittered delays)
   * - Network failures (retries with exponential backoff)
   * - Connection timeouts
   *
   * Encoding Note: The TextDecoder uses UTF-8 and correctly handles special characters
   * like Spanish accents (ó, é, etc) and other diacritical marks from the legacy API.
   *
   * @private
   * @async
   * @template T - The TypeScript type expected from the JSON response
   * @param {string} endpoint - The API endpoint path (appended to baseUrl)
   *                           Example: '/api/v2/Proceso/Actuaciones/12345'
  * @returns {Promise<FetchWithRetryResult<T>>} Parsed JSON response with raw buffer metadata
   * @throws {ApiError} When status is not OK or JSON parsing fails
   *
   * @example
   * const response = await this.fetchWithRetry<ConsultaActuacion>(
   *   '/api/v2/Proceso/Actuaciones/123'
   * );
   * console.log(response.actuaciones.length);
   */
  private async fetchWithRetry<T extends object>(
    endpoint: string
  ): Promise<FetchWithRetryResult<T>> {
    const options = {
      headers: this.getHeaders(),
    };
    const response = await fetchWithSmartRetry(
      `${ this.baseUrl }${ endpoint }`,
      options,
    );

    if ( !response.ok ) {
      throw new ApiError(
        `HTTP ${ response.status } ${ response.statusText }`,
        '🚫 failed request: fetchWithRetry:',
        response.status,
      );
    }

    // Clone the response so it can be read twice
    const responseClone = response.clone();

    // Get the JSON object from the original response
    const jsonPromise = response.json();

    // Get the ArrayBuffer from the cloned response
    const arrayBufferPromise = responseClone.arrayBuffer();

    // Wait for both promises to resolve
    const jsonData = await jsonPromise as T;
    const arrayBufferData = await arrayBufferPromise;

    try {
      return {
        ...jsonData,
        arrayBufferData,
        jsonData,
      };
    } catch ( e ) {
      console.error(
        'Error parsing JSON after decoding:', e
      );

      throw new ApiError(
        'Invalid JSON response',
        '🚫 failed request: fetchWithRetry: JSON.parse',
      );
    }
  }

  /**
   * Processes a batch of legal processes by fetching action records from the API.
   *
   * This is the main batch orchestration method that:
   * 1. **Iterates sequentially** through each ProcessRequest item
   * 2. **Generates endpoint** using the provided pathBuilder callback
   * 3. **Fetches data** using safe retry mechanism
   * 4. **Syncs actuations** using ActuacionService for change detection
   * 5. **Handles errors** gracefully, logging failures without stopping
   * 6. **Reports progress** to console with indexed output ([n/total])
   *
   * Sequential Processing:
   * - Processes items one-at-a-time to avoid overwhelming the API
   * - The smart rate limiting (inside fetchWithSmartRetry) adds delays
   * - Failures in one item do not affect subsequent items
   *
   * Error Handling:
   * - Individual item failures are caught and logged
   * - Logs include: item index, carpeta number, and error message
   * - Processing continues after failures (non-blocking)
   * - Failures written to failed_sync_ops.json for audit/retry
   *
   * Typical Workflow:
   * ```
   * API → Fetch Actuaciones
   *     → Parse JSON
   *     → Pass to ActuacionService.syncBatch()
   *     → Detect changes
   *     → Insert/Update/Notify
   * ```
   *
   * @public
   * @async
   * @param {ProcessRequest[]} items - Array of processes to fetch actuations for.
   *                                   Each item must contain:
   *                                   - idProceso: Process ID
   *                                   - carpetaNumero: Case folder number
   *                                   - llaveProceso: Case filing number
   *                                   - nombre: Case name
   * @param {(item: ProcessRequest) => string} pathBuilder - Callback function that
   *                                                        generates the endpoint path
   *                                                        for each item. Receives the
   *                                                        item and returns a path like:
   *                                                        '/api/v2/Proceso/Actuaciones/123'
   * @returns {Promise<void>} Completes after all items are processed
   *
   * @throws {Error} Caught internally; individual errors logged but don't propagate
   *
   * @example
   * const client = new RobustApiClient('https://consultaprocesos.ramajudicial.gov.co:448');
   * const items: ProcessRequest[] = [
   *   { idProceso: '123', carpetaNumero: 1, llaveProceso: '2024-1234', nombre: 'Case 1' },
   *   { idProceso: '456', carpetaNumero: 2, llaveProceso: '2024-5678', nombre: 'Case 2' }
   * ];
   *
   * await client.processBatch(items, (proc) => {
   *   return `/api/v2/Proceso/Actuaciones/${proc.idProceso}`;
   * });
   * // Console output:
   * // 🚀 Starting process for 2 targets...
   * // 🌐 [1/2] Fetching: 1
   * // 🌐 [2/2] Fetching: 2
   */
  public async processBatch(
    items: ProcessRequest[],
    // eslint-disable-next-line no-unused-vars
    pathBuilder: ( item: ProcessRequest ) => string,
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
          `🌐 [${ index + 1 }/${ items.length }] Fetching: ${ parentItem.carpetaNumero }`,
        );

        const apiResponse
          = await this.fetchWithRetry<ConsultaActuacion>(
            endpoint
          );
        const {
          actuaciones, arrayBufferData
        } = apiResponse;
        const actuacionesList = actuaciones || [];

        if ( actuacionesList.length > 0 ) {
          await ActuacionService.syncBatch(
            actuacionesList,
            parentItem,
            this.logger,
            arrayBufferData,
          );
        }
      } catch ( err: any ) {
        console.log(
          `❌ FAILED ${ parentItem.carpetaNumero }: ${ err.message }`
        );
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
