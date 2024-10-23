/*
const outGoingValuesMap = new Map();

const regexMap = [];

for ( const carpeta of Carpetas ) {
  const indexOfCarpeta = Carpetas.indexOf(
    carpeta
  );

  const dateEntries = new Map();

  dateEntries.set(
    'numero', carpeta.numero
  );
  dateEntries.set(
    'index', indexOfCarpeta
  );

  const carpetaEntries = Object.entries(
    carpeta
  );

  for ( const [
    key,
    value
  ] of carpetaEntries ) {
    const matchedFechansKey = key.search(
      /(VALOR+)/gm
    );
    console.log(
      matchedFechansKey
    );

    if ( matchedFechansKey === -1 ) {
      continue;
    }

    regexMap.push(
      value
    );

    const dateValue = capitalBuilder(
      value
    );
    console.log(
      `OUT_${ value } ====> ${ dateValue }`
    );
    dateEntries.set(
      key, dateValue
    );
    dateEntries.set(
      `IN_${ key }`, value
    );
  }

  const fechaCarpeta = Object.fromEntries(
    dateEntries
  );
  console.log(
    JSON.stringify(
      fechaCarpeta, null, 2
    )
  );
  outGoingValuesMap.set(
    carpeta.numero, fechaCarpeta
  );
} */

export function capitalBuilder(
  capitalAdeudado?: string | number | null | Date,
) {
  if ( !capitalAdeudado || typeof capitalAdeudado === 'object' ) {
    return 0;
  }

  if ( typeof capitalAdeudado === 'number' ) {
    if ( Number.isNaN(
      capitalAdeudado 
    ) ) {
      return 0;
    }

    return capitalAdeudado;
  }

  const copTaker = capitalAdeudado.matchAll(
    /([\d.]+)([.,])(\d{2}|\d{2})$/gm 
  );
  console.log(
    copTaker 
  );

  for ( const cap of copTaker ) {
    const [
      , /*  */ value
    ] = cap;

    const valueReplacer = value.replaceAll(
      /([.,]+)/gm, '' 
    );

    const outputValue = Number(
      valueReplacer 
    );

    if ( Number.isNaN(
      outputValue 
    ) ) {
      return 0;
    }

    return outputValue;
  }

  const newCapital = capitalAdeudado.search(
    /([/A-Za-z@]+)/gm 
  );
  console.log(
    newCapital 
  );

  if ( newCapital >= 0 ) {
    console.log(
      `es mayor a 0 ${ newCapital }` 
    );
    return 0;
  }

  console.log(
    capitalAdeudado 
  );

  const outGoingMatch = capitalAdeudado.match(
    /(\d+)/gm 
  );

  if ( !outGoingMatch ) {
    return 0;
  }

  const valueReplacer = capitalAdeudado.replaceAll(
    /([.,]+)/gm, '' 
  );

  const outgoingValue = Number(
    valueReplacer 
  );

  if ( Number.isNaN(
    outgoingValue 
  ) ) {
    return 0;
  }

  return outgoingValue;
}
