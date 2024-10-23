import xlsx, { utils } from 'xlsx';
import * as fs from 'fs/promises';

const workbook = xlsx.readFile(
  '/home/cachorro_cami/OneDrive/bases_de_datos/general.xlsx',
  {
    cellDates: true,
  },
);

const {
  SheetNames, Sheets
} = workbook;

const sheets = SheetNames.map(
  sheetName => {
    return {
      name : sheetName,
      sheet: utils.sheet_to_json(
        Sheets[ sheetName ]
      )
    };
  }
);

fs.writeFile(
  'arrayofsheets.json', JSON.stringify(
    sheets
  )
);
