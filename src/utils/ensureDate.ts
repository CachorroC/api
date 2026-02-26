export function ensureDate(
  dateInput: string | Date | null | undefined
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
  )
    .format(
      date
    );
}
