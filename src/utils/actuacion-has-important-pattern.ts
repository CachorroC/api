/**
 * @module utils/actuacion-has-important-pattern
 * @description Judicial Action Importance Pattern Detector
 * 
 * Analyzes legal action descriptions to identify important/critical events
 * in a judicial process. Used to flag actuaciones that require immediate attention
 * and trigger notifications.
 * 
 * PATTERN CATEGORIES:
 * AUTO: Court orders/rulings - /([Aa][Uu][Tt][Oo]+)\s([A-Z a-z...]+)/
 * RADICADO: Document filing - /([Rr][Aa][Dd][Ii][Cc][Aa]+)([A-Z a-z...]+)/
 * 
 * USE CASE:
 * - Check if nuevaActuacion matches AUTO or RADICADO
 * - Trigger immediate notification if important
 * - Log to FileLogger for audit trail
 */

import { client } from '../services/prisma.js';
import { DatabaseActuacionType,
  FetchResponseActuacionType, } from '../types/actuaciones.js';
import * as fs from 'fs/promises';

/**
 * @async
 * @function actuacionesGetAuto
 * @description Maps all actuaciones in database through importance pattern detector.
 * Fetches all actuaciones, applies pattern matching, exports results to JSON.
 * 
 * @returns {Promise<Array>} Array of actuaciones with importance metadata
 */
export async function actuacionesGetAuto() {
  const actuaciones = await client.actuacion.findMany();

  const newActs = actuaciones.map(
    (
      actuacion 
    ) => {
      const {
        carpetaNumero 
      } = actuacion;

      if ( carpetaNumero !== null ) {
        return actuacionHasAuto(
          {
            ...actuacion,
            carpetaNumero,
          } 
        );
      }

      return actuacionHasAuto(
        {
          ...actuacion,
          carpetaNumero: 0,
        } 
      );
    } 
  );

  fs.writeFile(
    'actuacionesNewMap.json', JSON.stringify(
      newActs 
    ) 
  );

  return newActs;
}

/**
 * @function actuacionHasAuto
 * @description Detects AUTO and RADICADO patterns in action description.
 * 
 * AUTO pattern: Case-insensitive "AUTO" followed by action description
 * RADICADO pattern: Case-insensitive "RADICA" (in various forms)
 * 
 * @param {DatabaseActuacionType|FetchResponseActuacionType} incomingActuacion - Action to analyze
 * @returns {Object} Original actuacion with hasAuto and hasRadicado boolean flags
 */
export function actuacionHasAuto(
  incomingActuacion: DatabaseActuacionType | FetchResponseActuacionType,
) {
  const {
    actuacion 
  } = incomingActuacion;

  const hasAuto = /([Aa][Uu][Tt][Oo]+)\s([A-Z a-z\u00C0-\u00FF,.()\w/]+)/.test(
    actuacion,
  );

  const hasRadicado
    = /([Rr][Aa][Dd][Ii][Cc][Aa]+)([A-Z a-z\u00C0-\u00FF,.()\w/]+)/.test(
      actuacion 
    );

  return {
    ...incomingActuacion,
    hasAuto    : hasAuto,
    hasRadicado: hasRadicado,
  };
}
