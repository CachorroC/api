import { RawCarpetas } from './data/carpetas.js';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { RawDb } from './types/raw-db.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );
// 1. Define the interface for your input (RawCarpeta)
// I am assuming EXPEDIENTE exists; add other properties if needed.


// 2. Define the interface for your output object
interface ProcessedExpediente {
  ciudad: string;
}

/**
 * Iterates over raw carpetas, extracts EXPEDIENTE, and saves to JSON.
 * @param rawData - Array of RawCarpeta objects
 * @param fileName - The name of the output file (e.g., 'output.json')
 */
async function exportExpedientesToJson(
  rawData: RawDb[], fileName: string
): Promise<void> {
  try {
    // Step 1: Transform the data
    // We iterate over the array, convert EXPEDIENTE to string, and return the new object structure
    const outputData: ProcessedExpediente[] = rawData.map( ( item ) => {
      return {
        ciudad: String( item.JUZGADO_CIUDAD ) // Ensures it is converted to a string
      };
    } );

    const setData = new Set();

    for ( const data of outputData ) {
      setData.add( data.ciudad );
    }

    // Step 2: Convert to JSON string
    // The 'null, 2' arguments make the JSON readable (pretty-printed) as requested
    const jsonContent = JSON.stringify(
      Array.from( setData ), null, 2
    );

    // Step 3: Write to file
    const filePath = join(
      __dirname, fileName
    );
    await writeFile(
      filePath, jsonContent, 'utf-8'
    );

    console.log( `✅ Successfully exported ${ outputData.length } records to ${ filePath }` );

  } catch ( error ) {
    console.error(
      '❌ Error writing file:', error
    );
  }
}

// --- Usage Example ---

// Mock Data (Simulating your RawCarpetas)


// Run the function
exportExpedientesToJson(
  RawCarpetas, 'ciudades.json'
);