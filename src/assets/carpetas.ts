/**
 * @module data/carpetas
 * @description Raw Case Folder Import from Excel Workbook
 *
 * Reads Excel workbook from OneDrive and transforms each worksheet into
 * structured JSON records representing raw case folder data before model transformation.
 *
 * DATA PIPELINE:
 * Excel File (.xlsx)
 *   ↓
 * xlsx.readFile() with cellDates: true (preserves date formatting)
 *   ↓
 * flatMap across SheetNames
 *   ↓
 * sheet_to_json<RawDb>() for each sheet
 *   ↓
 * Add category field (from sheet name)
 *   ↓
 * Accumulate into RawCarpetas[] array
 *
 * SHEET STRUCTURE:
 * Each worksheet represents a case category (e.g., \"Pequeñas Causas\", \"Ordinario\")
 * All sheets must have identical columns matching RawDb interface
 * Rows become individual RawDb records, enriched with category metadata
 *
 * EXCEL SOURCE:
 * Hardcoded path: /home/cachorro_cami/OneDrive/bases_de_datos/general.xlsx
 * Format: Excel 2007+ (.xlsx with native date cell type handling)
 * Current behavior: cellDates: true preserves Excel date formatting
 *
 * OUTPUT:
 * RawCarpetas: Exported array of RawDb records with category field
 * - Used by ClassCarpeta constructor (model instantiation)
 * - Consumed by procesos.ts and procesos_from_name.ts entry points
 * - Contains raw, unvalidated data (validation occurs at model layer)
 *
 * DATA TRANSFORMATION:
 * - All columns converted to object properties per RawDb interface
 * - Column names must match Excel headers exactly
 * - Data types remain as strings/numbers from Excel conversion
 * - Null/undefined values preserved from source
 * - Category field added from SheetName for type/workflow tracking
 */

import xlsx from 'xlsx';
import { Category } from '../types/carpetas.js';
import * as fs from 'fs/promises';
import { RawDb } from '../types/raw-db.js';

const workbook = xlsx.readFile(
  '/home/cachorro_cami/OneDrive/bases_de_datos/general.xlsx',
  {
    cellDates: true,
  },
);

const {
  SheetNames, Sheets 
} = workbook;

const outputSheets: unknown[] = [];

const mapperSheets = SheetNames.flatMap(
  (
    sheetname 
  ) => {
    const sheet = Sheets[ sheetname ];

    const tableSheet = xlsx.utils.sheet_to_json<RawDb>(
      sheet 
    );

    outputSheets.push(
      tableSheet 
    );

    return tableSheet.map(
      (
        table 
      ) => {
        return {
          ...table,
          category: sheetname.replaceAll(
            ' ', '' 
          ) as Category,
        };
      } 
    );
  } 
);

fs.writeFile(
  'outputSheets.json', JSON.stringify(
    outputSheets 
  ) 
);

export const RawCarpetas = [
  ...mapperSheets
].sort(
  (
    a, b 
  ) => {
    const x = a.NUMERO;

    const y = b.NUMERO;

    if ( x < y ) {
      return -1;
    } else if ( x > y ) {
      return 1;
    }

    return 0;
  } 
);

fs.writeFile(
  'carpetas.json', JSON.stringify(
    RawCarpetas, null, 2 
  ) 
);

const outputData: string[] = [];

RawCarpetas.forEach(
  (
    carpeta, index 
  ) => {
    const newString = `${
      Number(
        carpeta.NUMERO 
      ) === index + 1
    } numero: ${ carpeta.NUMERO }, index:${ index + 1 } `;

    console.log(
      newString 
    );
    outputData.push(
      newString 
    );
  } 
);
fs.writeFile(
  'numbers.json', JSON.stringify(
    outputData, null, 2 
  ) 
);
