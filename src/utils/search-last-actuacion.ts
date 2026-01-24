import { outActuacion } from '../types/actuaciones.js';

export function isIrrelevantActuacion(
  incomingActuacion: string 
) {
  return /([Ff][iI][Jj][Aa][cC][iI][oO][Nn])|([Dd][eE][sS][pP][aA][cC][hH][oO])/gim.test(
    incomingActuacion,
  );
}

export function searchForLastActuacion(
  incomingActuaciones: outActuacion[],
): outActuacion {
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
