import * as fs from 'fs/promises';
import { ClassCarpeta } from './models/carpeta';
import { RawCarpetas } from './data/carpetas';

const carpetasMap = RawCarpetas.map(
  (
    carpeta 
  ) => {
    return new ClassCarpeta(
      carpeta 
    );
  } 
);

export async function* generateCarpetas() {
  for await ( const carpeta of carpetasMap ) {
    await carpeta.getProcesosByName();
    await carpeta.getActuaciones();
    yield carpeta;
  }
}

async function tryAsyncClassCarpetas() {
  const mapClassCarpetas: Map<number, ClassCarpeta> = new Map();

  for await ( const carpeta of generateCarpetas() ) {
    mapClassCarpetas.set(
      carpeta.numero, carpeta 
    );
  }

  fs.writeFile(
    'ClasscarpetasModelPostAwait.json',
    JSON.stringify(
      Array.from(
        mapClassCarpetas.values() 
      ) 
    ),
  );

  const asAnArray = Array.from(
    mapClassCarpetas.values() 
  );

  return asAnArray;
}

tryAsyncClassCarpetas();
