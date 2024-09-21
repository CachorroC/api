import * as fs from "fs/promises";
import { client } from './prisma';
import { sleep } from '../utils/awaiter';

process.env[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
console.log(
  process.env.NODE_TLS_REJECT_UNAUTHORIZED
);
async function fetcher(
  idProceso: number
) {
  let json;
  try {
    const request = await fetch(
      `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${idProceso}`,
    );
    json = await request.json();
  }
  catch (error) {
    console.log(
      error
    );
  }
  return json;
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
            numero: carpeta.numero,
          };
        }
      );
    }
  );
}

async function* AsyncGenerateActuaciones(
  procesos: { idProceso: number; numero: number }[],
) {
  for ( const { idProceso, numero } of procesos ) {
    console.log(
      numero
    );
    await sleep(
      100
    )
    const fetcherIdProceso = await fetcher(
      idProceso
    );
    yield {fetcher: fetcherIdProceso, numero: numero};
  }
}
async function main() {
  const ActsMap = [];
  const idProcesos = await getIdProcesos();
  for await (const actuacionesJson of AsyncGenerateActuaciones(
    idProcesos
  )) {
    ActsMap.push(
      actuacionesJson
    );
  }
  fs.writeFile(
    "actuacionesFullOutput.json", JSON.stringify(
      ActsMap, null, 2
    )
  );
  return ActsMap;
}
main();
