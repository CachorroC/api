import * as fs from "fs/promises";
import { client } from "./prisma";
import fetchActuaciones from "./fetch-actuaciones";
import { RateLimit } from "async-sema";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED);

async function getIdProcesos() {
  const carpetas = await client.carpeta.findMany();
  return carpetas.flatMap((carpeta) => {
    return carpeta.idProcesos.map((idProceso) => {
      return {
        idProceso,
        numero: carpeta.numero,
      };
    });
  });
}

async function* AsyncGenerateActuaciones(
  procesos: { idProceso: number; numero: number }[],
) {
  for (const { idProceso, numero } of procesos) {
    console.log(numero);

    const fetcherIdProceso = await fetchActuaciones(idProceso);
    yield {
      fetchBody: fetcherIdProceso,
      numero: numero,
    };
  }
}

/*
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
    'actuacionesFullOutput.json', JSON.stringify(
      ActsMap, null, 2
    )
  );
  return ActsMap;
}
 */
async function main() {
  const ActsMap = [];

  const idProcesos = await getIdProcesos();

  const lim = RateLimit(5);

  for (const { idProceso, numero } of idProcesos) {
    await lim();

    const acts = await fetchActuaciones(idProceso, numero);
    ActsMap.push(acts);
  }

  fs.writeFile("actuacionesFullOutput.json", JSON.stringify(ActsMap, null, 2));
  return ActsMap;
}

main();
console.log("the end");
