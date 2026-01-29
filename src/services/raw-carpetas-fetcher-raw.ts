import * as fs from 'fs/promises';
import { RawCarpetas } from '../data/carpetas.js';
import JuzgadoClass from '../models/juzgado.js';
import { ConsultaActuacion, outActuacion } from '../types/actuaciones.js';
import { ConsultaProcesos, DetalleProceso } from '../types/procesos.js';
import { sleep } from '../utils/awaiter.js';

export const ramaJudicialBaseURL
  = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/';

/* TODO hacer la clase de proceso que tenga como entrada el idProceso y mas bien  desde la carpeta pedir los procesos disponibles con esa clase proceso a partir de los procesos que salgan en llave proceso */

export class ProcesoJudicial {
  idProceso      : number;
  numero         : number;
  llaveProceso   : string;
  actuaciones    : outActuacion[] = [];
  ultimaActuacion: outActuacion | null = null;
  fecha          : Date | null = null;
  idRegUltimaAct : number | null = null;
  detalleProceso : DetalleProceso | null = null;
  constructor(
    numero: number, idProceso: number, llaveProceso: string 
  ) {
    this.idProceso = idProceso;
    this.numero = numero;
    this.llaveProceso = llaveProceso;
  }

  async getActuaciones() {
    try {
      const request = await fetch(
        `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${ this.idProceso }`,
      );

      if ( !request.ok ) {
        throw new Error(
          request.statusText 
        );
      }

      const consultaActuaciones = ( await request.json() ) as ConsultaActuacion;

      const {
        actuaciones 
      } = consultaActuaciones;

      const outActuaciones = actuaciones.map(
        (
          actuacion 
        ) => {
          return {
            ...actuacion,
            idProceso     : this.idProceso,
            isUltimaAct   : actuacion.cant === actuacion.consActuacion,
            fechaActuacion: new Date(
              actuacion.fechaActuacion 
            ),
            fechaRegistro: new Date(
              actuacion.fechaRegistro 
            ),
            fechaInicial: actuacion.fechaInicial
              ? new Date(
                actuacion.fechaInicial 
              )
              : null,
            fechaFinal: actuacion.fechaFinal
              ? new Date(
                actuacion.fechaFinal 
              )
              : null,
            createdAt: new Date(
              actuacion.fechaRegistro 
            ),
            carpetaNumero: this.numero,
          };
        } 
      );

      outActuaciones.forEach(
        (
          actuacion 
        ) => {
          this.actuaciones.push(
            actuacion 
          );

          if ( actuacion.isUltimaAct ) {
            this.ultimaActuacion = actuacion;
            this.fecha = actuacion.fechaActuacion;
            this.idRegUltimaAct = actuacion.idRegActuacion;
          }
        } 
      );
    } catch ( error ) {
      console.log(
        `${
          this.numero
        } ERROR ==> getActuaciones ${ this.idProceso } => ${ JSON.stringify(
          error,
          null,
          2,
        ) }`,
      );
    }

    return this.actuaciones;
  }
  async getDetalleProceso() {
    try {
      const urlNameMaker = new URL(
        `Proceso/Detalle/${ this.idProceso }`,
        ramaJudicialBaseURL,
      );

      const fetchProc = await fetch(
        urlNameMaker 
      );

      if ( !fetchProc.ok ) {
        throw new Error(
          fetchProc.statusText 
        );
      }

      const detalleProceso = ( await fetchProc.json() ) as DetalleProceso;

      this.detalleProceso = {
        ...detalleProceso,
        juzgado: JuzgadoClass.fromLongName(
          detalleProceso.despacho 
        ),
      };
    } catch ( error ) {
      console.log(
        error 
      );
    }

    return this.detalleProceso;
  }
}

export class FetcherJudicial {
  llaveProceso: string;
  procesos    : unknown[] = [];
  idProcesos  : number[] = [];
  numero      : number;
  constructor(
    llaveProceso: string, numero: number 
  ) {
    this.llaveProceso = llaveProceso;
    this.numero = numero;
  }
  async getProcesos() {
    try {
      const request = await fetch(
        `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ this.llaveProceso }&SoloActivos=false&pagina=1`,
      );

      if ( !request.ok ) {
        const json = await request.json();

        throw new Error(
          `${ request.status } : ${ request.statusText } === ${ JSON.stringify(
            json,
          ) }`,
        );
      }

      const consultaProcesos = ( await request.json() ) as ConsultaProcesos;

      const {
        procesos 
      } = consultaProcesos;

      for ( const rawProceso of procesos ) {
        if ( rawProceso.esPrivado ) {
          continue;
        }

        const newProceso = new ProcesoJudicial(
          this.numero,
          rawProceso.idProceso,
          this.llaveProceso,
        );

        await newProceso.getActuaciones();
        await newProceso.getDetalleProceso();

        const proceso = {
          ...rawProceso,
          ...newProceso,
          fechaProceso: rawProceso.fechaProceso
            ? new Date(
              rawProceso.fechaProceso 
            )
            : null,
          fechaUltimaActuacion: rawProceso.fechaUltimaActuacion
            ? new Date(
              rawProceso.fechaUltimaActuacion 
            )
            : null,
          juzgado: JuzgadoClass.fromProceso(
            rawProceso 
          ),
        };

        this.procesos.push(
          proceso 
        );
        this.idProcesos.push(
          proceso.idProceso 
        );
      }

      return this.procesos;
    } catch ( error ) {
      console.log(
        `${ this.numero } => error en CarpetaBuilder.getProcesos(${ this.llaveProceso }) => ${ error }`,
      );

      return null;
    }
  }
  /*   async getActuaciones() {
    if ( this.idProcesos.length === 0 ) {
      return null;
    }

    for ( const idProceso of this.idProcesos ) {
      try {
        const request = await fetch(
          `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${ idProceso }`,
        );

        if ( !request.ok ) {
          throw new Error(
            request.statusText
          );
        }

        const consultaActuaciones = ( await request.json() ) as ConsultaActuacion;

        const {
          actuaciones
        } = consultaActuaciones;

        const outActuaciones = actuaciones.map(
          (
            actuacion
          ) => {
            return {
              ...actuacion,
              idProceso     : idProceso,
              isUltimaAct   : actuacion.cant === actuacion.consActuacion,
              fechaActuacion: new Date(
                actuacion.fechaActuacion
              ),
              fechaRegistro: new Date(
                actuacion.fechaRegistro
              ),
              fechaInicial: actuacion.fechaInicial
                ? new Date(
                  actuacion.fechaInicial
                )
                : null,
              fechaFinal: actuacion.fechaFinal
                ? new Date(
                  actuacion.fechaFinal
                )
                : null,
              createdAt: new Date(
                actuacion.fechaRegistro
              ),
              carpetaNumero: this.numero,
            };
          }
        );

        outActuaciones.forEach(
          (
            actuacion
          ) => {
            this.actuaciones.push(
              actuacion
            );

            if ( actuacion.isUltimaAct ) {
              this.ultimaActuacion = actuacion;
              this.fecha = actuacion.fechaActuacion;
              this.idRegUltimaAct = actuacion.idRegActuacion;
            }
          }
        );
        continue;
      }
      catch ( error ) {
        console.log(
          `${
            this.numero
          } ERROR ==> getActuaciones ${ idProceso } => ${ JSON.stringify(
            error,
            null,
            2,
          ) }`,
        );
        continue;
      }
    }

    return this.actuaciones;
  }
  async getDetalleProceso() {
    if ( this.idProcesos.length === 0 ) {
      return null;
    }

    for ( const idProceso of this.idProcesos ) {
      const urlNameMaker = new URL(
        `Proceso/Detalle/${ idProceso }`,
        ramaJudicialBaseURL,
      );

      const fetchProc = await fetch(
        urlNameMaker
      );

      if ( !fetchProc.ok ) {
        console.log(
          fetchProc.statusText
        );
        continue;
      }

      const detalleProceso = ( await fetchProc.json() ) as DetalleProceso;

      const newDetalleProceso = {
        ...detalleProceso,
        juzgado: JuzgadoClass.fromLongName(
          detalleProceso.despacho
        ),
      };
      this.detallesProcesos.push(
        newDetalleProceso
      );
    }

    return this.detallesProcesos;
  } */
}

async function* generateCarpetas() {
  for await ( const carpeta of RawCarpetas ) {
    console.log(
      'start sleeping' 
    );
    await sleep(
      1000 
    );
    console.log(
      'wake up' 
    );

    const newCarpeta = new FetcherJudicial(
      String(
        carpeta.EXPEDIENTE 
      ),
      Number(
        carpeta.NUMERO 
      ),
    );

    await newCarpeta.getProcesos();
    yield newCarpeta;
  }
}

async function tryAsyncClassCarpetas() {
  const mapClassCarpetas = new Map();

  for await ( const carpeta of generateCarpetas() ) {
    mapClassCarpetas.set(
      carpeta.numero, carpeta 
    );
  }

  const asAnArray = Array.from(
    mapClassCarpetas.values() 
  );

  fs.writeFile(
    'ClasscarpetasModelPostAwait.json', JSON.stringify(
      asAnArray 
    ) 
  );

  return asAnArray;
}

tryAsyncClassCarpetas();
