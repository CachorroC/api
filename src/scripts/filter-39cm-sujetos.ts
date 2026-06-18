import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
  import.meta.url
);
const __dirname = dirname(
  __filename
);

const BANCOLOMBIA_REGEX = /demandante:\s+bancolombia/i;
const ANDREA_REGEX = /andrea/i;

interface Proceso {
  sujetosProcesales: string;
  [ key: string ]: unknown;
}

interface RequestEntry {
  llaveProceso: string;
  data: {
    procesos: Proceso[];
    [ key: string ]: unknown;
  };
}

async function main(): Promise<void> {
  const inputPath = join(
    __dirname, '..', '..', '001-700-39cm-request.json'
  );
  const outputPath = join(
    __dirname, '..', '..', 'matched_names_39cm_001_700.json'
  );

  const raw = await readFile(
    inputPath, 'utf-8'
  );
  const entries: RequestEntry[] = JSON.parse(
    raw
  );

  const matched = entries.filter(
    (
      entry
    ) => entry.data.procesos.some(
      (
        proceso
      ) => BANCOLOMBIA_REGEX.test(
        proceso.sujetosProcesales
      ) || ANDREA_REGEX.test(
        proceso.sujetosProcesales
      )
    )
  );

  const output = JSON.stringify(
    matched, null, 2
  );

  console.log(
    output
  );

  await writeFile(
    outputPath, output, 'utf-8'
  );

  console.log(
    `\nMatched ${ matched.length } of ${ entries.length } entries. Saved to ${ outputPath }`
  );
}

main().catch(
  (
    err
  ) => {
    console.error(
      'Execution failed:', err
    );
    process.exit(
      1
    );
  }
);
