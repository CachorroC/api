/**
 * Validates a date string and checks if it falls within the last 7 days.
 * * @param dateString - The stringified date to evaluate.
 * @returns True if valid and within the last 7 days, false otherwise.
 */
export function isWithinLastSevenDays(
  dateString: string 
): boolean {
  // 1. Create the Date object
  const parsedDate = new Date(
    dateString 
  );

  // 2. Validate that it is a valid date
  // isNaN checks if the parsed time is "Not a Number" (which happens for invalid dates)
  if ( isNaN(
    parsedDate.getTime() 
  ) ) {
    return false;
  }

  // 3. Review if it was within the last 7 days
  const now = new Date();
  const timeDifferenceInMilliseconds = now.getTime() - parsedDate.getTime();

  // Convert milliseconds to days (1000ms * 60s * 60m * 24h)
  const daysDifference = timeDifferenceInMilliseconds / ( 1000 * 60 * 60 * 24 );

  // Return true if the date is in the past (>= 0) and not older than 7 days (<= 7)
  return daysDifference >= 0 && daysDifference <= 7;
}
