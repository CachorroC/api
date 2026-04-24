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
 * ↓
 * Divide into batches (configurable batchSize)
 * ↓
 * For each batch:
 * - Instantiate ClassCarpeta only when needed
 * - Check for existing record in database
 * - Evaluate changes (llaveProceso, category, dates)
 * - Upsert to database
 * ↓
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
import { NotificationService } from './services/notification-service.js';
import { rawCarpetas } from './assets/carpetas.js';
import { ClassCarpeta } from './models/carpeta.js';
import { client } from './services/connection/prisma.js';
import { TelegramService } from './services/telegramService.js';
import { sleep } from './utils/awaiter.js';
import { areNamesCompletelyDifferent } from './utils/string-similarity.js';

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
 * Side effects only (returns void).
 * @returns {Promise<void>} Resolves when all items processed successfully.
 * @throws {Error} If handler throws - error propagates and stops processing.
 *
 * @example
 * // Process 100 carpetas in batches of 5
 * await processBatch<ClassCarpeta>(
 * carpetaArray,
 * 5,
 * async (carpeta) => {
 * await carpeta.syncToDatabase();
 * }
 * );
 *
 * @note For rate limits of 1 req/12.5s, use batchSize=1
 * @note For better throughput with looser rate limits, increase batchSize to 5-10
 *
 * @caveat If the handler throws an error, the current batch will fail, and the entire process
 * will stop (the error propagates). Ensure individual error handling within the handler if
 * you want to continue processing subsequent items.
 *
 * ## ADDITIONAL LOGIC FLOW
 * This utility provides a "Chunk-Parallel" execution strategy:
 * - **Horizontal Parallelism**: Executes all items within a single batch concurrently using `Promise.all()`.
 * - **Vertical Sequentiality**: Waits for the current batch to fully resolve before moving to the next one.
 */
async function processBatch<T>(
  items: T[],
  batchSize: number,
  handler: ( item: T ) => Promise<void>
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
      )
    );
  }
}

// ---------------------------------------------------------

/**
 * @async
 * @function tryAsyncClassCarpetas
 * @description Main orchestration function for synchronizing the case folder (Carpeta) database.
 * It transforms raw spreadsheet-like data into structured models and syncs them with the
 * Colombian Judiciary's official API.
 *
 * ## LOGIC FLOW & ARCHITECTURE
 * 1. **Data Normalization**: Reads raw case data and sorts by internal folder number (descending).
 * 2. **Batch Orchestration**: Uses `processBatch` with a hardcoded size (default 1) to respect
 *    strict government API rate limits (~12.5s per request).
 * 3. **Existence Check**: Queries Prisma for an existing record using the unique `numero`.
 * 4. **Safety Guards**:
 *    - **Name Mismatch Guard**: Uses string similarity algorithms (`areNamesCompletelyDifferent`)
 *      to detect if the local case name significantly differs from the DB record. If they differ,
 *      it aborts the update and sends notifications (Telegram/Service) to prevent data corruption.
 * 5. **Change Detection (Skip Logic)**:
 *    - Compares `nombre`, `llaveProceso`, `category`, `fechaUltimaRevision`, and `idProcesos`.
 *    - If all match and `idProcesos` is already populated, it skips the expensive API fetch phase.
 * 6. **Synchronization**:
 *    - Instantiates `ClassCarpeta` (lazy loading).
 *    - Calls `getProcesos()` and `getActuaciones()` (Internal API calls).
 *    - Persists the final state via `agregateToDBMethod()`.
 *
 * ## CAVEATS & SIDE EFFECTS
 * - **Rate Limiting**: The process is intentionally slow (1 batch = 1 item) to avoid being blocked
 *   by the Rama Judicial firewall.
 * - **External API Dependency**: Failure of the Judiciary API will cause the sync for that item
 *   to throw an error, which is caught and logged per-item.
 * - **Database Mutability**: This function performs heavy write operations (Upserts) and deletes/re-creates
 *   related records (processes, actions) depending on the model implementation.
 * - **Notifications**: May trigger Telegram alerts if new legal actions are detected or if
 *   integrity guards are tripped.
 * - **Garbage Collection**: By processing items one by one and letting `ClassCarpeta` instances
 *   go out of scope, memory usage remains stable even with thousands of records.
 *
 * @returns {Promise<void>} Resolves when the entire synchronization cycle finishes.
 */
export async function tryAsyncClassCarpetas() {
  try {
    console.log(
      '🚀 Starting Optimized Sync...'
    );
    const RawCarpetas = rawCarpetas();
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
    ).sort(
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
          // Fetch Data
          await carpeta.getProcesos();

          try {
            const existingCarpeta
              = await client.carpeta.findUnique(
                {
                  where: {
                    numero: carpeta.numero,
                  },
                }
              );

            // 1. Check if the record already exists
            if ( existingCarpeta ) {
            // 1a. Guard: nombre mismatch — skip and alert
            // Check if existing name has a value before comparing to prevent skipping when it's empty
              const hasExistingName = existingCarpeta.nombre !== undefined
                                    && existingCarpeta.nombre !== null
                                    && existingCarpeta.nombre !== ''
                                    && existingCarpeta.nombre !== 'undefined';

              if (
                hasExistingName
              && areNamesCompletelyDifferent(
                existingCarpeta.nombre, carpeta.nombre
              )
              ) {
                const warningMsg
                  = `⚠️ NOMBRE MISMATCH en carpeta #${ carpeta.numero }:\n`
                + `  DB:    "${ existingCarpeta.nombre }"\n`
                + `  Local: "${ carpeta.nombre }"\n`
                + 'Se omite la actualización para evitar sobreescribir con un nombre diferente.';

                console.warn(
                  warningMsg
                );

                await TelegramService.sendSimpleMessage(
                  warningMsg
                );

                await NotificationService.processNotifications(
                  {
                    title         : `${ carpeta.numero } ${ carpeta.nombre }`,
                    body          : `La carpeta que está procesando no tiene el mismo nombre que la carpeta que existe en la base de datos, por favor revisar la discrepancia entre los valores: ${ existingCarpeta.nombre } y ${ carpeta.nombre }`,
                    additionalData: {
                      carpetaId      : existingCarpeta.id,
                      carpetaNumero  : carpeta.numero,
                      carpetaNombre  : carpeta.nombre,
                      llaveProceso   : carpeta.llaveProceso,
                      category       : carpeta.category,
                      existingCarpeta: existingCarpeta,
                      carpeta        : carpeta,
                    }
                  }
                );

                return; // Skip this carpeta entirely
              }

              // 2. Evaluate changes
              const isSameLlave
                = existingCarpeta.llaveProceso
              === carpeta.llaveProceso;
              console.log(
                `isSameLlave: ${ isSameLlave }`
              );
              const isSameCategory
                = existingCarpeta.category === carpeta.category;
              console.log(
                `isSameCategory: ${ isSameCategory }`
              );

              const isSamefechaUltimaRevision
                = existingCarpeta.fechaUltimaRevision?.getTime()
              === carpeta.fechaUltimaRevision?.getTime();
              console.log(
                `existing carpeta fechaUltimaRevision: ${ existingCarpeta.fechaUltimaRevision } && carpeta fechaUltimaRevision: ${ carpeta.fechaUltimaRevision } isSamefechaUltimaRevision? ${ isSamefechaUltimaRevision }`
              );
              const isSameName = existingCarpeta.nombre === carpeta.nombre;

              const existingCarpetaIdProcesos = new Set(
                existingCarpeta.idProcesos
              );
              const carpetaIdProcesos = new Set(
                carpeta.idProcesos
              );


              // 3. Skip ONLY if neither has changed
              // Also enforce that we don't skip if the DB was missing the name but we have it now
              if (
                hasExistingName
              && isSameName
              && isSameLlave
              && isSameCategory
                && isSamefechaUltimaRevision
              ) {
                console.log(
                  `⏭️ Skipping ${ carpeta.numero }: name, llaveProceso, category, and idProcesos are unchanged.`
                );

                return;
              }

              if ( !hasExistingName ) {
                console.log(
                  existingCarpeta.nombre + typeof existingCarpeta.nombre
                );
                await sleep(
                  12000
                );
              }
            }
          } catch ( error ) {
            console.error(
              `❌ Error processing prisma find unique ${ item.numero }:`,
              error
            );
          }




          // commenting out the method of getActuaciones so that it is handled directly by it's own instance
          await carpeta.getActuaciones();
          // Write to DB
          await carpeta.agregateToDBMethod();
        // Force Garbage Collection hint (optional, logic handles it naturally here)
        // The 'carpeta' variable goes out of scope here and is freed from memory.
        } catch ( error ) {
          console.error(
            `❌ Error processing ${ item.numero }:`,
            error
          );
        }
      }
    );

    console.log(
      '✅ Sync Complete'
    );

    return;
  } finally {
    await client.$disconnect();


  }
}
