'use strict';
Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);
exports.JuzgadoClass = void 0;
exports.extrapolateTipoToCorrectType = extrapolateTipoToCorrectType;

const despachos_1 = require(
  '../data/despachos' 
);

function extrapolateTipoToCorrectType(
  tipo 
) {
  let output = tipo;

  const hasEjecucion = /EJE|E|EJ/gim.test(
    tipo 
  );

  const isPromiscuoCircuito = /PCTO/gim.test(
    tipo 
  );

  const isPequeñasCausas = /PCCM|PCYCM|Peque|causas/gim.test(
    tipo 
  );

  const isPromiscuoMunicipal = /PM|PROM|P M/gim.test(
    tipo 
  );

  const isCivilMunicipal = /(CM|municipal|C M)/g.test(
    tipo 
  );

  const isCivilCircuito = /(CCTO|CIRCUITO|CTO|C CTO|CC)/gim.test(
    tipo 
  );

  if ( hasEjecucion ) {
    if ( isPequeñasCausas ) {
      output = 'DE PEQUEÑAS CAUSAS  Y COMPETENCIA MÚLTIPLE';
    }
    else if ( isPromiscuoMunicipal ) {
      output = 'PROMISCUO MUNICIPAL';
    }
    else if ( isCivilCircuito ) {
      output = 'CIVIL DEL CIRCUITO DE EJECUCIÓN DE SENTENCIAS';
    }
    else if ( isCivilMunicipal ) {
      output = 'CIVIL MUNICIPAL DE EJECUCIÓN DE SENTENCIAS';
    }
  }
  else {
    if ( isPequeñasCausas ) {
      output = 'DE PEQUEÑAS CAUSAS  Y COMPETENCIA MÚLTIPLE';
    }
    else if ( isPromiscuoMunicipal ) {
      output = 'PROMISCUO MUNICIPAL';
    }
    else if ( isPromiscuoCircuito ) {
      output = 'PROMISCUO DEL CIRCUITO';
    }
    else if ( isCivilCircuito ) {
      output = 'CIVIL DEL CIRCUITO';
    }
    else if ( isCivilMunicipal ) {
      output = 'CIVIL MUNICIPAL';
    }
  }

  return output;
}

class JuzgadoClass {
  constructor(
    {
      id, tipo, ciudad, 
    } 
  ) {
    this.id = id.padStart(
      3, '000' 
    );
    this.tipo = tipo.toUpperCase()
      .trim();
    this.ciudad = ciudad.toUpperCase()
      .trim();

    const constructorString = `JUZGADO ${ this.id } ${ this.tipo } DE ${ this.ciudad }`
      .toUpperCase()
      .normalize(
        'NFD' 
      )
      .replaceAll(
        /\p{Diacritic}/gu, '' 
      )
      .trim();

    const [
      matchedDespacho
    ] = despachos_1.Despachos.filter(
      (
        despacho 
      ) => {
        const normalizedIteratedName = despacho.nombre
          .toLowerCase()
          .normalize(
            'NFD' 
          )
          .replaceAll(
            /\p{Diacritic}/gu, '' 
          )
          .trim();

        const normalizedName = constructorString
          .toLowerCase()
          .normalize(
            'NFD' 
          )
          .replaceAll(
            /\p{Diacritic}/gu, '' 
          )
          .trim();

        const indexOfDespacho = normalizedIteratedName.indexOf(
          normalizedName 
        );

        const includesDespacho = normalizedIteratedName.includes(
          normalizedName 
        );

        if ( indexOfDespacho !== -1 ) {
          console.log(
            `Juzgado Class indexOf Despacho ${ includesDespacho }: ${ normalizedIteratedName } === ${ normalizedName }: ${ normalizedIteratedName === normalizedName }` 
          );
        }

        if ( includesDespacho ) {
          console.log(
            `Juzgado Class includes Despacho${ includesDespacho }: ${ normalizedIteratedName } === ${ normalizedName }: ${ normalizedIteratedName === normalizedName }` 
          );
          return normalizedIteratedName === normalizedName;
        }

        return normalizedIteratedName === normalizedName;
      } 
    );

    if ( matchedDespacho ) {
      this.url = `https://www.ramajudicial.gov.co${ matchedDespacho.url }`;

      const matchedDespachoParts = matchedDespacho.nombre.match(
        /JUZGADO (\d+) ([A-Z\sñúóéíá]+) DE ([.A-Z\sñúóéíá-]+)/im 
      );

      if ( matchedDespachoParts ) {
        const [
          longName,
          newId,
          newTipo,
          newCiudad
        ] = matchedDespachoParts;
        this.id = newId;
        this.tipo = newTipo;
        this.ciudad = newCiudad;
      }
    }
    else {
      this.url = '';
    }
  }
  id;
  tipo;
  ciudad;
  url;
  static fromShortName(
    {
      ciudad, juzgadoRaw, 
    } 
  ) {
    let newTipo, newId;
    newTipo = juzgadoRaw;

    const matchedRegexNumberAndLetters = juzgadoRaw.match(
      /(\d+)(\s?)([A-Zñúáéóí\s-]+)/im 
    );

    if ( !matchedRegexNumberAndLetters ) {
      return new JuzgadoClass(
        {
          id  : '',
          tipo: newTipo,
          ciudad,
        } 
      );
    }

    const asAnArray = Array.from(
      matchedRegexNumberAndLetters 
    );

    const [
      fullArray,
      rawId,
      space,
      rawTipo
    ] = asAnArray;
    newId = rawId.padStart(
      3, '000' 
    );
    newTipo = extrapolateTipoToCorrectType(
      rawTipo 
    );
    return new JuzgadoClass(
      {
        id  : newId,
        tipo: newTipo,
        ciudad,
      } 
    );
  }
  static fromLongName(
    despacho 
  ) {
    const matchedDespachoParts = despacho.match(
      /JUZGADO (\d+) ([A-Z\sñúóéíá]+) DE ([.A-Z\sñúóéíá-]+)/im 
    );

    if ( !matchedDespachoParts ) {
      return new JuzgadoClass(
        {
          id    : '',
          tipo  : despacho,
          ciudad: '',
        } 
      );
    }

    const [
      longName,
      id,
      tipo,
      ciudad
    ] = matchedDespachoParts;
    console.log(
      longName 
    );
    return new JuzgadoClass(
      {
        id,
        tipo,
        ciudad,
      } 
    );
  }
  static fromProceso(
    proceso 
  ) {
    const matchedDespachoParts = proceso.despacho.match(
      /JUZGADO (\d+) ([A-Z\sñúóéíá]+) DE ([.A-Z\sñúóéíá-]+)/im 
    );

    if ( !matchedDespachoParts ) {
      return new JuzgadoClass(
        {
          id    : '',
          tipo  : proceso.despacho,
          ciudad: proceso.departamento,
        } 
      );
    }

    const [
      longName,
      id,
      tipo,
      ciudad
    ] = matchedDespachoParts;
    console.log(
      longName 
    );
    return new JuzgadoClass(
      {
        id,
        tipo,
        ciudad,
      } 
    );
  }
}
exports.JuzgadoClass = JuzgadoClass;
//# sourceMappingURL=juzgado.js.map