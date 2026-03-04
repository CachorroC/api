/**
 * @module services/fetch-actuaciones
 * @description Raw Actuaciones API Fetcher Service
 * 
 * Provides low-level HTTP interface to Colombian Judiciary API for fetching
 * legal actions (actuaciones) associated with a specific legal process.
 * Acts as a thin wrapper around fetchWithSmartRetry with minimal error handling.
 * 
 * RESPONSIBILITIES:
 * 1. Construct API endpoint URL with process ID
 * 2. Execute HTTP request via fetchWithSmartRetry (rate limiting + retry + parsing)
 * 3. Parse JSON response into typed object
 * 4. Handle SyntaxError exceptions (malformed JSON)
 * 5. Log errors to console
 * 6. Return null on failure (graceful degradation)
 * 
 * INTEGRATION POINTS:
 * - Input: idProceso (string) from ClassProcesos or Proceso objects
 * - Output: ConsultaActuacion | null
 * - Used by: ActuacionService.syncBatch(), actuaciones sync workflows
 * 
 * ERROR HANDLING:
 * - SyntaxError: Logs \"There was a SyntaxError\" + error details
 * - General/Network errors: Logs \"There was an error\" + error details
 * - Both cases: Returns null (does not throw)
 *
 * This allows batch processing to continue even if individual fetches fail.
 */

import { ConsultaActuacion } from '../types/actuaciones.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';

/**
 * @async
 * @function fetchActuacionesRaw
 * @description Fetches raw legal actions (actuaciones) for a specific process from government API.
 * Returns strongly-typed result via ConsultaActuacion interface, or null on error.
 * 
 * API ENDPOINT:
 * https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/{idProceso}
 * 
 * EXECUTION FLOW:
 * 1. Construct URL with provided idProceso parameter
 * 2. Call fetchWithSmartRetry() - Applies rate limiting, browser headers, retry logic
 * 3. Parse response.json() - Convert ArrayBuffer to JavaScript object
 * 4. Type-cast to ConsultaActuacion interface
 * 5. Return the typed result
 *
 * ERROR HANDLING:
 * If fetch fails or response is malformed JSON:
 * - Catch SyntaxError (malformed JSON response)
 * - Log error to console with context
 * - Return null (allows batch processing to continue)
 *
 * RATE LIMITING:
 * Delegated to fetchWithSmartRetry() which handles:
 * - Per-endpoint rate limit queues
 * - Exponential backoff on 429/503 responses
 * - Retry-After header parsing
 *
 * @param {string} idProceso - The process identifier from Colombian Judiciary API
 *                                (e.g., \"11001400132020-000011\")
 * @returns {Promise<ConsultaActuacion | null>} Typed actuaciones response or null
 *         if fetch failed or JSON parsing failed
 *
 * @example
 * const actuaciones = await fetchActuacionesRaw('11001400132020-000011');
 * if (actuaciones) {
 *   actuaciones.actuaciones.forEach(act => {
 *     console.log(act.descripcion);
 *   });
 * } else {
 *   console.log('Failed to fetch or parse response');
 * }
 *
 * @note Does NOT throw errors - returns null for graceful error handling
 * @note JSON parsing errors logged to console but not thrown
 * @note Must be used within a rate-limited batch operation context
 */
export default async function fetchActuacionesRaw(
  idProceso: string 
) {
  let json;

  try {
    const response = await fetchWithSmartRetry(
      `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${ idProceso }`,
    );

    json = ( await response.json() ) as ConsultaActuacion;
  } catch ( error ) {
    if ( error instanceof SyntaxError ) {
      // Unexpected token < in JSON
      console.log(
        'There was a SyntaxError', error 
      );
    }

    console.log(
      'There was an error', error 
    );
  }

  if ( json ) {
    return json;
  }

  return null;
}
