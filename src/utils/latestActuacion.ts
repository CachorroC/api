import { FetchResponseActuacion } from '../services/syncronize_newest_actuaciones_test_2';
import { intActuacion } from '../types/actuaciones';
import { ensureDate } from './ensureDate.js';

export function getLatestByDate(
  actuaciones: FetchResponseActuacion[]| intActuacion[],
): FetchResponseActuacion | intActuacion | null {
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