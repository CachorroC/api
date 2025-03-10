'use strict';
var __createBinding = ( this && this.__createBinding ) || ( Object.create
  ? ( function(
      o, m, k, k2 
    ) {
      if ( k2 === undefined ) {
        k2 = k; 
      }

      var desc = Object.getOwnPropertyDescriptor(
        m, k 
      );

      if ( !desc || ( 'get' in desc
        ? !m.__esModule
        : desc.writable || desc.configurable ) ) {
        desc = {
          enumerable: true,
          get       : function() {
            return m[ k ]; 
          } 
        };
      }

      Object.defineProperty(
        o, k2, desc 
      );
    } )
  : ( function(
      o, m, k, k2 
    ) {
      if ( k2 === undefined ) {
        k2 = k; 
      }

      o[ k2 ] = m[ k ];
    } ) );
var __setModuleDefault = ( this && this.__setModuleDefault ) || ( Object.create
  ? ( function(
      o, v 
    ) {
      Object.defineProperty(
        o, 'default', {
          enumerable: true,
          value     : v 
        } 
      );
    } )
  : function(
    o, v 
  ) {
    o[ 'default' ] = v;
  } );

var __importStar = ( this && this.__importStar ) || function (
  mod 
) {
  if ( mod && mod.__esModule ) {
    return mod; 
  }

  var result = {};

  if ( mod != null ) {
    for ( var k in mod ) {
      if ( k !== 'default' && Object.prototype.hasOwnProperty.call(
        mod, k 
      ) ) {
        __createBinding(
          result, mod, k 
        ); 
      } 
    } 
  }

  __setModuleDefault(
    result, mod 
  );
  return result;
};

Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);
exports.generateCarpetas = generateCarpetas;

const fs = __importStar(
  require(
    'fs/promises' 
  ) 
);

const carpeta_1 = require(
  './models/carpeta' 
);

const carpetas_1 = require(
  './data/carpetas' 
);

const carpetasMap = carpetas_1.RawCarpetas.map(
  (
    carpeta 
  ) => {
    return new carpeta_1.ClassCarpeta(
      carpeta 
    );
  } 
);

async function* generateCarpetas() {
  for await ( const carpeta of carpetasMap ) {
    await carpeta.getProcesosByName();
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
  }

  fs.writeFile(
    'ClasscarpetasModelPostAwait.json', JSON.stringify(
      Array.from(
        mapClassCarpetas.values() 
      ) 
    ) 
  );

  const asAnArray = Array.from(
    mapClassCarpetas.values() 
  );
  return asAnArray;
}

tryAsyncClassCarpetas();
//# sourceMappingURL=procesos_from_name.js.map