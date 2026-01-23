import xlsx from "xlsx";
import { Category } from "../types/carpetas.js";
import * as fs from "fs/promises";
import { RawDb } from "../types/raw-db.js";

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
  const x = a.NUMERO;

  const y = b.NUMERO;

  if (x < y) {
    return -1;
  } else if (x > y) {
    return 1;
  }

  return 0;
});

fs.writeFile("carpetas.json", JSON.stringify(RawCarpetas, null, 2));

const outputData: string[] = [];
RawCarpetas.forEach((carpeta, index) => {
  const newString = `${
    Number(carpeta.NUMERO) === index + 1
  } numero: ${carpeta.NUMERO}, index:${index + 1} `;
  console.log(newString);
  outputData.push(newString);
});
fs.writeFile("numbers.json", JSON.stringify(outputData, null, 2));
