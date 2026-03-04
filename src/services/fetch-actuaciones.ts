import { ConsultaActuacion } from '../types/actuaciones.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';

export default async function fetchActuacionesRaw(
  idProceso: string,
) {
  let json;

  try {
    const response = await fetchWithSmartRetry(
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
    return json;
  }

  return null;
}
