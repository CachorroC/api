import { DateContext } from '../types/notas';

export const MONTH_MAP: Record<string, number> = {
  // Standard months
  'ENERO'     : 0,
  'FEBRERO'   : 1,
  'MARZO'     : 2,
  'ABRIL'     : 3,
  'MAYO'      : 4,
  'JUNIO'     : 5,
  'JULIO'     : 6,
  'AGOSTO'    : 7,
  'SEPTIEMBRE': 8,
  'OCTUBRE'   : 9,
  'NOVIEMBRE' : 10,
  'DICIEMBRE' : 11,

  // Abbreviations
  'ENE' : 0,
  'FEB' : 1,
  'FEBR': 1,
  'MAR' : 2,
  'ABR' : 3,
  'MAY' : 4,
  'JUN' : 5,
  'JUL' : 6,
  'AGO' : 7,
  'SEP' : 8,
  'SEPT': 8,
  'OCT' : 9,
  'NOV' : 10,
  'NOVI': 10,
  'DIC' : 11,

  // Typos and variations found in data
  'ENRO'     : 0,
  'NERO'     : 0,
  'FEEBRERO' : 1,
  'AGOSO'    : 7,
  'AGOSOTO'  : 7,
  'SETIEMBRE': 8,
  'DICEMEBRE': 11,
};

/**
 * Extracts all dates from a text segment along with their context.
 * Supports:
 * - Numeric (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
 * - Natural Spanish (D [DE] MES [DE] YYYY)
 * - Inverse Natural Spanish (MES D [DE] YYYY)
 * @param text The text segment to analyze
 * @returns An array of DateContext objects
 */
export function extractDatesFromText(
  text: string
): DateContext[] {
  const results: DateContext[] = [];

  if ( !text ) {
    return results;
  }

  const monthsStr = Object.keys(
    MONTH_MAP
  ).sort(
    (
      a, b
    ) => {
      return b.length - a.length;
    }
  ).join(
    '|'
  );

  // Combined Regex for multiple formats
  const dateRegex = new RegExp(
    '('
      + '(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{4}|2\\.\\d{3}|\\d{2})' // 2, 3, 4: DD/MM/YYYY
      + '|'
      + `(\\d{1,2})\\s+(?:DE\\s+)?(${ monthsStr })\\s*(?:DE\\s+)?(\\d{4}|2\\.\\d{3}|\\d{2})?` // 5, 6, 7: DD MONTH YYYY
      + '|'
      + `(${ monthsStr })\\s+(\\d{1,2})\\s*(?:DE\\s+)?(\\d{4}|2\\.\\d{3}|\\d{2})?` // 8, 9, 10: MONTH DD YYYY
    + ')',
    'gi'
  );

  let match;
  const currentYear = new Date().getFullYear();
  const matches: { start: number; end: number; date: Date }[] = [];

  while ( ( match = dateRegex.exec(
    text
  ) ) !== null ) {
    let day: number, month: number, year: number;

    if ( match[ 2 ] ) {
      // Numeric match
      day = parseInt(
        match[ 2 ], 10
      );
      month = parseInt(
        match[ 3 ], 10
      ) - 1;
      const yearStr = match[ 4 ].replace(
        '.', ''
      );
      year = parseInt(
        yearStr, 10
      );

      if ( yearStr.length === 2 ) {
        year += year < 50
          ? 2000
          : 1900;
      }
    } else if ( match[ 5 ] ) {
      // Natural language match (Day first)
      day = parseInt(
        match[ 5 ], 10
      );
      const monthName = match[ 6 ].toUpperCase();
      month = MONTH_MAP[ monthName ];
      const yearStr = match[ 7 ]?.replace(
        '.', ''
      );

      if ( yearStr ) {
        year = parseInt(
          yearStr, 10
        );

        if ( yearStr.length === 2 ) {
          year += year < 50
            ? 2000
            : 1900;
        }
      } else {
        year = currentYear;
      }
    } else {
      // Natural language match (Month first)
      const monthName = match[ 8 ].toUpperCase();
      month = MONTH_MAP[ monthName ];
      day = parseInt(
        match[ 9 ], 10
      );
      const yearStr = match[ 10 ]?.replace(
        '.', ''
      );

      if ( yearStr ) {
        year = parseInt(
          yearStr, 10
        );

        if ( yearStr.length === 2 ) {
          year += year < 50
            ? 2000
            : 1900;
        }
      } else {
        year = currentYear;
      }
    }

    const date = new Date(
      year, month, day
    );

    if ( !isNaN(
      date.getTime()
    ) ) {
      matches.push(
        {
          start: match.index,
          end  : match.index + match[ 0 ].length,
          date
        }
      );
    }
  }

  for ( let i = 0; i < matches.length; i++ ) {
    const nextMatchStart = matches[ i + 1 ]
      ? matches[ i + 1 ].start
      : text.length;
    const contextText = matches.length === 1
      ? text.trim()
      : text.substring(
          i === 0
            ? 0
            : matches[ i - 1 ].end, nextMatchStart
        ).trim();

    results.push(
      {
        date: matches[ i ].date,
        text: contextText || matches[ i ].date.toLocaleDateString()
      }
    );
  }

  return results;
}
