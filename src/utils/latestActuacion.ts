/**
 * @module utils/latestActuacion
 * @description Latest Judicial Action Selection by Date
 * 
 * Finds the most recent legal action from a list using chronological sorting.
 * Implements fallback logic: if dates match, uses registration date; if those match,
 * uses sequence number (consActuacion) for final tiebreaker.
 * 
 * SORTING PRIORITY (descending order):
 * 1. fechaActuacion (action date) - Primary sort key
 * 2. fechaRegistro (registration date) - Tiebreaker if dates equal
 * 3. consActuacion (sequence number) - Final tiebreaker if both dates equal
 * 
 * USE CASE EXAMPLE:
 * Multiple actuaciones on same action date (e.g., same trial day)
 * → Use registration date (when entered into system)
 * If still tied → Use sequence number (order received)
 * 
 * COMPARISON WITH search-last-actuacion:
 * search-last-actuacion: Filters out irrelevant types, sorts by relevance + sequence
 * latestActuacion: Pure chronological sorting, no type filtering
 * Result: These may return different "latest" action depending on filtering
 * 
 * USAGE:
 * Used by ActuacionService to set carpeta.ultimaActuacion
 * Provides purely date-based latest action (ignores procedural status)
 */

import { DatabaseActuacionType,
  FetchResponseActuacionType, } from '../types/actuaciones.js';
import { ensureDate } from './ensureDate.js';

/**
 * @function getLatestByDate
 * @description Finds most recent action using date-based sorting with multiple tiebreakers.
 * 
 * ALGORITHM:
 * 1. Check for empty array → return null
 * 2. Use reduce() to iterate through array
 * 3. For each item:
 *    a. Extract and normalize dates via ensureDate()
 *    b. Convert to milliseconds (getTime())
 *    c. Default to 0 if date invalid (nullish coalescing)
 * 4. Compare current vs previous:
 *    a. If current action date > previous → current wins
 *    b. If dates tied → Compare registration dates
 *    c. If registration tied → Compare consActuacion (string comparison)
 * 
 * @param {(FetchResponseActuacionType | DatabaseActuacionType)[]} actuaciones - List of legal actions
 * @returns {(FetchResponseActuacionType | DatabaseActuacionType | null)} Most recent action, or null if empty
 * 
 * @example
 * const actions = [
 *   {fechaActuacion: '2026-02-01', fechaRegistro: '2026-02-02', consActuacion: '1'},
 *   {fechaActuacion: '2026-03-01', fechaRegistro: '2026-03-01', consActuacion: '2'}
 * ];
 * const latest = getLatestByDate(actions);
 * // Returns the March 1st action (most recent)
 * 
 * @note Uses ensureDate() to safely parse various date formats
 * @note Defaults to 0 ms (Jan 1, 1970) for null/invalid dates
 * @note String comparison for consActuacion (lexicographic, not numeric)
 */
export function getLatestByDate(
  actuaciones: FetchResponseActuacionType[] | DatabaseActuacionType[],
): FetchResponseActuacionType | DatabaseActuacionType | null {
  if ( !actuaciones || actuaciones.length === 0 ) {
    return null;
  }

  return actuaciones.reduce(
    (
      prev, current 
    ) => {
      const prevDate = ensureDate(
        prev.fechaActuacion 
      )
        ?.getTime() || 0;
      const currDate = ensureDate(
        current.fechaActuacion 
      )
        ?.getTime() || 0;

      if ( currDate > prevDate ) {
        return current;
      }

      if ( currDate === prevDate ) {
        const prevReg = ensureDate(
          prev.fechaRegistro 
        )
          ?.getTime() || 0;
        const currReg = ensureDate(
          current.fechaRegistro 
        )
          ?.getTime() || 0;

        if ( currReg > prevReg ) {
          return current;
        }

        if ( currReg === prevReg ) {
          return String(
            current.consActuacion 
          ) > String(
            prev.consActuacion 
          )
            ? current
            : prev;
        }
      }

      return prev;
    } 
  );
}
