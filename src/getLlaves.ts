/**
 * @fileoverview Cidade Exporter Module
 *
 * This module extracts and exports unique city (ciudad) information from raw case data.
 * It transforms raw database records into a deduplicated set of cities and outputs
 * the results to a JSON file for reference and analysis.
 *
 * Workflow:
 * - Reads raw carpeta data from RawCarpetas
 * - Extracts JUZGADO_CIUDAD field from each record
 * - Deduplicates cities using a Set
 * - Writes unique cities to ciudades.json
 *
 * @module getLlaves
 */


import { writeFile } from 'fs/promises';
import { join } from 'path';
import { RawDb } from './types/raw-db.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { rawCarpetas } from './assets/carpetas.js';

const __filename = fileURLToPath(
  import.meta.url
);
const __dirname = dirname(
  __filename
);

/**
 * Represents a processed expediente (case) with cidade information.
 *
 * @typedef {Object} ProcessedExpediente
 * @property {string} ciudad - The city where the court is located
 */
interface ProcessedExpediente {
  ciudad: string;
}

/**
 * Extracts unique cities from raw case data and exports to a JSON file.
 *
 * This function performs the following steps:
 * 1. Transforms raw case data by extracting city information (JUZGADO_CIUDAD)
 * 2. Deduplicates cities using a Set to ensure each city appears only once
 * 3. Converts the deduplicated set back to an array
 * 4. Writes the results to a pretty-printed JSON file (fileName parameter)
 * 5. Logs success/error messages to the console
 *
 * The output file is saved with 2-space indentation for readability.
 *
 * @async
 * @param {RawDb[]} rawData - Array of raw database records containing case information
 * @param {string} fileName - The output filename (e.g., 'ciudades.json') within the src directory
 * @returns {Promise<void>} Promise that resolves when file writing is complete
 * @throws {Error} Logs errors to console if file writing fails
 *
 * @example
 * // Extract cities and save to file
 * await exportExpedientesToJson(RawCarpetas, 'ciudades.json');
 * // Creates: src/ciudades.json with unique city list
 */
async function exportExpedientesToJson(
  rawData: RawDb[],
  fileName: string,
): Promise<void> {
  try {
    // Step 1: Transform the data
    // We iterate over the array, convert EXPEDIENTE to string, and return the new object structure
    const outputData: ProcessedExpediente[] = rawData.map(
      (
        item
      ) => {
        return {
          ciudad: String(
            item.JUZGADO_CIUDAD
          ), // Ensures it is converted to a string
        };
      }
    );

    const setData = new Set();

    for ( const data of outputData ) {
      setData.add(
        data.ciudad
      );
    }

    // Step 2: Convert to JSON string
    // The 'null, 2' arguments make the JSON readable (pretty-printed) as requested
    const jsonContent = JSON.stringify(
      Array.from(
        setData
      ), null, 2
    );

    // Step 3: Write to file
    const filePath = join(
      __dirname, fileName
    );
    await writeFile(
      filePath, jsonContent, 'utf-8'
    );

    console.log(
      `✅ Successfully exported ${ outputData.length } records to ${ filePath }`,
    );
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
  rawCarpetas(), 'ciudades.json'
);
