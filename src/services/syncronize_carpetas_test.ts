import { RawCarpetas } from '../data/carpetas.js';


// Add this helper function at the bottom or in utils
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

async function tryAsyncClassCarpetas() {
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
        /* try {
          const existingCarpeta = await client.carpeta.findUnique( {
          where: {
            numero: carpeta.numero
          }
        } )
        if ( existingCarpeta && existingCarpeta.llaveProceso === carpeta.llaveProceso )
        {
          return
        }
        } catch (error) {
          console.error(
          `❌ Error processing prisma find unique  ${ item.numero }:`,
          error
        );
        } */

        // Fetch Data
        await carpeta.getProcesos();

        // commenting out the method of getActuaciones so that it is handled directly by it's own instance
        /* await carpeta.getActuaciones(); */
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

// MISSING LINE: You must add this to actually run the script!
tryAsyncClassCarpetas()
  .then(
    () => {
      return console.log(
        'Script finished successfully.'
      );
    }
  )
  .catch(
    (
      e
    ) => {
      return console.error(
        'Script crashed:', e
      );
    }
  );
