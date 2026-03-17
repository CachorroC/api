/**
 * Sanitizes and normalizes a string for safe database insertion and consistent processing.
 *
 * This function performs the following operations:
 * 1. Handles `null` or `undefined` inputs by returning an empty string.
 * 2. Forces runtime string coercion to prevent crashes from unexpected API data types.
 * 3. Uses native `.toWellFormed()` to convert malformed UTF-16 surrogates into `\uFFFD`.
 * 4. Removes Null bytes (`\u0000`) and unprintable ASCII control chars in a single sweep
 * (while explicitly preserving \t, \n, and \r).
 * 5. Removes the Unicode replacement character (`\uFFFD`) to clean up mojibake and fixed surrogates.
 * 6. Normalizes Unicode strings to Canonical Composition (NFC).
 * 7. Trims leading and trailing whitespace.
 *
 * @param {string | null | undefined} str - The input string to sanitize. Can be null or undefined.
 * @returns {string} The sanitized, normalized, and trimmed string. Returns an empty string if input is falsy.
 */
export function sanitizeText(
  str: string | null | undefined
): string {
  // 1. Handle null/undefined
  if ( str === null || str === undefined ) {
    return '';
  }

  // 2. Force runtime string coercion (protects against accidental numbers/booleans from API)
  let text = String(
    str 
  );

  // 3. Guarantee valid UTF-16 (fixes the "invalid byte sequence for encoding UTF8" error)
  // toWellFormed() natively replaces unpaired surrogates with the replacement character (\uFFFD).
  if ( typeof text.toWellFormed === 'function' ) {
    text = text.toWellFormed();
  } else {
    // Fallback regex for Node versions < 20
    text = text.replace(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
      '\uFFFD'
    );
  }

  return (
    text
      // 4. Remove Null bytes (\u0000) AND unprintable ASCII control chars in one sweep
      // (Keeps \t, \n, \r which correspond to \u0009, \u000A, \u000D)
      .replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '' 
      )

      // 5. Remove the Unicode replacement character (cleans up mojibake and the surrogates we just fixed)
      .replace(
        /\uFFFD/g, '' 
      )

      // 6. Normalize Unicode to Canonical Composition (fixes separated diacritics like ó)
      .normalize(
        'NFC' 
      )

      // 7. Trim leading and trailing whitespace
      .trim()
  );
}