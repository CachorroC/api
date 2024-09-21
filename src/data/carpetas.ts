import xlsx from "xlsx";
import { Category } from "../types/carpetas";
import * as fs from "fs/promises";
import { RawDb } from "../types/raw-db";

const workbook = xlsx.readFile(
  "/home/cachorro_cami/OneDrive/bases_de_datos/general.xlsx",
  {
    cellDates: true,
  },
);

const { SheetNames, Sheets } = workbook;
const outputSheets: unknown[] = [];

const mapperSheets = SheetNames.flatMap((sheetname) => {
  const sheet = Sheets[sheetname];

  const tableSheet = xlsx.utils.sheet_to_json<RawDb>(sheet);
  outputSheets.push(tableSheet);
  return tableSheet.map((table) => {
    return {
      ...table,
      category: sheetname as Category,
    };
  });
});

fs.writeFile("outputSheets.json", JSON.stringify(outputSheets));

export const RawCarpetas = [...mapperSheets].sort((a, b) => {
  const categoriaImplicitaA = a.category;
  const categoriaImplicitaB = b.category;
  const x = a.NUMERO;

  const y = b.NUMERO;
  if (categoriaImplicitaA === "Terminados") {
    console.log("a es terminado");
    return -1;
  } else if (categoriaImplicitaB === "Terminados") {
    console.log("b es terminado");
    return 1;
  }

  if (x < y) {
    return -1;
  } else if (x > y) {
    return 1;
  }

  return 0;
});

fs.writeFile("carpetas.json", JSON.stringify(RawCarpetas, null, 2));
