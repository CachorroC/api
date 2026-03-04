import * as fs from 'fs/promises';
import { client } from './prisma.js';
import { RateLimit } from 'async-sema';
import fetchActuacionesRaw from './fetch-actuaciones.js';

async function getIdProcesos() {
  const carpetas = await client.carpeta.findMany(
    {
      take: 100,
    } 
  );

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

async function main() {
  const ActsMap = [];

  const idProcesos = await getIdProcesos();

  const lim = RateLimit(
    5 
  );

  for ( const [
    index,
    parentItem
  ] of idProcesos.entries() ) {
    const {
      idProceso, numero 
    } = parentItem;
    console.log(
      `🌐 [${ index + 1 }/${ idProcesos.length }] Fetching: ${ numero }` 
    );

    await lim();

    const acts = await fetchActuacionesRaw(
      idProceso 
    );

    ActsMap.push(
      acts 
    );
  }

  console.log(
    `finished processing actuaciones ${ ActsMap.length }` 
  );

  fs.writeFile(
    'actuacionesFullOutput.json', JSON.stringify(
      ActsMap, null, 2 
    ) 
  );

  return ActsMap;
}

main();
console.log(
  'the end' 
);
