import * as fs from 'fs/promises';
import {
  ConsultaActuacion,
  outActuacion,
} from './types/actuaciones';
import { client } from './services/prisma';
import { sleep } from './utils/awaiter';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED);

import { Prisma } from '@prisma/client';
import Actuacion from './models/actuacion';
import { RobustApiClient } from './utils/fetcher';
async function fetcher(idProceso: number) {
  console.log(`fetching idProceso: ${idProceso}`);

  await sleep(10000);
  try {
    const request = await fetch(
      `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${idProceso}`
    );

    if (!request.ok) {
      throw new Error(
        `${idProceso}: ${request.status} ${
          request.statusText
        }${JSON.stringify(request, null, 2)}`
      );
    }

    const json =
      (await request.json()) as ConsultaActuacion;

    const { actuaciones } = json;

    return actuaciones.map((actuacion) => {
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
        fechaActuacion: new Date(fechaActuacion),
        fechaRegistro: new Date(fechaRegistro),
        fechaInicial: fechaInicial
          ? new Date(fechaInicial)
          : null,
        fechaFinal: fechaFinal
          ? new Date(fechaFinal)
          : null,
        isUltimaAct: cant === consActuacion,
        idProceso: idProceso,
        createdAt: new Date(fechaRegistro),
        idRegActuacion: `${idRegActuacion}`,
      };
    });
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getIdProcesos() {
  const carpetas = await client.carpeta.findMany();
  return carpetas
    .flatMap((carpeta) => {
      return carpeta.idProcesos.map((idProceso) => {
        return {
          idProceso,
          carpetaNumero: carpeta.numero,
          llaveProceso: carpeta.llaveProceso,
          carpetaId: carpeta.id,
        };
      });
    })
    .sort((a, b) => {
      return b.carpetaNumero - a.carpetaNumero;
    });
}
async function* AsyncGenerateActuaciones(
  procesos: {
    idProceso: number;
    carpetaNumero: number;
    carpetaId: number;
    llaveProceso: string;
  }[]
) {
  for (const {
    idProceso,
    carpetaNumero,
    carpetaId,
  } of procesos) {
    await sleep(10000);

    const fetcherIdProceso = await fetcher(idProceso);

    if (fetcherIdProceso && fetcherIdProceso.length > 0) {
      const actsActualizadas =
        await Actuacion.updateAllActuaciones(
          fetcherIdProceso,
          carpetaNumero
        );
      console.log(actsActualizadas);
      await Actuacion.prismaUpdaterActuaciones(
        fetcherIdProceso,
        carpetaNumero,
        carpetaId
      );
    }
    yield fetcherIdProceso;
  }
}

async function main() {
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

main();
