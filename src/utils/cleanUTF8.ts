/**
 * Cleans a string of invalid UTF-8 byte sequences and null bytes.
 */
export function cleanUtf8(
  str: unknown
): string {
  if ( !str ) {
    return '';
  }

  return Buffer.from(
    String(
      str
    ), 'utf8'
  )
    .toString(
      'utf8'
    )
    .normalize(
      'NFC'
    )
    .replace(
      /\0/g, ''
    ); // Strips out literal null bytes which crash Postgres
}