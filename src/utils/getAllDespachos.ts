/**
 * @module utils/getAllDespachos
 * @description Court Registry Export Utility
 *
 * Fetches all unique court identifiers (despachos) from database and exports
 * to JSON file for audit, analysis, or reference purposes. Uses deduplication
 * to maintain a clean list of all courts referenced in the case system.
 *
 * EXECUTION WORKFLOW:
 * Query database: client.proceso.findMany()
 *   ↓
 * Extract despacho field from each proceso
 *   ↓
 * Add to Set (automatic deduplication)
 *   ↓
 * Call saveDespachos(Set)
 *   ↓
 * Create ./logs directory if missing
 *   ↓
 * Convert Set to Array and write to allDespachos.json
 *
 * OUTPUT FILE:
 * Location: ./logs/allDespachos.json
 * Format: JSON array of unique despacho strings
 * Example: ["JUZGADO EJE MERCANTIL DE BOGOTÁ", "JUZGADO LABORAL DE MEDELLÍN", ...]
 *
 * USE CASES:
 * - Audit: Verify court coverage in case database
 * - Analysis: Understand court distribution across cases
 * - Reference: Cross-check with official court directories
 * - Import: Seed new despacho tables or lookup systems
 *
 * SET DEDUPLICATION:
 * Set automatically maintains unique values
 * No duplicate despachos in output JSON
 * Efficient for large court lists
 */

import { client } from '../services/connection/prisma';

/**
 * @async
 * @function getAllDespachos
 * @description Retrieves all unique court identifiers from database processes.
 * Fetches all proceso records, extracts despacho field, deduplicates,
 * and exports as JSON array.
 *
 * @returns {Promise<string[]>} Array of unique despacho identifiers
 *
 * @example
 * const courts = await getAllDespachos();
 * console.log(`Found ${courts.length} unique courts`);
 */
async function getAllDespachos() {
  const procesos = await client.proceso.findMany();
  const despachosSet = new Set<string>(
    procesos.map(
      (
        p
      ) => {
        return p.despacho;
      }
    ),
  );
  saveDespachos(
    despachosSet
  );

  return Array.from(
    despachosSet
  );
}

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * @async
 * @function saveDespachos
 * @description Writes unique despacho list to JSON file with directory creation.
 *
 * File Operations:
 * 1. mkdir({ recursive: true }): Creates ./logs if missing (no error if exists)
 * 2. Set → Array conversion: [...dataStream] spreads Set values
 * 3. JSON.stringify with 2-space indentation for readability
 * 4. Write to logs/allDespachos.json with UTF-8 encoding
 * 5. Log success message to console
 *
 * @param {Set<string>} dataStream - Set of unique despacho strings
 * @returns {Promise<void>} Resolves when file written successfully
 * @throws {Error} If file write fails (logged to console, not thrown)
 *
 * @example
 * const despachosSet = new Set(['JUZGADO A', 'JUZGADO B']);
 * await saveDespachos(despachosSet);
 * // Creates ./logs/allDespachos.json
 */
async function saveDespachos(
  dataStream: Set<string>
) {
  const dirPath = './logs';
  const filePath = join(
    dirPath, 'allDespachos.json'
  );

  try {
    // 1. Ensure the directory exists
    // 'recursive: true' prevents errors if the folder already exists
    await mkdir(
      dirPath, {
        recursive: true,
      }
    );

    // 2. Convert Set to Array and stringify
    // We spread the set into an array [...] so JSON.stringify can read it
    const jsonContent = JSON.stringify(
      [
        ...dataStream
      ], null, 2
    );

    // 3. Write the file
    await writeFile(
      filePath, jsonContent, 'utf-8'
    );

    console.log(
      `File successfully written to ${ filePath }`
    );
  } catch ( error ) {
    console.error(
      'Error handling file operations:', error
    );
  }
}

getAllDespachos();
