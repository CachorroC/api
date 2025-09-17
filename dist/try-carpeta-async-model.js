'use strict';
Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);
exports.generateCarpetas = generateCarpetas;

const carpeta_1 = require( './models/carpeta' );

const carpetas_1 = require( './data/carpetas' );

const awaiter_1 = require( './utils/awaiter' );

process.env[ 'NODE_TLS_REJECT_UNAUTHORIZED' ] = '0';
console.log( process.env.NODE_TLS_REJECT_UNAUTHORIZED );

const carpetasMap = carpetas_1.RawCarpetas.map( ( carpeta ) => {
  return {
    carpeta: new carpeta_1.ClassCarpeta( carpeta ),
    numero : Number( carpeta.NUMERO ),
  };
} );

async function* generateCarpetas() {
  for await ( const {
    carpeta 
  } of carpetasMap ) {
    if ( carpeta.category === 'Terminados' ) {
      yield carpeta;
    }

    await ( 0, awaiter_1.sleep )( 1000 );
    await carpeta.getProcesos();
    await carpeta.getActuaciones();
    yield carpeta;
  }
}

async function tryAsyncClassCarpetas() {
  const mapClassCarpetas = new Map();

  for await ( const carpeta of generateCarpetas() ) {
    mapClassCarpetas.set(
      carpeta.numero, carpeta 
    );

    if ( carpeta.category === 'Terminados' ) {
      continue;
    }

    await carpeta_1.ClassCarpeta.insertCarpeta( carpeta );
  }

  const asAnArray = Array.from( mapClassCarpetas.values() );

  return asAnArray;
}

tryAsyncClassCarpetas();
//# sourceMappingURL=try-carpeta-async-model.js.map