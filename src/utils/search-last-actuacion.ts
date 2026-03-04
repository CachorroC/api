/**
 * @module utils/search-last-actuacion
 * @description Latest Judicial Action Search Utility
 * 
 * Identifies the most recent relevant legal action from a list of actuaciones.
 * Filters out administrative/procedural entries (journal entries, despachos)
 * and returns the most recent substantive action.
 * 
 * IRRELEVANT PATTERNS:
 * The following keywords indicate procedural/non-substantive actions:
 * - FIJACION: Judicial posting/notice (administrative)
 * - DESPACHO: Court office communication (internal)
 * Pattern: /([Ff][iI][Jj][Aa][cC][iI][oO][nN])|([Dd][eE][sS][pP][aA][cC][hH][oO])/
 * 
 * SEARCH LOGIC:
 * 1. Sort actuaciones by relevance:
 *    - Irrelevant markers pushed to end (return -1)
 *    - Irrelevant entries sorted to beginning (return 1)
 *    - Relevant entries sorted by consActuacion (sequence number)
 * 2. Extract first 3 entries:
 *    - ultimaActuacion: Most recent relevant action
 *    - penUltimaActuacion: Previous action (for history)
 *    - antePenultimaActuacion: Two steps back (for context)
 * 3. Return ultimaActuacion
 * 
 * RETURN VALUE:
 * DatabaseActuacionType: Most recent substantive action
 * Used by ClassCarpeta.ultimaActuacion property
 * Displayed on case status views in web app
 * 
 * LIMITATION:
 * If all actuaciones are irrelevant (all FIJACION/DESPACHO),
 * this function returns the least bad option without throwing.
 */

import { DatabaseActuacionType } from '../types/actuaciones';

/**
 * @function isIrrelevantActuacion
 * @description Identifies administrative/procedural actions that should be deprioritized.
 * 
 * PATTERNS:
 * - FIJACION: Posting of judicial notices (procedural, not substantive)
 * - DESPACHO: Court office/despacho communications (administrative, not case action)
 * 
 * Regex: /([Ff][iI][Jj][Aa][cC][iI][oO][nN])|([Dd][eE][sS][pP][aA][cC][hH][oO])/gim
 * Flags: gim = global, case-insensitive, multiline
 * 
 * @param {string} incomingActuacion - Action description text to test
 * @returns {boolean} true if action is procedural/irrelevant, false if substantive
 * 
 * @example
 * isIrrelevantActuacion("FIJACION EN LUGAR PUBLICO") // Returns: true
 * isIrrelevantActuacion("DESPACHO ORDEN DE PAGO") // Returns: true
 * isIrrelevantActuacion("SENTENCIA EJECUTORIA") // Returns: false
 */
export function isIrrelevantActuacion(
  incomingActuacion: string 
) {
  return /([Ff][iI][Jj][Aa][cC][iI][oO][Nn])|([Dd][eE][sS][pP][aA][cC][hH][oO])/gim.test(
    incomingActuacion,
  );
}

/**
 * @function searchForLastActuacion
 * @description Finds the most recent substantive action from list, deprioritizing procedural entries.
 * 
 * SORTING STRATEGY (custom comparator):
 * Returns -1 if a is irrelevant: Moves to end
 * Returns 1 if b is irrelevant: Moves to beginning
 * Compares consActuacion (sequence) for both relevant: Keeps order
 * 
 * THREE-ENTRY EXTRACTION:
 * After sort, destructures first 3 positions:
 * - [0]: ultimaActuacion (most recent, most relevant)
 * - [1]: penUltimaActuacion (previous action)
 * - [2]: antePenultimaActuacion (action before that)
 * 
 * CONSOLE LOGGING:
 * Outputs penUltima and antePenultima for debugging/audit trail
 * Helps verify action selection logic during development
 * 
 * @param {DatabaseActuacionType[]} incomingActuaciones - Unsorted list of legal actions
 * @returns {DatabaseActuacionType} The most recent substantive action
 * 
 * @example
 * const actions = [
 *   {actuacion: 'FIJACION...', consActuacion: 1},
 *   {actuacion: 'SENTENCIA', consActuacion: 2},
 *   {actuacion: 'DESPACHO...', consActuacion: 3}
 * ];
 * const latest = searchForLastActuacion(actions);
 * // Returns: SENTENCIA (consActuacion: 2)
 */
export function searchForLastActuacion(
  incomingActuaciones: DatabaseActuacionType[],
): DatabaseActuacionType {
  const sortedLastFirst = [
    ...incomingActuaciones
  ].sort(
    (
      a, b 
    ) => {
      const isAIrrelevantOrNot = isIrrelevantActuacion(
        a.actuacion 
      );

      const isBIrrelevantOrNot = isIrrelevantActuacion(
        b.actuacion 
      );

      if ( isAIrrelevantOrNot ) {
        return -1;
      } else if ( isBIrrelevantOrNot ) {
        return 1;
      }

      if ( a.consActuacion < b.consActuacion ) {
        return -1;
      } else if ( a.consActuacion > b.consActuacion ) {
        return 1;
      }

      return 0;
    } 
  );

  const [
    ultimaActuacion,
    penUltimaActuacion,
    antePenultimaActuacion
  ]
    = sortedLastFirst;

  console.log(
    JSON.stringify(
      penUltimaActuacion, null, 2 
    ) 
  );
  console.log(
    JSON.stringify(
      antePenultimaActuacion, null, 2 
    ) 
  );

  return ultimaActuacion;
}
