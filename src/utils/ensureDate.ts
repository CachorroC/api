
export function ensureDate( dateInput: string | Date | null | undefined ): Date | null {
  if ( !dateInput ) {
    return null;
  }

  // If it's already a Date object, just check validity
  if ( dateInput instanceof Date ) {
    return isNaN( dateInput.getTime() )
      ? null
      : dateInput;
  }

  // If it is a string, we need to ensure it's treated as Colombia Time (-05:00)
  // unless it already has timezone information.
  let dateString = dateInput;

  // Check if the string already ends in Z or an offset (e.g., -05:00)
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test( dateString );

  if ( !hasTimezone ) {
    // If the string is just "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss",
    // appending "-05:00" tells the Date constructor: "This is 5 hours behind UTC".
    // Example: "2025-02-09T00:00:00" becomes "2025-02-09T00:00:00-05:00"
    // Which converts to: 2025-02-09 05:00:00 UTC (Correct for DB storage)
    dateString = `${ dateString }-05:00`;
  }

  const d = new Date( dateString );

  return isNaN( d.getTime() )
    ? null
    : d;
}