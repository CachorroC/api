import * as fs from "fs/promises";
import { ClassCarpeta } from "./models/carpeta";
import { RawCarpetas } from "./data/carpetas";
import { sleep } from "./utils/awaiter";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED);
const carpetasMap = RawCarpetas.map((carpeta) => {
  return {
    carpeta: new ClassCarpeta(carpeta),
    numero: Number(carpeta.NUMERO),
  };
});

export async function* generateCarpetas() {
  for await (const { carpeta, numero } of carpetasMap) {
    await sleep(numero);
    await carpeta.getProcesos();
    await carpeta.getActuaciones();
    yield carpeta;
  }
}

async function tryAsyncClassCarpetas() {
  const mapClassCarpetas: Map<number, ClassCarpeta> = new Map();
  for await (const carpeta of generateCarpetas()) {
    mapClassCarpetas.set(carpeta.numero, carpeta);
    await ClassCarpeta.insertCarpeta(carpeta);
  }

  const asAnArray = Array.from(mapClassCarpetas.values());
  fs.writeFile("ClasscarpetasModelPostAwait.json", JSON.stringify(asAnArray));
  return asAnArray;
}

tryAsyncClassCarpetas();
