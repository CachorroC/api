import { RawCarpetas } from './data/carpetas.js';
import { ClassCarpeta } from './models/carpeta.js';

export async function* generateCarpetas(carpetasMap: { carpeta: ClassCarpeta, numero: number }[]) {
  for await (const { carpeta } of carpetasMap) {
    console.log(`carpeta numero ${carpeta.numero}`);
    await carpeta.getProcesos();
    await carpeta.getActuaciones();
    yield carpeta;
  }
}

async function tryAsyncClassCarpetas() {
  // Now that ClassCarpeta is defined, we can map the raw data
  const carpetasMap = RawCarpetas.map((carpeta) => {
    return {
      carpeta: new ClassCarpeta(carpeta),
      numero: Number(carpeta.NUMERO),
    };
  });

  const mapClassCarpetas: Map<number, ClassCarpeta> = new Map();

  for await (const carpeta of generateCarpetas(carpetasMap)) {
    mapClassCarpetas.set(carpeta.numero, carpeta);
    await ClassCarpeta.insertCarpeta(carpeta);
  }

  const asAnArray = Array.from(mapClassCarpetas.values());
  return asAnArray;
}

// Start execution
tryAsyncClassCarpetas();