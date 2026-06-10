import fs from 'node:fs/promises';
import path from 'node:path';
import { sleep } from '../utils/awaiter.js';

/**
 * 5 requests/min limit -> 1 request every 12 seconds.
 */
const RATE_LIMIT_DELAY_MS = 12000;

const MAX_ATTEMPTS = 10;

const FIRST_LLAVE_PROCESO = 1;

const LAST_LLAVE_PROCESO = 700;

function buildUrl(
  llaveProceso: string
): string {
  return `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=110014003039202600${ llaveProceso }00&SoloActivos=false&pagina=1`;
}

type ProcesoResult = {
  llaveProceso: string;
  data        : unknown;
  error?: {
    status  : number | null;
    message : string;
    attempts: number;
  };
};

/**
 * Fetches a single radicación, retrying up to {@link MAX_ATTEMPTS} times
 * (always respecting the rate limit). If every attempt fails, returns an
 * error record instead of throwing, so the caller can move on to the next number.
 */
async function fetchProceso(
  llaveProceso: string
): Promise<ProcesoResult> {
  const url = buildUrl(
    llaveProceso
  );

  let lastStatus: number | null = null;
  let lastMessage = 'Unknown error';

  for ( let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++ ) {
    await sleep(
      RATE_LIMIT_DELAY_MS
    );

    try {
      const response = await fetch(
        url
      );

      if ( response.ok ) {
        return {
          llaveProceso,
          data: await response.json()
        };
      }

      lastStatus = response.status;
      lastMessage = response.statusText;
      console.warn(
        `⚠️ ${ llaveProceso }: HTTP ${ response.status } (attempt ${ attempt }/${ MAX_ATTEMPTS })`
      );
    } catch ( error ) {
      lastStatus = null;
      lastMessage = error instanceof Error
        ? error.message
        : String(
            error
          );
      console.error(
        `📡 ${ llaveProceso }: ${ lastMessage } (attempt ${ attempt }/${ MAX_ATTEMPTS })`
      );
    }
  }

  return {
    llaveProceso,
    data : null,
    error: {
      status  : lastStatus,
      message : lastMessage,
      attempts: MAX_ATTEMPTS
    }
  };
}

export async function run(
  first = FIRST_LLAVE_PROCESO,
  last = LAST_LLAVE_PROCESO
): Promise<ProcesoResult[]> {
  const results: ProcesoResult[] = [];

  for ( let i = first; i <= last; i++ ) {
    const llaveProceso = String(
      i
    ).padStart(
      3, '0'
    );

    const result = await fetchProceso(
      llaveProceso
    );

    results.push(
      result
    );

    if ( result.error ) {
      console.log(
        `❌ ${ llaveProceso } failed after ${ result.error.attempts } attempts (${ i }/${ last })`
      );
    } else {
      console.log(
        `✅ ${ llaveProceso } done (${ i }/${ last })`
      );
    }
  }

  return results;
}

/**
 * Merges freshly fetched results into the existing output file, replacing any
 * previous entry that shares the same numeric `llaveProceso` (so re-running a
 * sub-range, e.g. to fix a padding bug, overwrites only those entries) and
 * keeping every other entry untouched. Returns the merged, sorted array.
 */
async function mergeAndWrite(
  newResults: ProcesoResult[], outPath: string
): Promise<ProcesoResult[]> {
  let existing: ProcesoResult[] = [];

  try {
    const raw = await fs.readFile(
      outPath, 'utf-8'
    );

    existing = JSON.parse(
      raw
    );
  } catch {
    existing = [];
  }

  const merged = new Map<number, ProcesoResult>();

  for ( const item of [
    ...existing,
    ...newResults
  ] ) {
    merged.set(
      parseInt(
        item.llaveProceso, 10
      ), item
    );
  }

  const sorted = [ ...merged.entries() ]
    .sort(
      (
        [ a ], [ b ]
      ) => a - b
    )
    .map(
      (
        [ , value ]
      ) => value
    );

  await fs.writeFile(
    outPath, JSON.stringify(
      sorted, null, 2
    )
  );

  return sorted;
}

if ( process.argv[ 1 ].includes(
  'consulta-39cm-radicacion'
) ) {
  const first = process.argv[ 2 ] ? Number(
    process.argv[ 2 ]
  ) : FIRST_LLAVE_PROCESO;
  const last = process.argv[ 3 ] ? Number(
    process.argv[ 3 ]
  ) : LAST_LLAVE_PROCESO;

  run(
    first, last
  )
    .then(
      async (
        results
      ) => {
        const outPath = path.join(
          process.cwd(), '001-700-39cm-request.json'
        );

        const merged = await mergeAndWrite(
          results, outPath
        );

        console.log(
          `Saved ${ merged.length } results to ${ outPath }`
        );
      }
    )
    .catch(
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
}
