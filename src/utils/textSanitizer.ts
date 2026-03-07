/**
 * Sanitizes and normalizes a string for safe database insertion and consistent processing.
 *
 * This function performs the following operations:
 * 1. Handles `null` or `undefined` inputs by returning an empty string.
 * 2. Removes null bytes (`\x00`) which are strictly forbidden in PostgreSQL text fields.
 * 3. Removes unpaired surrogates (malformed UTF-16) that cause UTF-8 serialization crashes.
 * 4. Removes unprintable ASCII control characters (range \x01-\x1F, \x7F) while preserving
 * essential formatting characters like newlines (`\n`, `\r`) and tabs (`\t`).
 * 5. Removes the Unicode replacement character (`\uFFFD`) often resulting from encoding errors.
 * 6. Normalizes Unicode strings to Canonical Composition (NFC) form to ensure consistent
 * representation of characters (e.g., combining diacritics).
 * 7. Trims leading and trailing whitespace.
 *
 * @param {string | null | undefined} str - The input string to sanitize. Can be null or undefined.
 * @returns {string} The sanitized, normalized, and trimmed string. Returns an empty string if input is falsy.
 */
export function sanitizeText(
  str: string | null | undefined
): string {
  if ( !str ) {
    return '';
  }

  return (
    str
      // 1. Remove null bytes (\x00) which Postgres strictly forbids
      .replace(
        /\0/g, ''
      )
      // 2. Remove unpaired surrogates (fixes the "invalid byte sequence for encoding UTF8" error)
      .replace(
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, ''
      )
      // 3. Remove unprintable ASCII control characters (keeps newlines and tabs)
      .replace(
        /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''
      )
      // 4. Remove the Unicode replacement character (mojibake cleanup)
      .replace(
        /\uFFFD/g, ''
      )
      // 5. Normalize Unicode to Canonical Composition (fixes separated diacritics)
      .normalize(
        'NFC'
      )
      .trim()
  );
}