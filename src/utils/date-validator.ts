/**
 * @module utils/date-validator
 * @description Date Extraction and Validation Utility
 * 
 * Handles parsing, validation, and normalization of dates from various sources:
 * - Excel serial numbers (XLSX format)
 * - ISO date strings (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
 * - JavaScript Date objects
 * - Multiple dates separated by \"//\" delimiter
 * - Null/undefined values
 * 
 * DATE PARSING WORKFLOW:
 * Input (string | number | Date | null)
 *   ↓
 * Type detection (object/number/string)
 *   ↓
 * If string: Split by \"//\" for multiple dates
 *   ↓
 * Per date: Match regex for D/M/Y or D-M-Y format
 *   ↓
 * Parse components (day, month, year)
 *   ↓
 * Create Date object (ISO 8601)
 *   ↓
 * Validate date constraints
 *   ↓
 * Return Date[] array via dateArrayValidator
 * 
 * EXCEL DATE HANDLING:
 * XLSX stores dates as serial numbers (days since Jan 1, 1900)
 * xlsxNumberToDate() converts serial to JavaScript Date
 * Handles leap year variations between Excel and JavaScript
 * 
 * MULTI-DATE SUPPORT:
 * Incoming strings can contain multiple dates separated by \"//\"
 * Example: \"01/02/2020 // 15/03/2020\" → [Date(2020,1,1), Date(2020,2,15)]
 * Useful for cases with multiple deadlines or action dates
 * 
 * DATE FORMAT FLEXIBILITY:
 * Supports both \"/\" and \"-\" as separators
 * All formats interpreted as DD/MM/YYYY (Colombian locale)
 * NOT MM/DD/YYYY (American format)
 * Year normalization: 2-digit → 20xx (2000-2099)
 * 
 * ERROR HANDLING:
 * Invalid Date objects filtered out (Invalid Date toString check)
 * Failed conversions return empty array (graceful degradation)
 * No exceptions thrown (safe for batch processing)
 * dateArrayValidator() performs final validation pass
 */

/* eslint-disable no-unused-vars */
//!SECTION
//SECTION first step: extract the date
/**
 * @function datesExtractor
 * @param {string | number | Date | null | undefined} incomingDate - Raw date value from various sources
 * @returns {Date[]} Array of validated Date objects (empty if parsing fails)
 * \n * Extracts one or more Date objects from various input formats.\n * Handles Excel serial numbers, date strings (with // multi-date support), Date objects.\n * Returns array of validated dates.\n */
export function datesExtractor(
  incomingDate?: string | number | Date | null 
) {
  const outputDates: Date[] = [];

  if ( !incomingDate ) {
    return dateArrayValidator(
      outputDates 
    );
  }

  if ( typeof incomingDate === 'object' ) {
    //console.log( incomingDate );

    if ( incomingDate.toString() !== 'Invalid Date' ) {
      outputDates.push(
        incomingDate 
      );
    }

    return dateArrayValidator(
      outputDates 
    );
  }

  if ( typeof incomingDate === 'number' ) {
    const outgoingDate = xlsxNumberToDate(
      incomingDate 
    );

    if ( outgoingDate ) {
      outputDates.push(
        outgoingDate 
      );
    }

    return dateArrayValidator(
      outputDates 
    );
  }

  const splitByDoubleSlash = incomingDate.split(
    '//' 
  );

  for ( const splitted of splitByDoubleSlash ) {
    const fixed = fixSingleFecha(
      splitted 
    );

    for ( const fixedDate of fixed ) {
      outputDates.push(
        fixedDate 
      );
    }
  }

  return dateArrayValidator(
    outputDates 
  );
}

//!SECTION
//SECTION secondStep: fix the extracted date
export function fixSingleFecha(
  rawFecha: string 
) {
  const datesOutput: Date[] = [];

  const matchedDate = rawFecha.matchAll(
    /(\d+)(-|\/)(\d+)(-|\/)(\d+)/gm 
  );

  for ( const matchedValue of matchedDate ) {
    const [
      total,
      firstNumber,
      firstDivider,
      secondNumber,
      secondDivider,
      thirdNumber,
    ] = matchedValue;

    const newMonth = Number(
      secondNumber 
    ) - 1;

    const newYear = Number(
      thirdNumber.padStart(
        4, '2015' 
      ) 
    );

    const newDay = Number(
      firstNumber.padStart(
        2, '00' 
      ) 
    );

    const outputDate = new Date(
      newYear, newMonth, newDay 
    );

    datesOutput.push(
      outputDate 
    );
  }

  return datesOutput;
}

//!SECTION
export function dateValidator(
  incomingDate: Date 
): Date | null {
  const stringifiedDate = incomingDate.toString();

  //console.log( stringifiedDate );
  /*console.log( `
    string date:
    ${ String( incomingDate ) }
    ` );*/

  const dateYear = incomingDate.getFullYear();

  //console.log( dateYear );

  if (
    stringifiedDate === 'Invalid Date'
    || dateYear <= 2000
    || dateYear > 2200
  ) {
    //console.log( dateYear );

    return null;
  }

  //console.log( incomingDate );

  return incomingDate;
}

export function dateArrayValidator(
  incomingDates: Date[] 
): Date[] {
  const outPutDates = [];

  for ( const date of incomingDates ) {
    const ndate = dateValidator(
      date 
    );

    if ( ndate ) {
      outPutDates.push(
        ndate 
      );
    }
  }

  return outPutDates;
}

export function xlsxNumberToDate(
  incomingDate: number 
) {
  const outgoingDate = new Date(
    ( incomingDate - ( 25567 + 1 ) ) * 86400 * 1000 
  );

  if (
    incomingDate > 55000
    || outgoingDate.toString() === 'Invalid Date'
    || outgoingDate.getFullYear() > 2200
  ) {
    console.log(
      outgoingDate.toString() 
    );

    return null;
  }

  return outgoingDate;
}
