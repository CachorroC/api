import { ClassCarpeta } from './models/carpeta.js';
import { RawCarpetas } from './data/carpetas.js';
import { sleep } from './utils/awaiter.js';
import { wait } from './utils/fetcher.js';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED);
const carpetasMap = RawCarpetas.map((carpeta) => {
  return {
    carpeta: new ClassCarpeta(carpeta),
    numero: Number(carpeta.NUMERO),
  };
});

export async function* generateCarpetas() {
  for await (const { carpeta } of carpetasMap) {
    /*  if (
      carpeta.category === 'Terminados'
    ) {
      yield carpeta;
    } */

    console.log(`carpeta numero ${carpeta.numero}`);
    await sleep(10000);
    await carpeta.getProcesos();
    await carpeta.getActuaciones();
    yield carpeta;
  }
}

async function tryAsyncClassCarpetas() {
  const mapClassCarpetas: Map<number, ClassCarpeta> =
    new Map();

  for await (const carpeta of generateCarpetas()) {
    mapClassCarpetas.set(carpeta.numero, carpeta);

    /* if ( carpeta.category === 'Terminados' ) {
      continue;
    }
 */
    await ClassCarpeta.insertCarpeta(carpeta);
  }

  const asAnArray = Array.from(mapClassCarpetas.values());

  return asAnArray;
}

tryAsyncClassCarpetas();
