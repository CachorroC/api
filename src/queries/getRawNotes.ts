import { rawCarpetas } from '../assets/carpetas';


function getRawNotes() {
  const RawCarpetas = rawCarpetas();
  const notes = [];

  for ( const carpeta of RawCarpetas ) {
    const {
      EXTRA, EXTRA2, OBSERVACIONES, NUMERO
    } = carpeta;

    const note = {
      numero: NUMERO,
      note  : OBSERVACIONES,
      extra : EXTRA,
      extra2: EXTRA2,
      total : [
        ...EXTRA || [],
        ...EXTRA2 || [],
        ...OBSERVACIONES || []
      ]
    };

    notes.push(
      note
    );
  }

  return notes;
}