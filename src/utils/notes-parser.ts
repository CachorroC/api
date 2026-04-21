/**
 * @module utils/notes-parser
 * @description Utility to split concatenated notes and structure them with extracted dates.
 */

import { NoteRecord } from '../types/notas';
import { extractDatesFromText } from './extract-dates';

/**
 * Splits a concatenated note string by '//' and extracts relevant dates for each segment.
 * @param total The concatenated note string
 * @returns An array of NoteRecord objects
 */
export function parseNotes(
  total: string
): NoteRecord[] {
  if ( !total || typeof total !== 'string' ) {
    return [];
  }

  return total
    .split(
      '//'
    )
    .filter(
      segment => {
        return segment.trim().length > 0;
      }
    )
    .map(
      segment => {
        const trimmedNote = segment.trim();
        const allDates = extractDatesFromText(
          trimmedNote
        );

        return {
          note: trimmedNote,
          date: allDates.length > 0
            ? allDates[ 0 ].date
            : undefined,
          relevantDates: allDates.length >= 2
            ? allDates
            : []
        };
      }
    );
}
