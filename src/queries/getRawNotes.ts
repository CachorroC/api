import { rawCarpetas } from '../assets/carpetas';
import * as fs from 'node:fs';


export function getRawNotes() {
  const RawCarpetas = rawCarpetas();
  const notes = [];

  for ( const carpeta of RawCarpetas ) {
    const {
      EXTRA, EXTRA2, OBSERVACIONES, NUMERO
    } = carpeta;

    const note = {
      numero: NUMERO,
      notes : [
        EXTRA || '',
        EXTRA2 || '',
        OBSERVACIONES || ''
      ]
    };

    notes.push(
      note
    );
  }

  fs.writeFileSync(
    'notes.json', JSON.stringify(
      notes, null, 2
    )
  );

  return notes;
}