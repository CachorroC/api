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
var __importStar = ( this && this.__importStar ) || ( function () {
  var ownKeys = function( o ) {
    ownKeys = Object.getOwnPropertyNames || function ( o ) {
      var ar = [];

      for ( var k in o ) {
        if ( Object.prototype.hasOwnProperty.call(
          o, k 
        ) ) {
          ar[ ar.length ] = k;
        }
      }

      return ar;
    };

    return ownKeys( o );
  };

  return function ( mod ) {
    if ( mod && mod.__esModule ) {
      return mod;
    }

    var result = {};

    if ( mod != null ) {
      for ( var k = ownKeys( mod ), i = 0; i < k.length; i++ ) {
        if ( k[ i ] !== 'default' ) {
          __createBinding(
            result, mod, k[ i ] 
          );
        }
      }
    }

    __setModuleDefault(
      result, mod 
    );

    return result;
  };
} )();

var __importDefault = ( this && this.__importDefault ) || function ( mod ) {
  return ( mod && mod.__esModule )
    ? mod
    : {
        'default': mod 
      };
};

Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);

const fs = __importStar( require( 'fs/promises' ) );

const prisma_1 = require( './services/prisma' );

const awaiter_1 = require( './utils/awaiter' );

process.env[ 'NODE_TLS_REJECT_UNAUTHORIZED' ] = '0';
console.log( process.env.NODE_TLS_REJECT_UNAUTHORIZED );

const actuacion_1 = __importDefault( require( './models/actuacion' ) );

async function fetcher( idProceso ) {
  console.log( `fetching idProceso: ${ idProceso }` );
  await ( 0, awaiter_1.sleep )( 10000 );

  try {
    const request = await fetch( `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${ idProceso }` );

    if ( !request.ok ) {
      throw new Error( `${ idProceso }: ${ request.status } ${ request.statusText }${ JSON.stringify(
        request, null, 2 
      ) }` );
    }

    const json = ( await request.json() );

    const {
      actuaciones 
    } = json;

    return actuaciones.map( ( actuacion ) => {
      const {
        fechaActuacion, fechaRegistro, fechaFinal, fechaInicial, consActuacion, cant, idRegActuacion, 
      } = actuacion;

      return {
        ...actuacion,
        fechaActuacion: new Date( fechaActuacion ),
        fechaRegistro : new Date( fechaRegistro ),
        fechaInicial  : fechaInicial
          ? new Date( fechaInicial )
          : null,
        fechaFinal: fechaFinal
          ? new Date( fechaFinal )
          : null,
        isUltimaAct   : cant === consActuacion,
        idProceso     : idProceso,
        createdAt     : new Date( fechaRegistro ),
        idRegActuacion: `${ idRegActuacion }`,
      };
    } );
  } catch ( error ) {
    console.log( error );

    return null;
  }
}

async function getIdProcesos() {
  const carpetas = await prisma_1.client.carpeta.findMany();

  return carpetas
    .flatMap( ( carpeta ) => {
      return carpeta.idProcesos.map( ( idProceso ) => {
        return {
          idProceso,
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
        };
      } );
    } )
    .sort( (
      a, b 
    ) => {
      return b.carpetaNumero - a.carpetaNumero;
    } );
}

async function* AsyncGenerateActuaciones( procesos ) {
  for ( const {
    idProceso, carpetaNumero, carpetaId, 
  } of procesos ) {
    await ( 0, awaiter_1.sleep )( 10000 );

    const fetcherIdProceso = await fetcher( idProceso );

    if ( fetcherIdProceso && fetcherIdProceso.length > 0 ) {
      const actsActualizadas = await actuacion_1.default.updateAllActuaciones(
        fetcherIdProceso, carpetaNumero 
      );

      console.log( actsActualizadas );
      await actuacion_1.default.prismaUpdaterActuaciones(
        fetcherIdProceso, carpetaNumero, carpetaId 
      );
    }

    yield fetcherIdProceso;
  }
}

async function main() {
  const ActsMap = [];

  const idProcesos = await getIdProcesos();

  for await ( const actuacionesJson of AsyncGenerateActuaciones( idProcesos ) ) {
    ActsMap.push( actuacionesJson );
  }

  fs.writeFile(
    'actuacionesOutput.json', JSON.stringify(
      ActsMap, null, 2 
    ) 
  );

  return ActsMap;
}

main();
//# sourceMappingURL=actuaciones.js.map