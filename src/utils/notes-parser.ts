/**
 * @module utils/notes-parser
 * @description Utility to split concatenated notes and extract relevant dates.
 */

export const MONTH_MAP: Record<string, number> = {
  'ENERO': 0,
  'ENRO': 0, // Handling typo found in data
  'NERO': 0, // Handling another typo found in data (17 DE NERO)
  'FEBRERO': 1,
  'MARZO': 2,
  'ABRIL': 3,
  'MAYO': 4,
  'JUNIO': 5,
  'JULIO': 6,
  'AGOSTO': 7,
  'SEPTIEMBRE': 8,
  'OCTUBRE': 9,
  'NOVIEMBRE': 10,
  'DICIEMBRE': 11,
};

export interface NoteRecord {
  note: string;
  relevantDate?: Date;
}

/**
 * Extracts a date from a text segment.
 * Supports numeric (DD/MM/YYYY) and natural Spanish language (D de Mes de YYYY).
 * @param text The text segment to analyze
 * @returns A Date object if found, otherwise null
 */
export function extractDateFromText(
  text: string 
): Date | null {
  // 1. Try numeric formats: DD/MM/YYYY or DD-MM-YYYY
  // Handles typos like 2.018 for 2018
  const numericRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|2\.\d{3})/;

  const numMatch = numericRegex.exec(
    text 
  );

  if ( numMatch ) {
    const day = parseInt(
      numMatch[ 1 ], 10 
    );

    const month = parseInt(
      numMatch[ 2 ], 10 
    ) - 1;

    const year = parseInt(
      numMatch[ 3 ].replace(
        '.', '' 
      ), 10 
    );

    const date = new Date(
      year, month, day 
    );

    if ( !isNaN(
      date.getTime() 
    ) ) {
      return date;
    }
  }

  // 2. Try natural language formats: D DE MES DE YYYY or D MES YYYY
  const monthsStr = Object.keys(
    MONTH_MAP 
  ).join(
    '|' 
  );

  const naturalRegex = new RegExp(
    `(\\d{1,2})\\s+(?:DE\\s+)?(${ monthsStr })\\s*(?:DE\\s+)?(\\d{4}|2\\.\\d{3})?`,
    'i'
  );

  const natMatch = naturalRegex.exec(
    text 
  );

  if ( natMatch ) {
    const day = parseInt(
      natMatch[ 1 ], 10 
    );

    const monthName = natMatch[ 2 ].toUpperCase();

    const month = MONTH_MAP[ monthName ];

    const yearStr = natMatch[ 3 ]?.replace(
      '.', '' 
    );

    const year = yearStr
      ? parseInt(
        yearStr, 10 
      )
      : new Date().getFullYear();

    const date = new Date(
      year, month, day 
    );

    if ( !isNaN(
      date.getTime() 
    ) ) {
      return date;
    }
  }

  return null;
}

/**
 * Splits a concatenated note string by '//' and extracts relevant dates for each segment.
 * @param total The concatenated note string
 * @returns An array of NoteRecord objects
 */
export function parseNotes(
  total: string 
): NoteRecord[] {
  if ( !total || typeof total !== 'string' ) {
    return [];
  }

  return total
    .split(
      '//' 
    )
    .map(
      (
        segment 
      ) => {
        const trimmedNote = segment.trim();

        const relevantDate = extractDateFromText(
          trimmedNote 
        );

        const result: NoteRecord = {
          note: trimmedNote,
        };

        if ( relevantDate ) {
          result.relevantDate = relevantDate;
        }

        return result;
      } 
    );
}
