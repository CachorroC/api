/**
 * @module models/procesos
 * @description Judicial Processes Collection Model
 *
 * Manages aggregated legal processes associated with a single case folder (carpeta).
 * Deduplicates process IDs and synchronizes process records with Prisma database,
 * including related court information (juzgado).
 *
 * PROCESS SYNCHRONIZATION WORKFLOW:
 * Constructor: Filter private processes → add to Set (deduplication)
 *   ↓
 * prismaUpdateProcesos():
 *   1. Find existing carpeta in database
 *   2. Merge existing process IDs with new ones
 *   3. Apply upsert logic: connectOrCreate for each process
 *   4. Create court record if needed (connectOrCreate on juzgado)
 *   ↓
 * Database update with atomic transaction
 *
 * DEDUPLICATION STRATEGY:
 * Uses Set<string> (idProcesosSet) to prevent duplicate process IDs.
 * Only adds publicly visible processes (esPrivado = false).
 * Merges with existing database processes to maintain history.
 */

import { client } from '../services/connection/prisma';
import { ConsultaProcesos, outProceso } from '../types/procesos.js';
import JuzgadoClass from './juzgado.js';

/**
 * @class ClassProcesos
 * @description Manages collection of legal processes for a single case folder.
 * Handles deduplication, database synchronization, and court record creation.
 *
 * @property {Set<string>} idProcesosSet - Deduplication set of process identifiers
 * @property {outProceso[]} procesos - Array of public (visible) process records
 * @property {number} numero - Case folder number (carpetaNumero)
 * @property {number} carpetaId - Database ID reference for the parent case folder
 *
 * @constructor
 * @param {outProceso[]} procesos - Array of process objects from API response
 * @param {number} numero - Folder number from parent carpeta
 * @param {number} carpetaId - Database primary key of parent carpeta
 *
 * @example
 * const procesos = new ClassProcesos(apiProcesos, 123456, dbId);
 * const result = await procesos.prismaUpdateProcesos();
 */
export class ClassProcesos {
  idProcesosSet: Set<string> = new Set();
  procesos     : outProceso[] = [];
  numero       : number;
  carpetaId    : number;
  constructor(
    procesos: outProceso[], numero: number, carpetaId: number 
  ) {
    this.carpetaId = carpetaId;
    this.numero = numero;

    procesos.forEach(
      (
        proceso 
      ) => {
        if ( !proceso.esPrivado ) {
          this.procesos.push(
            proceso 
          );
          this.idProcesosSet.add(
            proceso.idProceso 
          );
        }
      } 
    );
  }
  async prismaUpdateProcesos() {
    try {
      const carpeta = await client.carpeta.findFirstOrThrow(
        {
          where: {
            numero: this.numero,
          },
        } 
      );

      carpeta.idProcesos.forEach(
        (
          idProceso 
        ) => {
          this.idProcesosSet.add(
            idProceso 
          );
        } 
      );

      const updater = await client.carpeta.update(
        {
          where: {
            numero: this.numero,
          },
          data: {
            idProcesos: {
              set: Array.from(
                this.idProcesosSet 
              ),
            },
            procesos: {
              connectOrCreate: this.procesos.map(
                (
                  proceso 
                ) => {
                  return {
                    where: {
                      idProceso: proceso.idProceso,
                    },
                    create: {
                      ...proceso,
                      juzgado: {
                        connectOrCreate: {
                          where: {
                            id_tipo_ciudad: {
                              id    : proceso.juzgado.id,
                              tipo  : proceso.juzgado.tipo,
                              ciudad: proceso.juzgado.ciudad,
                            },
                          },
                          create: proceso.juzgado,
                        },
                      },
                    },
                  };
                } 
              ),
            },
          },
        } 
      );

      console.log(
        updater 
      );

      return updater;
    } catch ( error ) {
      console.log(
        error 
      );

      return null;
    }
  }
  static async getProcesos(
    llaveProceso: string, numero = 0, carpetaId = 0 
  ) {
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

      const mappedprocesos = procesos.map(
        (
          proceso 
        ) => {
          return {
            ...proceso,
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

      return new ClassProcesos(
        [
          ...mappedprocesos
        ].map(
          (
            proceso 
          ) => {
            return {
              ...proceso,
              idProceso: String(
                proceso.idProceso 
              ),
            };
          } 
        ),
        numero,
        carpetaId,
      );
    } catch ( error ) {
      console.log(
        error 
      );

      return new ClassProcesos(
        [], numero, carpetaId 
      );
    }
  }
}
