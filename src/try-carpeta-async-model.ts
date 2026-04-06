/**
 * @module try-carpeta-async-model
 * @description Optimized Batch Processing Pattern for Case Folder Synchronization
 *
 * Demonstrates efficient large-scale processing of case folders with configurable batch sizes.
 * Provides a generic batch processor utility and an orchestration function that syncs carpetas
 * with the database while managing rate limits and memory usage.
 *
 * BATCH PROCESSING WORKFLOW:
 * Raw Data → Sort by number (descending)
 *   ↓
 * Divide into batches (configurable batchSize)
 *   ↓
 * For each batch:
 *   - Instantiate ClassCarpeta only when needed
 *   - Check for existing record in database
 *   - Evaluate changes (llaveProceso, category, dates)
 *   - Upsert to database
 *   ↓
 * Log progress and continue next batch
 *
 * MEMORY EFFICIENCY:
 * - Lazy instantiation: ClassCarpeta created only when processing
 * - No array accumulation: Streams results directly to database
 * - Batch parallelization: Promise.all() within batch (sequential between batches)
 *
 * RATE LIMITING:
 * - batchSize = 1 (default) due to strict 12.5-second rate limits
 * - Can increase to 5-10 if rate limits are reduced
 * - Respects government API constraints
 *
 * CHANGE DETECTION:
 * Identifies if carpeta needs update by comparing:
 * - llaveProceso (process key)
 * - category (case type)
 * - Multiple date fields
 * Prevents unnecessary database writes
 */

/* eslint-disable no-unused-vars */
import { RawCarpetas } from './assets/carpetas.js';
import { ClassCarpeta } from './models/carpeta.js';
import { client } from './services/connection/prisma.js';

// Add this helper function at the bottom or in utils
/**
 * @async
 * @function processBatch
 * @template T
 * @description Generic batch processor that divides items into chunks and processes
 * each chunk in parallel using Promise.all(). Provides streaming semantics without
 * accumulating results in memory.
 *
 * EXECUTION PATTERN:
 * 1. Slice items into chunks of size batchSize
 * 2. For each chunk: Map to handler promises
 * 3. Wait for all promises in chunk with Promise.all()
 * 4. Continue to next chunk (sequential between batches)
 * 5. Log progress per batch
 *
 * PARALLELISM:
 * - Within batch: Parallel (Promise.all on handler results)
 * - Between batches: Sequential (await before next batch)
 * This pattern prevents overwhelming the API while maximizing throughput within rate limits.
 *
 * MEMORY EFFICIENCY:
 * No accumulation of results - handler is responsible for side effects (DB writes, logging).
 * Each item processed and discarded immediately after handler completes.
 *
 * @template T - Item type being processed (RawDb, ClassCarpeta, etc.)
 * @param {T[]} items - Array of items to process
 * @param {number} batchSize - Number of items per batch (e.g., 1, 5, 10)
 * @param {(item: T) => Promise<void>} handler - Async function to execute for each item.
 *                                               Side effects only (returns void).
 * @returns {Promise<void>} Resolves when all items processed successfully.
 * @throws {Error} If handler throws - error propagates and stops processing.
 *
 * @example
 * // Process 100 carpetas in batches of 5
 * await processBatch<ClassCarpeta>(
 *   carpetaArray,
 *   5,
 *   async (carpeta) => {
 *     await carpeta.syncToDatabase();
 *   }
 * );
 *
 * @note For rate limits of 1 req/12.5s, use batchSize=1
 * @note For better throughput with looser rate limits, increase batchSize to 5-10
 */
async function processBatch<T>(
  items: T[],
  batchSize: number,
  handler: ( item: T ) => Promise<void>,
) {
  for ( let i = 0; i < items.length; i += batchSize ) {
    const batch = items.slice(
      i, i + batchSize
    );
    console.log(
      `Processing batch ${ i / batchSize + 1 }...`
    );
    // Run this batch in parallel
    await Promise.all(
      batch.map(
        (
          item
        ) => {
          return handler(
            item
          );
        }
      ),
    );
  }
}

// ---------------------------------------------------------

/**
 * Description placeholder
 *
 * @async
 * @returns {*}
 */
export async function tryAsyncClassCarpetas() {
  console.log(
    '🚀 Starting Optimized Sync...'
  );
  // 1. Convert Raw Data to lightweight objects (Don't instantiate ClassCarpeta yet if not needed)
  const rawData = RawCarpetas.map(
    (
      r
    ) => {
      return {
        raw   : r,
        numero: Number(
          r.NUMERO
        ),
      };
    }
  )
    .sort(
      (
        a, b
      ) => {
        return b.numero - a.numero;
      }
    );

  // 2. Process in Batches
  // We use a batch size of 1 because your RATE_LIMIT is strict (12.5s).
  // If you lower the rate limit, increase this to 5 or 10.
  const BATCH_SIZE = 1;

  await processBatch(
    rawData, BATCH_SIZE, async (
      item
    ) => {
      try {
      // Instantiate only when needed to save memory
        const carpeta = new ClassCarpeta(
          item.raw
        );
        console.log(
          `\n📂 Processing: ${ carpeta.numero } - ${ carpeta.nombre }`
        );

        try {
          const existingCarpeta = await client.carpeta.findUnique(
            {
              where: {
                numero: carpeta.numero,
              },
            }
          );

          // 1. Check if the record already exists
          if ( existingCarpeta ) {
          // 2. Evaluate changes
            const isSameLlave
              = existingCarpeta.llaveProceso === carpeta.llaveProceso;
            console.log(
              `isSameLlave: ${ isSameLlave }`
            );
            const isSameCategory = existingCarpeta.category === carpeta.category;
            console.log(
              `isSameCategory: ${ isSameCategory }`
            );
            console.log(
              `existing carpeta fechaUltimaRevision: ${ existingCarpeta.fechaUltimaRevision } && carpeta fechaUltimaRevision: ${ carpeta.fechaUltimaRevision }`,
            );
            const isSamefechaUltimaRevision
              = existingCarpeta.fechaUltimaRevision?.getTime()
            === carpeta.fechaUltimaRevision?.getTime();

            // 3. Skip ONLY if neither has changed
            if ( isSameLlave && isSameCategory && isSamefechaUltimaRevision ) {
              console.log(
                `⏭️ Skipping ${ carpeta.numero }: llaveProceso and category are unchanged.`,
              );

              return;
            }
          }
        } catch ( error ) {
          console.error(
            `❌ Error processing prisma find unique ${ item.numero }:`,
            error,
          );
        }

        // Fetch Data
        await carpeta.getProcesos();

        // commenting out the method of getActuaciones so that it is handled directly by it's own instance
        await carpeta.getActuaciones();
        // Write to DB
        await carpeta.agregateToDBMethod();
      // Force Garbage Collection hint (optional, logic handles it naturally here)
      // The 'carpeta' variable goes out of scope here and is freed from memory.
      } catch ( error ) {
        console.error(
          `❌ Error processing ${ item.numero }:`, error
        );
      }
    }
  );

  console.log(
    '✅ Sync Complete'
  );
}

// ... End of tryAsyncClassCarpetas function }
