/* eslint-disable @typescript-eslint/no-unused-vars */
//!SECTION
//SECTION first step: extract the date
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
    console.log(
      incomingDate
    );

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
  console.log(
    stringifiedDate
  );
  console.log(
    `
    string date:
    ${ String(
        incomingDate
      ) }
    `,
  );

  const dateYear = incomingDate.getFullYear();
  console.log(
    dateYear
  );

  if (
    stringifiedDate === 'Invalid Date'
    || dateYear <= 2000
    || dateYear > 2200
  ) {
    console.log(
      dateYear
    );
    return null;
  }

  console.log(
    incomingDate
  );
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
