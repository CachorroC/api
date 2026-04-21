
/**
 * Extracts a date from a string segment.
 * Supports:
 * - DD/MM/YYYY or DD-MM-YYYY
 * - D DE MES DE YYYY (Natural Spanish)
 * - D MES YYYY
 * - Handles typos like 2.018 for 2018
 */
export function extractDate(
  text: string
): Date | null {
  // 1. Try numeric formats: DD/MM/YYYY or DD-MM-YYYY
  const numericRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|2\.\d{3})/g;
  let match = numericRegex.exec(
    text
  );

  if ( match ) {
    const day = parseInt(
      match[ 1 ], 10
    );
    const month = parseInt(
      match[ 2 ], 10
    ) - 1;
    const yearStr = match[ 3 ].replace(
      '.', ''
    );
    const year = parseInt(
      yearStr, 10
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

  // 2. Try natural language formats
  const monthsStr = Object.keys(
    MONTH_MAP
  ).join(
    '|'
  );
  const naturalRegex = new RegExp(
    `(\\d{1,2})\\s+(?:DE\\s+)?(${ monthsStr })\\s*(?:DE\\s+)?(\\d{4}|2\\.\\d{3})?`,
    'i'
  );

  match = naturalRegex.exec(
    text
  );

  if ( match ) {
    const day = parseInt(
      match[ 1 ], 10
    );
    const monthName = match[ 2 ].toUpperCase();
    const month = MONTH_MAP[ monthName ];
    let year = new Date().getFullYear(); // Default to current year if missing

    if ( match[ 3 ] ) {
      const yearStr = match[ 3 ].replace(
        '.', ''
      );
      year = parseInt(
        yearStr, 10
      );
    }

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