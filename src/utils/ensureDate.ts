/**
 * @fileoverview Date/Time Utilities for Colombian Judicial System
 *
 * This module provides robust date handling for an international system
 * serving Colombian courts. Key challenges:
 * - USA/international systems often return dates without timezone info
 * - Colombian timezone is UTC-5 (always, no DST)
 * - Legacy data may have malformed date fields
 * - Need consistent formatting for logging and display
 *
 * Features:
 * - Safe date parsing with intelligent timezone handling
 * - Colombian timezone (America/Bogota) enforcement
 * - Graceful fallback to null for invalid dates
 * - Pretty-printing for human-readable logs
 *
 * @module ensureDate
 */

/**
 * Safely parses a date input and returns a valid Date object or null.
 *
 * This function handles multiple date input formats and adds timezone context
 * that's often missing from API responses:
 *
 * **Input Handling:**
 * | Input Type | Example | Action |
 * |-----------|---------|--------|
 * | null/undefined | - | Returns null |
 * | Date object | new Date() | Validates and returns (or null if invalid) |
 * | Date-only string | "2026-02-16" | Adds "T00:00:00-05:00" for midnight Colombia time |
 * | ISO DateTime | "2026-02-16T14:30:00" | Adds "-05:00" for Colombia timezone |
 * | ISO with TZ | "2026-02-16T14:30:00Z" | Uses as-is |
 *
 * **Timezone Handling:**
 * - Colombian courts operate in UTC-5 (no daylight saving time)
 * - Assumes all unqualified times are Colombia timezone
 * - Converts timezone-aware strings correctly
 * - Example: "2026-02-16" → "2026-02-16T00:00:00-05:00"
 *
 * **Error Handling:**
 * - Invalid dates return null (not thrown)
 * - Malformed strings return null
 * - Parsing errors are swallowed gracefully
 *
 * **Why This Matters:**
 * Government APIs often omit timezone info, assuming local context.
 * This causes:
 * - Date comparison errors (treating UTC as Colombia time)
 * - Off-by-day bugs when processing late evening actions
 * - Confusion in international log files
 *
 * This function fixes these issues transparently.
 *
 * @param {string | Date | null | undefined} dateInput - The date to parse.
 *                                                       Can be:
 *                                                       - Date object
 *                                                       - ISO date string
 *                                                       - Date-only string
 *                                                       - null/undefined
 * @returns {Date | null} Validated Date object, or null if invalid/missing.
 *                        All valid dates are interpreted as Colombia time.
 *
 * @example
 * // Date-only string → midnight Colombia time
 * const d1 = ensureDate("2026-02-16");
 * // Returns: 2026-02-16T00:00:00-05:00
 *
 * @example
 * // Missing timezone → assumes Colombia
 * const d2 = ensureDate("2026-02-16T14:30:00");
 * // Returns: 2026-02-16T14:30:00-05:00
 *
 * @example
 * // Already has timezone → uses as-is
 * const d3 = ensureDate("2026-02-16T14:30:00Z");
 * // Returns: 2026-02-16T14:30:00Z (UTC)
 *
 * @example
 * // Invalid/nullish inputs
 * ensureDate(null); // → null
 * ensureDate(""); // → null
 * ensureDate(new Date("invalid")); // → null
 */
export function ensureDate(
  dateInput: string | Date | null | undefined,
): Date | null {
  if ( !dateInput ) {
    return null;
  } // If it's already a Date object, just check validity

  if ( dateInput instanceof Date ) {
    return isNaN(
      dateInput.getTime() 
    )
      ? null
      : dateInput;
  }

  let dateString = dateInput.trim();

  // 1. Handle Date-Only strings (e.g., "2026-02-16")
  // Safely append the time component AND the Colombia timezone offset
  if ( /^\d{4}-\d{2}-\d{2}$/.test(
    dateString 
  ) ) {
    dateString = `${ dateString }T00:00:00-05:00`;
    // eslint-disable-next-line brace-style
  }
  // 2. Handle Date-Time strings missing a timezone (e.g., "2026-02-16T14:30:00")
  else if ( !/(Z|[+-]\d{2}:?\d{2})$/.test(
    dateString 
  ) ) {
    dateString = `${ dateString }-05:00`;
  }

  const d = new Date(
    dateString 
  );

  return isNaN(
    d.getTime() 
  )
    ? null
    : d;
}

/**
 * Formats a Date object as a human-readable string in Colombian locale and timezone.
 *
 * Provides a consistent, locale-aware representation of dates for logging and display.
 * Example output: "lunes, 16 de febrero de 2026, 14:30:45 COT"
 *
 * **Key Features:**
 * - **Locale**: Spanish (Colombian) formatting rules
 * - **Timezone**: Always America/Bogota (UTC-5, no DST)
 * - **Format**: Full date+time with day of week and timezone abbreviation
 * - **Purpose**: Human-readable logs, not system timestamps
 *
 * **Why Lock to Colombia Time?**
 * - Server runs in different timezone (not Colombia)
 * - Docker containers may have UTC timezone
 * - This function always converts to Colombian time for consistency
 * - Prevents confusion in log files: "February 16" vs "16 de febrero"
 *
 * **Format Details:**
 * - Weekday: Spanish (lunes, martes, miércoles, etc)
 * - Calendar: Full date (16 de febrero de 2026)
 * - Time: 24-hour format (14:30:45)
 * - Timezone: 3-letter abbreviation (COT = Colombiano Time)
 *
 * @param {Date} date - The Date object to format
 * @returns {string} Human-readable representation with Colombian locale and timezone
 *
 * @example
 * const logDate = formatDateToString(new Date('2026-02-16T14:30:45Z'));
 * // Output: "lunes, 16 de febrero de 2026, 14:30:45 COT"
 *
 * @example
 * // Used in logs for clarity
 * console.log(`Sync started at ${formatDateToString(new Date())}`);
 * // Output: "Sync started at lunes, 4 de marzo de 2026, 10:15:30 COT"
 */
export function formatDateToString(
  date: Date 
) {
  return new Intl.DateTimeFormat(
    'es-CO', {
      timeZone    : 'America/Bogota', // 🔒 LOCK to Colombia time, ignoring server/Docker defaults
      weekday     : 'long',
      year        : 'numeric',
      month       : 'long',
      day         : 'numeric',
      hour        : 'numeric',
      minute      : 'numeric',
      second      : 'numeric',
      timeZoneName: 'short',
    } 
  ).format(
    date 
  );
}
