import * as fs from 'fs/promises';
import { extrapolateTipoToCorrectType } from '../models/juzgado.js';
import JuzgadoClass from '../models/juzgado.js';
import { RawCarpetas } from '../data/carpetas.js';

const outgoingJuzgados = [];

for ( const carpeta of RawCarpetas ) {
  const juzgadoByCarpeta = extrapolateIdCiudadyTipo(
    String(
      carpeta.JUZGADO_CIUDAD 
    ),
    carpeta.JUZGADO_EJECUCION,
    carpeta.JUZGADO_ORIGEN,
  );

  const juzgadoByCareta = JuzgadoClass.fromShortName(
    {
      ciudad: String(
        carpeta.JUZGADO_CIUDAD 
      ),
      juzgadoRaw: carpeta.JUZGADO_EJECUCION
        ? carpeta.JUZGADO_EJECUCION
        : carpeta.JUZGADO_ORIGEN
          ? carpeta.JUZGADO_ORIGEN
          : '1 CM',
    } 
  );

  console.log(
    juzgadoByCarpeta 
  );
  outgoingJuzgados.push(
    {
      ...juzgadoByCarpeta,
      ...juzgadoByCareta,
    } 
  );
}

fs.writeFile(
  'outgoingJuzgados.json',
  JSON.stringify(
    outgoingJuzgados, null, 2 
  ),
);

export type TransformedJuzgadoValue = {
  id       : string;
  tipo     : string;
  tipoRaw  : string;
  ciudad   : string;
  value    : string;
  fullArray:
    | RegExpMatchArray
    | IterableIterator<RegExpExecArray>
    | null
    | string;
};

export function extrapolateIdCiudadyTipo(
  ciudad: string,
  ejecucion?: string,
  origen?: string,
): TransformedJuzgadoValue {
  let matchedRegexNumberAndLetters;

  if ( ejecucion ) {
    matchedRegexNumberAndLetters = ejecucion.match(
      /(\d+)(\s?)([A-Z������\s-]+)/im,
    );
  } else if ( origen ) {
    matchedRegexNumberAndLetters = origen.match(
      /(\d+)(\s?)([A-Z������\s-]+)/im,
    );
  }

  if ( matchedRegexNumberAndLetters ) {
    const asAnArray = Array.from(
      matchedRegexNumberAndLetters 
    );

    if ( asAnArray.length === 0 ) {
      return {
        fullArray: JSON.stringify(
          matchedRegexNumberAndLetters 
        ),
        id    : '',
        tipo  : '',
        ciudad: ciudad,
        value : ejecucion
          ? ejecucion
          : origen
            ? origen
            : '',
        tipoRaw: String(
          matchedRegexNumberAndLetters 
        ),
      };
    } else if ( asAnArray.length >= 2 ) {
      const temporaryTipo = extrapolateTipoToCorrectType(
        asAnArray[ 3 ] 
      );

      return {
        id       : asAnArray[ 1 ],
        tipo     : temporaryTipo,
        tipoRaw  : asAnArray[ 3 ],
        ciudad   : ciudad,
        fullArray: matchedRegexNumberAndLetters,
        value    : `juzgado ${ asAnArray[ 1 ].padStart(
          3,
          '000',
        ) } ${ temporaryTipo } de ${ ciudad }`.toUpperCase(),
      };
    }

    const temporaryTipo = extrapolateTipoToCorrectType(
      asAnArray[ 3 ] 
    );

    return {
      id       : asAnArray[ 1 ],
      tipo     : temporaryTipo,
      tipoRaw  : asAnArray[ 3 ],
      ciudad   : ciudad,
      fullArray: matchedRegexNumberAndLetters,
      value    : `juzgado ${ asAnArray[ 1 ].padStart(
        3,
        '000',
      ) } ${ temporaryTipo } de ${ ciudad }`.toUpperCase(),
    };
  }

  return {
    fullArray: null,
    id       : '',
    tipo     : '',
    ciudad   : ciudad,
    tipoRaw  : '',
    value    : '',
  };
}
