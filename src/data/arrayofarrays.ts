/**
 * @module data/arrayofarrays
 * @description Alternative Excel Parser - All Sheets Export
 * 
 * Provides an alternative approach to Excel data import by exporting ALL sheets
 * as a structured array of objects. Unlike carpetas.ts which flattens all data
 * into a single array, this maintains sheet-level organization.
 * 
 * EXPORT STRUCTURE:
 * Array of sheet objects:
 * [
 *   {
 *     name: "Sheet Name",
 *     sheet: [{row1}, {row2}, ...]
 *   },
 *   {
 *     name: "Another Sheet",
 *     sheet: [{row1}, {row2}, ...]
 *   }
 * ]
 * 
 * COMPARISON WITH carpetas.ts:
 * carpetas.ts: Flattens all sheets → Single RawCarpetas[] array
 * arrayofarrays.ts: Preserves sheet structure → Array of sheet objects
 * 
 * USE CASES:
 * - When sheet names matter (case categorization via sheet name)
 * - Parallel processing of independent case groups
 * - Data validation (verify data per sheet before flattening)
 * - Reporting (generate statistics by case type/sheet)
 * 
 * IMPLEMENTATION:
 * Uses utils.sheet_to_json() without category enrichment
 * Each sheet converted as-is to JSON array
 * Writes to arrayofsheets.json for inspection/analysis
 * 
 * DIFFERENCE FROM PRODUCTION:
 * This is an exploration/analysis tool, not used in production sync
 * archetypis.ts (data/carpetas.ts) is the authoritative import
 */

import xlsx, { utils } from 'xlsx';
import * as fs from 'fs/promises';

const workbook = xlsx.readFile(
  '/home/cachorro_cami/OneDrive/bases_de_datos/general.xlsx',
  {
    cellDates: true,
  },
);

const {
  SheetNames, Sheets 
} = workbook;

const sheets = SheetNames.map(
  (
    sheetName 
  ) => {
    return {
      name : sheetName,
      sheet: utils.sheet_to_json(
        Sheets[ sheetName ] 
      ),
    };
  } 
);

fs.writeFile(
  'arrayofsheets.json', JSON.stringify(
    sheets 
  ) 
);
