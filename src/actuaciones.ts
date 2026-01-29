import { ConsultaActuacion, intActuacion } from './types/actuaciones.js';
import { client } from './services/prisma.js';
import { sleep } from './utils/awaiter.js';
import Actuacion from './models/actuacion.js';
import { RobustApiClient } from './utils/fetcher.js';

async function fetcher(
  idProceso: number 
) {
  console.log(
    `fetching idProceso: ${ idProceso }` 
  );

  await sleep(
    10000 
  );

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
        const {
          fechaActuacion,
          fechaRegistro,
          fechaFinal,
          fechaInicial,
          consActuacion,
          cant,
          idRegActuacion,
        } = actuacion;

        return {
          ...actuacion,
          fechaActuacion: new Date(
            fechaActuacion 
          ),
          fechaRegistro: new Date(
            fechaRegistro 
          ),
          fechaInicial: fechaInicial
            ? new Date(
              fechaInicial 
            )
            : null,
          fechaFinal: fechaFinal
            ? new Date(
              fechaFinal 
            )
            : null,
          isUltimaAct: cant === consActuacion,
          idProceso  : idProceso,
          createdAt  : new Date(
            fechaRegistro 
          ),
          idRegActuacion: `${ idRegActuacion }`,
        };
      } 
    );
  } catch ( error ) {
    console.log(
      error 
    );

    return null;
  }
}

async function getIdProcesos() {
  const carpetas = await client.carpeta.findMany();

  return carpetas
    .flatMap(
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
    )
    .sort(
      (
        a, b 
      ) => {
        return b.carpetaNumero - a.carpetaNumero;
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
      10000 
    );

    const fetcherIdProceso = await fetcher(
      idProceso 
    );

    if ( fetcherIdProceso && fetcherIdProceso.length > 0 ) {
      const actsActualizadas = await Actuacion.updateAllActuaciones(
        fetcherIdProceso,
        carpetaNumero,
      );

      console.log(
        actsActualizadas 
      );
      await Actuacion.prismaUpdaterActuaciones(
        fetcherIdProceso,
        carpetaNumero,
        carpetaId,
      );
    }

    yield fetcherIdProceso;
  }
}

/* async function main() {
  const ActsMap = [];

  const idProcesos = await getIdProcesos();

  for await (const actuacionesJson of AsyncGenerateActuaciones(
    idProcesos
  )) {
    ActsMap.push(actuacionesJson);
  }

  fs.writeFile(
    'actuacionesOutput.json',
    JSON.stringify(ActsMap, null, 2)
  );
  return ActsMap;
}

main();*/

// 1. Setup
const api = new RobustApiClient(
  'https://consultaprocesos.ramajudicial.gov.co:448',
); // Example URL

// 2. Define Types
// This is the object you use to build the URL (e.g. a process ID)
interface ProcessRequest {
  idProceso    : number; // "11001..."
  carpetaNumero: number;
  llaveProceso : string;
  carpetaId    : number;
}

// This is what a single item inside the "actuaciones" array looks like

// 3. Execution
async function runSync() {
  // The list of processes we want to check
  const processesToCheck: ProcessRequest[] = await getIdProcesos();

  await api.processActuaciones<ProcessRequest>(
    processesToCheck,

    // Step 1: Build URL
    (
      proc 
    ) => {
      return `/api/v2/Proceso/Actuaciones/${ proc.idProceso }`;
    },

    // Step 2: Handle Database (Runs once for EACH item in the 'actuaciones' array)
    async (
      actuacion: intActuacion, parentProc 
    ) => {
      // Perform Prisma Upsert
      await client.actuacion.upsert(
        {
          where: {
          // Assuming 'idReg' comes from API and is unique
            idRegActuacion: `${ actuacion.idRegActuacion }`,
          },
          update: {
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
            isUltimaAct   : actuacion.cant === actuacion.consActuacion,
            consActuacion : actuacion.consActuacion,
            idRegActuacion: `${ actuacion.idRegActuacion }`,
          },
          create: {
            idRegActuacion: `${ actuacion.idRegActuacion }`,
            idProceso     : parentProc.idProceso, // Linking back to our local Parent ID
            consActuacion : actuacion.consActuacion,
            actuacion     : actuacion.actuacion,
            anotacion     : actuacion.anotacion,
            cant          : actuacion.cant,
            carpetaNumero : parentProc.carpetaNumero,
            codRegla      : actuacion.codRegla,
            conDocumentos : actuacion.conDocumentos,
            createdAt     : new Date(),
            llaveProceso  : parentProc.llaveProceso,
            fechaRegistro : new Date(
              actuacion.fechaRegistro 
            ),
            proceso: {
              connect: {
                idProceso: parentProc.idProceso,
              },
            },
            fechaActuacion: new Date(
              actuacion.fechaActuacion 
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
          },
        } 
      );
    },
  );

  console.log(
    'Sync Complete' 
  );
}

runSync();
