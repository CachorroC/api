/**
 * @module services/actuaciones-raw
 * @description Batch Actuaciones Fetcher Script
 * 
 * Command-line utility that fetches legal actions (actuaciones) for all processes
 * in the database. Uses rate limiting via async-sema to respect Colombian Judiciary
 * API constraints and exports results to JSON file.
 * 
 * EXECUTION WORKFLOW:
 * 1. Query database for up to 100 carpetas with their idProcesos
 * 2. Flatten to get list of all unique process IDs
 * 3. For each process:
 *    - Apply rate limit (RateLimit(5) = 5 ops per second)
 *    - Fetch actuaciones via fetchActuacionesRaw()
 *    - Push to accumulator array
 * 4. Write results to actuacionesFullOutput.json
 * 5. Exit with final count of processed actuaciones
 * 
 * RATE LIMITING:
 * Uses RateLimit(5) from async-sema library:
 * - Permits 5 operations per second
 * - await lim() blocks until rate limit allows
 * - Prevents API throttling and 429 responses
 * 
 * DATABASE INTEGRATION:
 * - Input: client.carpeta.findMany({take: 100})
 * - Retrieves first 100 carpetas and their associated process IDs
 * - Flattens nested structure: carpeta → multiple procesos
 * 
 * OUTPUT:
 * - File: actuacionesFullOutput.json
 * - Format: Array of ConsultaActuacion objects
 * - Content: Raw API responses for all actuaciones
 * 
 * ERROR HANDLING:
 * - Individual fetch failures: Logged to console, continues processing
 * - Array accumulation: null values included if fetch failed
 * - Final JSON contains mixed results (successful + failed fetches)
 * 
 * LIMITATIONS:
 * - Hardcoded to first 100 carpetas (use limit parameter for production)
 * - No retry mechanism (relies on fetchWithSmartRetry)
 * - Requires database to be populated with carpetas first
 */

import * as fs from 'fs/promises';
import { client } from './prisma.js';
import { RateLimit } from 'async-sema';
import fetchActuacionesRaw from './fetch-actuaciones.js';

/**
 * @async
 * @function getIdProcesos
 * @description Retrieves all unique process IDs (idProceso) from up to 100 carpetas
 * in the database, along with their parent carpeta number for tracking.
 * 
 * FLATTENING LOGIC:
 * Each carpeta has idProcesos array (multiple processes per case folder).
 * Maps each idProceso to object containing {idProceso, numero} pair.
 * 
 * @returns {Promise<Array<{idProceso: string, numero: number}>>} Array of process objects
 *         with process ID and parent carpeta number for logging/tracking
 * 
 * @example
 * const procesos = await getIdProcesos();
 * // Returns: [{idProceso: "11001400...", numero: 123456}, ...]
 * 
 * @note Limits to first 100 carpetas (configurable via {take: N})
 * @note Flattens nested array structure from Prisma query
 */
async function getIdProcesos() {
  const carpetas = await client.carpeta.findMany(
    {
      take: 100,
    } 
  );

  return carpetas.flatMap(
    (
      carpeta 
    ) => {
      return carpeta.idProcesos.map(
        (
          idProceso 
        ) => {
          return {
            idProceso,
            numero: carpeta.numero,
          };
        } 
      );
    } 
  );
}

/**
 * @async
 * @function main
 * @description Orchestrator function that fetches actuaciones for all processes in database.
 * Implements rate limiting to prevent API throttling and writes results to JSON file.
 * 
 * EXECUTION STEPS:
 * 1. Initialize empty array (ActsMap) to accumulate results
 * 2. Get all process IDs via getIdProcesos()
 * 3. Create rate limiter: RateLimit(5) allows 5 requests/second
 * 4. For each process (with index for display):
 *    - Wait for rate limit: await lim()
 *    - Fetch actuaciones: fetchActuacionesRaw(idProceso)
 *    - Push result to ActsMap (including null on error)
 * 5. Write to actuacionesFullOutput.json with 2-space indentation
 * 6. Return ActsMap array
 * 
 * PROGRESS TRACKING:
 * Logs \"[index+1/total] Fetching: numero\" format for human readability.
 * Example: \"[5/147] Fetching: 123456\"
 * 
 * RATE LIMITING STRATEGY:
 * RateLimit(5) creates a semaphore that allows 5 concurrent operations per second.
 * await lim() blocks until quota available, providing predictable rate.
 * 
 * ERROR HANDLING:
 * Individual fetch errors caught by fetchActuacionesRaw (returns null).
 * Null values included in final array (caller must filter/validate).
 * 
 * @returns {Promise<Array>} Array of ActuacionesConsulta results (includes nulls on errors)
 * 
 * @example\n * const results = await main();\n * console.log(`Processed ${results.length} process groups`);\n */
async function main() {
  const ActsMap = [];

  const idProcesos = await getIdProcesos();

  const lim = RateLimit(
    5 
  );

  for ( const [
    index,
    parentItem
  ] of idProcesos.entries() ) {
    const {
      idProceso, numero 
    } = parentItem;
    console.log(
      `🌐 [${ index + 1 }/${ idProcesos.length }] Fetching: ${ numero }` 
    );

    await lim();

    const acts = await fetchActuacionesRaw(
      idProceso 
    );

    ActsMap.push(
      acts 
    );
  }

  console.log(
    `finished processing actuaciones ${ ActsMap.length }` 
  );

  fs.writeFile(
    'actuacionesFullOutput.json', JSON.stringify(
      ActsMap, null, 2 
    ) 
  );

  return ActsMap;
}

main();
console.log(
  'the end' 
);
