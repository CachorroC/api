import { client } from '../services/prisma.js';
import { DatabaseActuacionType,
  FetchResponseActuacionType, } from '../types/actuaciones.js';
import * as fs from 'fs/promises';

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

export function actuacionHasAuto(
  incomingActuacion: DatabaseActuacionType | FetchResponseActuacionType,
) {
  const {
    actuacion 
  } = incomingActuacion;

  const hasAuto = /([Aa][Uu][Tt][Oo]+)\s([A-Z a-z����������,.()\w/]+)/.test(
    actuacion,
  );

  const hasRadicado
    = /([Rr][Aa][Dd][Ii][Cc][Aa]+)([A-Z a-z����������,.()\w/]+)/.test(
      actuacion 
    );

  return {
    ...incomingActuacion,
    hasAuto    : hasAuto,
    hasRadicado: hasRadicado,
  };
}
