import * as fs from 'fs/promises';
import { client } from '../services/prisma.js';
import { outActuacion } from '../types/actuaciones.js';

export default class Actuacion {
  static async updateAllActuaciones(
    actuacionesComplete: outActuacion[],
    numeroCarpeta: number,
  ) {
    const outputActuaciones = new Set<{
      idRegActuacion: string;
      actuacion     : string;
      anotacion     : string | null;
      cant          : number;
      carpetaNumero : number | null;
      codRegla      : string;
      conDocumentos : boolean;
      consActuacion : number;
      createdAt     : Date;
      fechaActuacion: Date;
      fechaFinal    : Date | null;
      fechaInicial  : Date | null;
      fechaRegistro : Date;
      isUltimaAct   : boolean;
      llaveProceso  : string;
      procesoId     : number | null;
      idProceso     : number;
    }>();

    try {
      for ( const actuacion of actuacionesComplete ) {
        const upsertActuacion = await client.actuacion.upsert( {
          where: {
            idRegActuacion: `${ actuacion.idRegActuacion }`,
          },
          update: {
            ...actuacion,
            idRegActuacion: `${ actuacion.idRegActuacion }`,
            idProceso     : Number( actuacion.idProceso ),
            carpetaNumero : numeroCarpeta,
            isUltimaAct   : actuacion.consActuacion === actuacion.cant,
            Carpeta       : {
              connect: {
                numero: numeroCarpeta,
              },
            },
            proceso: {
              connect: {
                idProceso: actuacion.idProceso,
              },
            },
          },
          create: {
            ...actuacion,
            idRegActuacion: `${ actuacion.idRegActuacion }`,
            idProceso     : Number( actuacion.idProceso ),
            carpetaNumero : numeroCarpeta,
            isUltimaAct   : actuacion.consActuacion === actuacion.cant,
            Carpeta       : {
              connect: {
                numero: numeroCarpeta,
              },
            },
            proceso: {
              connect: {
                idProceso: actuacion.idProceso,
              },
            },
          },
        } );

        console.log( JSON.stringify( upsertActuacion ) );
        outputActuaciones.add( upsertActuacion );
      }
    } catch ( error ) {
      console.log( error );
    }

    return Array.from( outputActuaciones );
  }
  static async prismaUpdaterActuaciones(
    actuacionesComplete: outActuacion[],
    numeroCarpeta: number,
    numeroId: number,
  ) {
    const ultimaActuacion = actuacionesComplete.find( ( a ) => {
      console.log( `carpeta numero ${ numeroCarpeta }: a.consActuacion: ${
        a.consActuacion
      } a.cant: ${ a.cant } es ultima Actuacion : ${
        a.consActuacion === a.cant
      }`, );

      return a.consActuacion === a.cant;
    } );

    if ( ultimaActuacion ) {
      try {
        console.log( `${ numeroCarpeta }: ultima Actuacion isUltimaAct ${ ultimaActuacion.isUltimaAct ?? 'no hay ultima act' }`, );

        const carpeta = await client.carpeta.findFirstOrThrow( {
          where: {
            OR: [
              {
                llaveProceso: ultimaActuacion.llaveProceso,
              },
              {
                numero: numeroCarpeta,
              },
              {
                id: numeroId,
              },
            ],
          },
          include: {
            ultimaActuacion: true,
          },
        } );

        const incomingDate = new Date( ultimaActuacion.fechaActuacion )
          .getTime();

        const savedDate = carpeta.fecha
          ? new Date( carpeta.fecha )
              .getTime()
          : null;

        if ( !savedDate || savedDate < incomingDate ) {
          console.log( 'no hay saved date o la saved date es menor que incoming date', );

          const updateLastActuacion
            = await Actuacion.updatePreviousLastActuacion( carpeta.idRegUltimaAct );

          const updateCarpeta
            = await Actuacion.updateCarpetaWithNewLastActuacion( {
              ultimaActuacion,
              numero: numeroCarpeta,
            } );

          console.log( JSON.stringify(
            updateCarpeta, null, 2
          ) );

          await fs.mkdir(
            `./src/date/${ new Date()
              .getFullYear() }/${ new Date()
              .getMonth() }/${ new Date()
              .getDate() }`,
            {
              recursive: true,
            },
          );

          fs.writeFile(
            `./src/date/${ new Date()
              .getFullYear() }/${ new Date()
              .getMonth() }/${ new Date()
              .getDate() }/${
              ultimaActuacion.idRegActuacion
            }.json`,
            JSON.stringify( updateLastActuacion ),
          );
        } /*
      console.log('prisma will start now');
      for (const actuacion of actuacionesComplete) {
        const upsertActuacion =
          await client.actuacion.upsert({
            where: {
              idRegActuacion: `${actuacion.idRegActuacion}`,
            },
            update: {
              ...actuacion,
              idRegActuacion: `${actuacion.idRegActuacion}`,
              idProceso: Number(actuacion.idProceso),
              isUltimaAct:
                actuacion.consActuacion === actuacion.cant,

            },
            create: {
              ...actuacion,
              idRegActuacion: `${actuacion.idRegActuacion}`,
              idProceso: Number(actuacion.idProceso),
              isUltimaAct:
                actuacion.consActuacion === actuacion.cant,

            },
          });
        upsertActuacion;
        console.log(`created ${JSON.stringify(upsertActuacion)}`);
      } */
      } catch ( error ) {
        console.log( `prisma updater actuaciones error : ${ error }` );
      }
    }
  }
  static async updateCarpetaWithNewLastActuacion( {
    ultimaActuacion,
    numero,
  }: {
    ultimaActuacion: outActuacion;
    numero         : number;
  } ) {
    try {
      const carpetaUpdate = await client.carpeta.update( {
        where: {
          numero: numero,
        },
        data: {
          fecha          : new Date( ultimaActuacion.fechaActuacion ),
          revisado       : false,
          ultimaActuacion: {
            connectOrCreate: {
              where: {
                idRegActuacion: `${ ultimaActuacion.idRegActuacion }`,
              },
              create: {
                ...ultimaActuacion,
                isUltimaAct:
                  ultimaActuacion.cant === ultimaActuacion.consActuacion,
                idRegActuacion: `${ ultimaActuacion.idRegActuacion }`,
                idProceso     : Number( ultimaActuacion.idProceso ),
                carpetaNumero : numero,
                proceso       : {
                  connect: {
                    idProceso: ultimaActuacion.idProceso,
                  },
                },
              },
            },
          },
        },
        include: {
          ultimaActuacion: true,
        },
      } );

      return carpetaUpdate;
    } catch ( error ) {
      console.log( `error al cambiar la carpeta y actualizar la ultima actuacion: ${ error }`, );

      return null;
    }
  }

  static async updatePreviousLastActuacion( idRegUltimaAct: string | null ) {
    try {
      if ( idRegUltimaAct === null ) {
        throw new Error( 'la idRegAct de la ultima actuacion es null' );
      }

      const updateCarpeta = await client.actuacion.update( {
        where: {
          idRegActuacion: idRegUltimaAct,
        },
        data: {
          isUltimaAct: false,
        },
      } );

      return updateCarpeta;
    } catch ( error ) {
      console.log( `error al cambiar la ultima actuacion: ${ error }` );

      return null;
    }
  }
}
