/**
 * @fileoverview Procesos Module - Legal Process Fetcher and Syncer
 * 
 * This module is responsible for:
 * 1. Fetching legal processes from the Colombian Judiciary API (Rama Judicial)
 * 2. Mapping process data to internal models with proper type conversions
 * 3. Syncing process information to the database via Prisma ORM
 * 4. Managing async iterations over multiple case folders (carpetas)
 * 
 * Workflow:
 * - main() → Retrieves all case folders (carpetas) from database
 * - getLLaves() → Extracts process keys and folder metadata
 * - AsyncGenerateActuaciones() → Async generator that processes each folder
 * - fetcher() → Fetches process list from Colombian Judiciary API
 * - prismaUpdaterProcesos() → Persists process data to database
 * 
 * @module procesos
 */

import * as fs from 'fs/promises';
import { ConsultaProcesos, outProceso } from './types/procesos.js';
import JuzgadoClass from './models/juzgado.js';
import { ClassProcesos } from './models/procesos.js';
import { client } from './services/prisma.js';

/**
 * Fetches legal processes from the Colombian Judiciary API.
 * 
 * This function queries the official Rama Judicial API endpoint to retrieve all processes
 * associated with a given case number (llaveProceso). It performs the following:
 * - Makes an HTTPS request to the Judiciary API
 * - Parses the JSON response containing process information
 * - Transforms date strings to JavaScript Date objects
 * - Maps judicial data to court (Juzgado) information
 * - Filters out private/confidential processes
 * 
 * @async
 * @param {string} llaveProceso - The case filing number (radicación) as the unique identifier
 * @returns {Promise<outProceso[]>} Array of transformed process objects with metadata,
 *                                 or empty array if request fails
 * @throws {Error} Logs errors but returns empty array instead of throwing
 * 
 * @example
 * const processes = await fetcher('2024-1234-567');
 * console.log(processes[0].idProceso); // Process identifier
 * console.log(processes[0].juzgado); // Court information
 */
async function fetcher(
  llaveProceso: string 
): Promise<outProceso[]> {
  try {
    const request = await fetch(
      `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ llaveProceso }&SoloActivos=false&pagina=1`,
    );

    if ( !request.ok ) {
      throw new Error(
        `${ llaveProceso }: ${ request.status } ${
          request.statusText
        }${ JSON.stringify(
          request, null, 2 
        ) }`,
      );
    }

    const json = ( await request.json() ) as ConsultaProcesos;

    const {
      procesos 
    } = json;

    return procesos.map(
      (
        proceso 
      ) => {
        return {
          ...proceso,
          idProceso: String(
            proceso.idProceso 
          ),
          fechaProceso: proceso.fechaProceso
            ? new Date(
                proceso.fechaProceso 
              )
            : null,
          fechaUltimaActuacion: proceso.fechaUltimaActuacion
            ? new Date(
                proceso.fechaUltimaActuacion 
              )
            : null,
          juzgado: JuzgadoClass.fromProceso(
            proceso 
          ),
        };
      } 
    );
  } catch ( error ) {
    console.log(
      error 
    );

    return [];
  }
}

/**
 * Retrieves all case filing numbers and metadata from the database.
 * 
 * This function queries the Prisma database to extract all stored carpetas (case folders)
 * and returns their essential identifiers needed for process fetching. The returned objects
 * contain the minimal information required to coordinate process synchronization.
 * 
 * @async
 * @returns {Promise<Array<{llaveProceso: string, numero: number, id: number}>>} 
 *          Array of objects containing:
 *          - llaveProceso: The case filing number (process key)
 *          - numero: Internal case folder number
 *          - id: Database primary key for the case folder
 * 
 * @example
 * const carpetas = await getLLaves();
 * // Returns: [{ llaveProceso: '2024-1234-567', numero: 1, id: 101 }, ...]
 */
async function getLLaves() {
  const carpetas = await client.carpeta.findMany();

  return carpetas.flatMap(
    (
      carpeta 
    ) => {
      return {
        llaveProceso: carpeta.llaveProceso.trim(),
        numero      : carpeta.numero,
        id          : carpeta.id,
      };
    } 
  );
}

/**
 * Asynchronous generator that processes legal processes for multiple case folders.
 * 
 * This generator implements the main workflow for synchronizing process data:
 * 1. Iterates through each case folder (carpeta)
 * 2. Fetches processes for the folder from the Judiciary API
 * 3. Updates the database with new processes
 * 4. Yields the ClassProcesos instance for the caller to handle
 *
 * This approach allows for streaming processing without loading all data into memory.
 * 
 * @async
 * @generator
 * @param {Array<{llaveProceso: string, id: number, numero: number}>} llaves 
 *        Array of case folder metadata with process keys and identifiers
 * @yields {ClassProcesos} Instance containing synchronized process data for each folder
 * 
 * @example
 * const llaves = await getLLaves();
 * for await (const procesos of AsyncGenerateActuaciones(llaves)) {
 *   console.log(`Synced ${procesos.procesos.length} processes`);
 * }
 */
async function* AsyncGenerateActuaciones(
  llaves: { llaveProceso: string; id: number; numero: number }[],
) {
  for ( const carpeta of llaves ) {
    const newProceso = await ClassProcesos.getProcesos(
      carpeta.llaveProceso,
      carpeta.numero,
    );

    const fetcherIdProceso = await fetcher(
      carpeta.llaveProceso 
    );

    for ( const proceso of fetcherIdProceso ) {
      if ( !proceso.esPrivado ) {
        await prismaUpdaterProcesos(
          proceso, carpeta.numero 
        );
      }
    }

    newProceso.prismaUpdateProcesos();

    yield newProceso;
  }
}

/**
 * Synchronizes a single legal process to the database via Prisma.
 * 
 * This function performs the following operations:
 * 1. Retrieves existing process IDs from the database for the given case folder
 * 2. Adds the new process ID to the set of processes for this folder
 * 3. Creates or connects the associated court (Juzgado) record
 * 4. Either creates a new process record or connects to an existing one
 * 5. Updates the case folder with the modified process list
 *
 * Uses Prisma's `connectOrCreate` pattern to safely handle both new and existing records.
 * 
 * @async
 * @param {outProceso} proceso - The process object fetched from the Judiciary API,
 *                              containing all process metadata
 * @param {number} numero - The internal case folder number to update
 * @returns {Promise<void>} Completes when the database update finishes
 * @throws {Error} Logs errors to console but does not throw to prevent sync interruption
 */
async function prismaUpdaterProcesos(
  proceso: outProceso, numero: number
) {
  const idProcesosSet = new Set<string>();

  try {
    const carpeta = await client.carpeta.findFirstOrThrow(
      {
        where: {
          numero: numero,
        },
      } 
    );

    carpeta.idProcesos.forEach(
      (
        idProceso 
      ) => {
        idProcesosSet.add(
          idProceso 
        );
      } 
    );

    idProcesosSet.add(
      proceso.idProceso 
    );

    const updater = await client.carpeta.update(
      {
        where: {
          numero: numero,
        },
        data: {
          idProcesos: {
            set: Array.from(
              idProcesosSet 
            ),
          },
          procesos: {
            connectOrCreate: {
              where: {
                idProceso: proceso.idProceso,
              },
              create: {
                ...proceso,
                juzgado: {
                  connectOrCreate: {
                    where: {
                      id_tipo_ciudad: {
                        tipo  : proceso.juzgado.tipo,
                        id    : proceso.juzgado.id,
                        ciudad: proceso.juzgado.ciudad,
                      },
                    },
                    create: {
                      tipo  : proceso.juzgado.tipo,
                      id    : proceso.juzgado.id,
                      ciudad: proceso.juzgado.ciudad,
                      url   : proceso.juzgado.url,
                    },
                  },
                },
              },
            },
          },
        },
      } 
    );

    console.log(
      updater 
    );
  } catch ( error ) {
    console.log(
      error 
    );
  }
}

/**
 * Main entry point for the process synchronization workflow.
 * 
 * This is the orchestrator function that:
 * 1. Loads all case folder keys from the database
 * 2. Iterates through each folder using the async generator
 * 3. Collects processed folder data into an array
 * 4. Writes all results to a JSON file (actuacionesOutput.json)
 * 5. Returns the accumulated process data
 *
 * Workflow:
 * ```
 * Database Carpetas → getLLaves() → AsyncGenerateActuaciones()
 *                                   → prismaUpdaterProcesos()
 *                                   → Output JSON File
 * ```
 * 
 * @async
 * @returns {Promise<ClassProcesos[]>} Array of ClassProcesos instances containing
 *                                     synchronized process data for each folder
 */
async function main() {
  const ActsMap = [];

  const idProcesos = await getLLaves();

  console.log(
    idProcesos 
  );

  for await ( const actuacionesJson of AsyncGenerateActuaciones(
    idProcesos 
  ) ) {
    console.log(
      actuacionesJson 
    );
    ActsMap.push(
      actuacionesJson 
    );
  }

  fs.writeFile(
    'actuacionesOutput.json', JSON.stringify(
      ActsMap 
    ) 
  );

  return ActsMap;
}

main();
