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
Object.defineProperty(
  exports, '__esModule', {
    value: true 
  } 
);

const client_1 = require( '@prisma/client' );

const fs = __importStar( require( 'fs/promises' ) );

const juzgado_1 = require( './models/juzgado' );

const procesos_1 = require( './models/procesos' );

const prisma = new client_1.PrismaClient();

async function fetcher( llaveProceso ) {
  try {
    const request = await fetch( `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ llaveProceso }&SoloActivos=false&pagina=1` );

    if ( !request.ok ) {
      throw new Error( `${ llaveProceso }: ${ request.status } ${ request.statusText }${ JSON.stringify(
        request, null, 2 
      ) }` );
    }

    const json = ( await request.json() );

    const {
      procesos 
    } = json;

    return procesos.map( ( proceso ) => {
      return {
        ...proceso,
        fechaProceso: proceso.fechaProceso
          ? new Date( proceso.fechaProceso )
          : null,
        fechaUltimaActuacion: proceso.fechaUltimaActuacion
          ? new Date( proceso.fechaUltimaActuacion )
          : null,
        juzgado: juzgado_1.JuzgadoClass.fromProceso( proceso ),
      };
    } );
  } catch ( error ) {
    console.log( error );

    return [];
  }
}

async function getLLaves() {
  const carpetas = await prisma.carpeta.findMany();

  return carpetas.flatMap( ( carpeta ) => {
    return {
      llaveProceso: carpeta.llaveProceso.trim(),
      numero      : carpeta.numero,
      id          : carpeta.id,
    };
  } );
}

async function* AsyncGenerateActuaciones( llaves ) {
  for ( const carpeta of llaves ) {
    const newProceso = await procesos_1.ClassProcesos.getProcesos(
      carpeta.llaveProceso, carpeta.numero 
    );

    const fetcherIdProceso = await fetcher( carpeta.llaveProceso );

    for ( const proceso of fetcherIdProceso ) {
      if ( !proceso.esPrivado ) {
        await prismaUpdaterProcesos(
          proceso, carpeta.numero 
        );
      }
    }

    newProceso.prismaUpdateProcesos();
    yield newProceso;
  }
}

async function prismaUpdaterProcesos(
  proceso, numero 
) {
  const idProcesosSet = new Set();

  try {
    const carpeta = await prisma.carpeta.findFirstOrThrow( {
      where: {
        numero: numero,
      },
    } );

    carpeta.idProcesos.forEach( ( idProceso ) => {
      idProcesosSet.add( idProceso );
    } );
    idProcesosSet.add( proceso.idProceso );

    const updater = await prisma.carpeta.update( {
      where: {
        numero: numero
      },
      data: {
        idProcesos: {
          set: Array.from( idProcesosSet ),
        },
        procesos: {
          connectOrCreate: {
            where: {
              idProceso: proceso.idProceso,
            },
            create: {
              ...proceso,
              juzgado: {
                connectOrCreate: {
                  where: {
                    id_tipo_ciudad: {
                      tipo  : proceso.juzgado.tipo,
                      id    : proceso.juzgado.id,
                      ciudad: proceso.juzgado.ciudad,
                    },
                  },
                  create: {
                    tipo  : proceso.juzgado.tipo,
                    id    : proceso.juzgado.id,
                    ciudad: proceso.juzgado.ciudad,
                    url   : proceso.juzgado.url,
                  },
                },
              },
            },
          },
        },
      },
    } );

    console.log( updater );
  } catch ( error ) {
    console.log( error );
  }
}

async function main() {
  const ActsMap = [];

  const idProcesos = await getLLaves();

  console.log( idProcesos );

  for await ( const actuacionesJson of AsyncGenerateActuaciones( idProcesos ) ) {
    console.log( actuacionesJson );
    ActsMap.push( actuacionesJson );
  }

  fs.writeFile(
    'actuacionesOutput.json', JSON.stringify( ActsMap ) 
  );

  return ActsMap;
}

main();
//# sourceMappingURL=procesos.js.map