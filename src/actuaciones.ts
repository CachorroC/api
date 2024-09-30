import * as fs from 'fs/promises';
import { ConsultaActuacion, outActuacion } from './types/actuaciones';
import { client } from './services/prisma';
import { sleep } from './utils/awaiter';
process.env[ 'NODE_TLS_REJECT_UNAUTHORIZED' ] = '0';
console.log(
  process.env.NODE_TLS_REJECT_UNAUTHORIZED 
);

async function fetcher(
  idProceso: number 
) {
  try {
    const request = await fetch(
      `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${ idProceso }`,
    );

    if ( !request.ok ) {
      throw new Error(
        `${ idProceso }: ${ request.status } ${ request.statusText }${ JSON.stringify(
          request,
          null,
          2,
        ) }`,
      );
    }

    const json = ( await request.json() ) as ConsultaActuacion;

    const {
      actuaciones 
    } = json;

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
        };
      } 
    );
  }
  catch ( error ) {
    console.log(
      error 
    );
    return null;
  }
}

async function getIdProcesos() {
  const carpetas = await client.carpeta.findMany();
  return carpetas.flatMap(
    (
      carpeta 
    ) => {
      return carpeta.idProcesos.map(
        (
          idProceso 
        ) => {
          return {
            idProceso,
            carpetaNumero: carpeta.numero,
            llaveProceso : carpeta.llaveProceso,
            carpetaId    : carpeta.id,
          };
        } 
      );
    } 
  );
}

async function* AsyncGenerateActuaciones(
  procesos: {
    idProceso    : number;
    carpetaNumero: number;
    carpetaId    : number;
    llaveProceso : string;
  }[],
) {
  for ( const {
    idProceso, carpetaNumero, carpetaId 
  } of procesos ) {
    await sleep(
      1000 
    );

    const fetcherIdProceso = await fetcher(
      idProceso 
    );

    if ( fetcherIdProceso ) {
      await client.actuacion.createMany(
        {
          data          : fetcherIdProceso,
          skipDuplicates: true,
        } 
      );
      await prismaUpdaterActuaciones(
        fetcherIdProceso,
        carpetaNumero,
        carpetaId,
      );
    }

    yield fetcherIdProceso;
  }
}

async function updatePreviousLastActuacion(
  idRegUltimaAct: number | null 
) {
  try {
    if ( idRegUltimaAct === null ) {
      throw new Error(
        'la idRegAct de la ultima actuacion es null' 
      );
    }

    await client.actuacion.update(
      {
        where: {
          idRegActuacion: idRegUltimaAct,
        },
        data: {
          isUltimaAct: false,
        },
      } 
    );
  }
  catch ( error ) {
    console.log(
      `error al cambiar la ultima actuacion: ${ error }` 
    );
  }
}

async function updateCarpetaWithNewLastActuacion(
  {
    ultimaActuacion,
    numero,
    id,
  }: {
    ultimaActuacion: outActuacion;
    numero         : number;
    id             : number;
  } 
) {
  try {
    await client.carpeta.update(
      {
        where: {
          mainId: {
            numero: numero,
            id    : id,
          },
        },
        data: {
          fecha: new Date(
            ultimaActuacion.fechaActuacion 
          ),
          revisado       : false,
          ultimaActuacion: {
            connectOrCreate: {
              where: {
                idRegActuacion: ultimaActuacion.idRegActuacion,
              },
              create: {
                ...ultimaActuacion,
              },
            },
          },
        },
      } 
    );
  }
  catch ( error ) {
    console.log(
      `error al cambiar la carpeta y actualizar la ultima actuacion: ${ error }`,
    );
  }
}

async function prismaUpdaterActuaciones(
  actuacionesComplete: outActuacion[],
  numeroCarpeta: number,
  numeroId: number,
) {
  const [
    ultimaActuacion
  ] = actuacionesComplete.filter(
    (
      a 
    ) => {
      return a.consActuacion === a.cant;
    } 
  );

  try {
    const carpeta = await client.carpeta.findFirstOrThrow(
      {
        where: {
          OR: [
            {
              llaveProceso: ultimaActuacion.llaveProceso,
            },
            {
              numero: numeroCarpeta,
              id    : numeroId,
            },
          ],
        },
      } 
    );

    const incomingDate = new Date(
      ultimaActuacion.fechaActuacion 
    )
      .getTime();

    const savedDate = carpeta.fecha
      ? carpeta.fecha.getTime()
      : null;

    if ( !savedDate || savedDate < incomingDate ) {
      console.log(
        'no hay saved date o la saved date es menor que incoming date',
      );

      await updatePreviousLastActuacion(
        carpeta.idRegUltimaAct 
      );
      await updateCarpetaWithNewLastActuacion(
        {
          ultimaActuacion,
          numero: numeroCarpeta,
          id    : numeroId,
        } 
      );

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
        JSON.stringify(
          ultimaActuacion 
        ),
      );
    }
  }
  catch ( error ) {
    console.log(
      `prisma updater actuaciones error : ${ error }` 
    );
  }
}

async function main() {
  const ActsMap = [];

  const idProcesos = await getIdProcesos();

  for await ( const actuacionesJson of AsyncGenerateActuaciones(
    idProcesos 
  ) ) {
    ActsMap.push(
      actuacionesJson 
    );
  }

  fs.writeFile(
    'actuacionesOutput.json', JSON.stringify(
      ActsMap, null, 2 
    ) 
  );
  return ActsMap;
}

main();
