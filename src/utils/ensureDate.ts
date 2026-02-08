export function ensureDate(
  dateInput: string | Date | null | undefined
): Date | null {
  if ( !dateInput ) {
    return null;
  }

  const d = new Date(
    dateInput
  );

  return isNaN(
    d.getTime()
  )
    ? null
    : d;
}