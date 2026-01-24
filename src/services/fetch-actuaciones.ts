import { ConsultaActuacion } from '../types/actuaciones.js';

export default async function fetchActuaciones(
  idProceso: number,
  carpetaNumero?: number,
) {
  let json;

  try {
    const response = await fetch(
      `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${ idProceso }`,
    );

    json = ( await response.json() ) as ConsultaActuacion;
  } catch ( error ) {
    if ( error instanceof SyntaxError ) {
      // Unexpected token < in JSON
      console.log(
        'There was a SyntaxError', error 
      );
    }

    console.log(
      'There was an error', error 
    );
  }

  if ( json ) {
    console.log(
      'Use the JSON here!', json 
    );

    const {
      actuaciones 
    } = json;

    if ( actuaciones ) {
      return actuaciones.map(
        (
          actuacion 
        ) => {
          return {
            ...actuacion,
            fechaActuacion: new Date(
              actuacion.fechaActuacion 
            ),
            fechaRegistro: new Date(
              actuacion.fechaRegistro 
            ),
            fechaInicial: actuacion.fechaInicial
              ? new Date(
                actuacion.fechaInicial 
              )
              : null,
            fechaFinal: actuacion.fechaFinal
              ? new Date(
                actuacion.fechaFinal 
              )
              : null,
            isUltimaAct: actuacion.cant === actuacion.consActuacion,
            idProceso  : idProceso,
            createdAt  : new Date(
              actuacion.fechaRegistro 
            ),
            carpetaNumero: carpetaNumero
              ? carpetaNumero
              : null,
          };
        } 
      );
    }

    return json;
  }

  return null;
}
