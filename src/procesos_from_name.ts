/**
 * @module procesos_from_name
 * @description Alternative Entry Point for Case Processing by Custom Logic
 *
 * Provides an async generator function for processing cases using name-based queries
 * instead of filing number lookup. Used when data import requires alternative case
 * identification or when working with non-standard case number formats.
 *
 * PROCESSING WORKFLOW:
 * RawCarpetas[] → Map to ClassCarpeta instances
 *   ↓
 * For each carpeta:
 *   1. Call getProcesosByName() - Fetch processes by name-based search
 *   2. Call getActuaciones() - Fetch latest actions/motions
 *   ↓
 * Yield populated ClassCarpeta to consumer
 *   ↓
 * Consumer processes results (map to DB, export JSON, etc.)
 *
 * ASYNC GENERATOR PATTERN:
 * Provides memory-efficient streaming of results without loading all cases into memory.
 * Allows downstream processing to handle one case at a time while maintaining
 * asynchronous data fetching behavior.
 *
 * @comparison With procesos.ts root script:
 * procesos.ts: Fixed pipeline - Fetch cases → Update DB → Export JSON
 * procesos_from_name.ts: Flexible - Provides generator for custom processing
 */

import * as fs from 'fs/promises';
import { ClassCarpeta } from './models/carpeta.js';
import { RawCarpetas } from './assets/carpetas.js';
const carpetasMap = RawCarpetas.map(
  (
    carpeta
  ) => {
    return new ClassCarpeta(
      carpeta
    );
  }
);

/**
 * @async
 * @generator
 * @function generateCarpetas
 * @description Async generator that yields fully populated case folder objects one at a time.
 * For each RawCarpeta, creates a ClassCarpeta instance, fetches processes and actuaciones,
 * then yields the populated object to consumer.
 *
 * EXECUTION FLOW:
 * 1. Transform RawCarpetas array to ClassCarpeta model instances
 * 2. For each instance:
 *    - await carpeta.getProcesosByName() - Fetch processes (potentially from API)
 *    - await carpeta.getActuaciones() - Fetch latest case actions
 *    - yield carpeta - Send populated object to consumer
 *
 * MEMORY EFFICIENCY:
 * Uses async iteration over map result. Each case is fully populated before
 * yielding, ensuring memory doesn't balloon with queued operations.
 *
 * @yields {ClassCarpeta} Fully populated case folder with processes and actuaciones
 *
 * @example
 * for await (const carpeta of generateCarpetas()) {
 *   console.log(`Processed case ${carpeta.numero}`);
 *   // Handle populated carpeta
 * }
 *
 * @note Method names suggest "ByName" processing (getProcesosByName), implying
 *       alternative lookup mechanism from standard carpeta.getProcesos()
 */
export async function* generateCarpetas() {
  for await ( const carpeta of carpetasMap ) {
    await carpeta.getProcesosByName();
    await carpeta.getActuaciones();
    yield carpeta;
  }
}

async function tryAsyncClassCarpetas() {
  const mapClassCarpetas: Map<number, ClassCarpeta> = new Map();

  for await ( const carpeta of generateCarpetas() ) {
    mapClassCarpetas.set(
      carpeta.numero, carpeta
    );
  }

  fs.writeFile(
    'ClasscarpetasModelPostAwait.json',
    JSON.stringify(
      Array.from(
        mapClassCarpetas.values()
      )
    ),
  );

  const asAnArray = Array.from(
    mapClassCarpetas.values()
  );

  return asAnArray;
}

tryAsyncClassCarpetas();
