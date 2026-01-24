import * as fs from 'fs';
import * as path from 'path';
import { client } from '../services/prisma.js';
import { Despachos } from '../data/despachos.js';
import { NotasBuilder } from './nota.js';
import { ClassDemanda } from './demanda.js';
import { ClassDeudor } from './deudor.js';
import { RawDb } from '../types/raw-db.js';
import { RawCarpetas } from '../data/carpetas.js';

// --- 0. PRISMA CLIENT INSTANCE ---
const prisma = client;

// --- 1. MOCK DATA & HELPERS ---
// (In a real project, these would be imported from your data/types files)

// Helper to normalize strings
const normalizeText = (
  text: string 
): string => {
  return text
    .toLowerCase()
    .normalize(
      'NFD' 
    )
    .replace(
      /\p{Diacritic}/gu, '' 
    )
    .trim();
};

const sleep = (
  ms: number 
) => {
  return new Promise(
    (
      resolve 
    ) => {
      return setTimeout(
        resolve, ms 
      );
    } 
  );
};

// Mock Despachos Data (for JuzgadoClass lookup)

// --- 2. INTERFACES (Matching your ClassCarpeta requirements) ---

type TipoProceso = 'SINGULAR' | 'HIPOTECARIO' | 'PRENDARIO' | 'ACUMULADO';

const typeMap: Record<string, TipoProceso> = {
  SINGULAR   : 'SINGULAR',
  HIPOTECARIO: 'HIPOTECARIO',
  PRENDARIO  : 'PRENDARIO',
  ACUMULADO  : 'ACUMULADO',
};

function tipoProcesoBuilder(
  raw: string 
): TipoProceso {
  return typeMap[ raw ] || 'SINGULAR';
}

interface Codeudor {
  nombre: string | null;
  cedula: string | null;
  direccion: string | null;
  telefono: string | null;
  id: number;
}

interface outProceso {
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso?: string | Date;
  fechaUltimaActuacion?: string | Date;
  despacho: string;
  departamento: string;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
}

interface outActuacion {
  idRegActuacion: number;
  llaveProceso: string;
  consActuacion: number;
  fechaActuacion: string;
  actuacion: string;
  anotacion?: string;
  fechaRegistro: string;
  fechaInicial?: string;
  fechaFinal?: string;
  cant: number;
  codRegla: string;
  conDocumentos: boolean;
  isUltimaAct: boolean;
}

interface Juzgado {
  id: string;
  tipo: string;
  ciudad: string;
  url: string;
}

// --- 3. UTILITIES ---

class FileLogger {
  constructor(
    private filename: string 
  ) {}

  log(
    error: any, context: object 
  ) {
    const entry
      = JSON.stringify(
        {
          timestamp: new Date()
            .toISOString(),
          error: error instanceof Error
            ? error.message
            : String(
                error 
              ),
          context,
        } 
      ) + '\n';

    fs.appendFileSync(
      path.join(
        __dirname, this.filename 
      ), entry 
    );
  }
}

// --- 4. JUZGADO CLASS (With Regex Fixes) ---

export function extrapolateTipoToCorrectType(
  tipo: string 
): string {
  let output = tipo;

  const hasEjecucion = /EJE|E|EJ/im.test(
    tipo 
  );

  const isPequenasCausas = /PCCM|PCYCM|Peque|causas/im.test(
    tipo 
  );

  const isPromiscuoMunicipal = /PM|PROM|P M/im.test(
    tipo 
  );

  const isCivilMunicipal = /(CM|municipal|C M)/im.test(
    tipo 
  );

  const isCivilCircuito = /(CCTO|CIRCUITO|CTO|C CTO|CC)/im.test(
    tipo 
  );

  if ( hasEjecucion ) {
    if ( isPequenasCausas ) {
      output = 'DE PEQUEÑAS CAUSAS Y COMPETENCIA MÚLTIPLE';
    } else if ( isPromiscuoMunicipal ) {
      output = 'PROMISCUO MUNICIPAL';
    } else if ( isCivilCircuito ) {
      output = 'CIVIL DEL CIRCUITO DE EJECUCIÓN DE SENTENCIAS';
    } else if ( isCivilMunicipal ) {
      output = 'CIVIL MUNICIPAL DE EJECUCIÓN DE SENTENCIAS';
    }
  } else {
    if ( isPequenasCausas ) {
      output = 'DE PEQUEÑAS CAUSAS Y COMPETENCIA MÚLTIPLE';
    } else if ( isPromiscuoMunicipal ) {
      output = 'PROMISCUO MUNICIPAL';
    } else if ( isCivilCircuito ) {
      output = 'CIVIL DEL CIRCUITO';
    } else if ( isCivilMunicipal ) {
      output = 'CIVIL MUNICIPAL';
    }
  }

  return output;
}

export class JuzgadoClass implements Juzgado {
  id: string;
  tipo: string;
  ciudad: string;
  url: string;

  constructor(
    {
      id,
      tipo,
      ciudad,
    }: {
      id: string;
      tipo: string;
      ciudad: string;
    } 
  ) {
    this.id = id.padStart(
      3, '000' 
    );
    this.tipo = tipo.toUpperCase()
      .trim();
    this.ciudad = ciudad.toUpperCase()
      .trim();

    const constructorString = `JUZGADO ${ this.id } ${ this.tipo } DE ${ this.ciudad }`;

    const normalizedName = normalizeText(
      constructorString 
    );

    const matchedDespacho = Despachos.find(
      (
        despacho 
      ) => {
        return normalizeText(
          despacho.nombre 
        ) === normalizedName;
      } 
    );

    if ( matchedDespacho ) {
      this.url = `https://www.ramajudicial.gov.co${ matchedDespacho.url }`;

      const matchedDespachoParts = matchedDespacho.nombre.match(
        /JUZGADO (\d+) ([A-ZÁÉÍÓÚÑ\s]+) DE ([.A-ZÁÉÍÓÚÑ\s-]+)/im,
      );

      if ( matchedDespachoParts ) {
        const [
          , newId,
          newTipo,
          newCiudad
        ] = matchedDespachoParts;

        this.id = newId;
        this.tipo = newTipo.trim();
        this.ciudad = newCiudad.trim();
      }
    } else {
      this.url = '';
    }
  }

  static fromShortName(
    {
      ciudad,
      juzgadoRaw,
    }: {
      ciudad: string;
      juzgadoRaw: string;
    } 
  ) {
    const matchedRegexNumberAndLetters = juzgadoRaw.match(
      /(\d+)(\s?)([A-ZÁÉÍÓÚÑ\s-]+)/im,
    );

    if ( !matchedRegexNumberAndLetters ) {
      return new JuzgadoClass(
        {
          id  : '',
          tipo: juzgadoRaw,
          ciudad,
        } 
      );
    }

    const [
      , rawId, , rawTipo
    ] = matchedRegexNumberAndLetters;

    return new JuzgadoClass(
      {
        id: rawId.padStart(
          3, '000' 
        ),
        tipo: extrapolateTipoToCorrectType(
          rawTipo 
        ),
        ciudad,
      } 
    );
  }

  static fromProceso(
    proceso: outProceso 
  ) {
    const matchedDespachoParts = proceso.despacho.match(
      /JUZGADO (\d+) ([A-ZÁÉÍÓÚÑ\s]+) DE ([.A-ZÁÉÍÓÚÑ\s-]+)/im,
    );

    if ( !matchedDespachoParts ) {
      return new JuzgadoClass(
        {
          id    : '',
          tipo  : proceso.despacho,
          ciudad: proceso.departamento,
        } 
      );
    }

    const [
      , id,
      tipo,
      ciudad
    ] = matchedDespachoParts;

    return new JuzgadoClass(
      {
        id,
        tipo,
        ciudad,
      } 
    );
  }
}

// --- 5. CARPETA CLASS (Integrated) ---

export class ClassCarpeta {
  private baseUrl: string;
  private logger: FileLogger;
  private readonly RATE_LIMIT_DELAY_MS = 12000; // 12 seconds per request

  //PROPERTIES
  procesos: outProceso[] = [];
  idProcesos: number[] = [];
  actuaciones: outActuacion[] = [];
  notas: NotasBuilder[] = [];

  //PROPERTIES reg objects
  ultimaActuacion: outActuacion | null;
  codeudor: Codeudor;
  demanda: ClassDemanda;
  deudor: ClassDeudor;

  //PROPERTIES primitive types
  numero: number;
  llaveProceso: string;
  fecha: Date | null;
  idRegUltimaAct: string | null;
  id: number;
  category: string;
  nombre: string;
  revisado: boolean;
  terminado: boolean;
  tipoProceso: TipoProceso;
  notasCount: number | null;
  juzgadoTipo: string | null;
  ciudad: string | null;
  juzgado: JuzgadoClass;
  fechaUltimaRevision: Date | null;

  constructor(
    rawCarpeta: RawDb 
  ) {
    this.baseUrl = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2';
    this.logger = new FileLogger(
      'failed_sync_ops.json' 
    );

    const {
      NUMERO,
      category,
      DEMANDADO_IDENTIFICACION,
      EXPEDIENTE,
      DEMANDADO_NOMBRE,
      FECHA_ULTIMA_REVISION,
      FECHA_ULTIMA_ACTUACION,
      CODEUDOR_NOMBRE,
      CODEUDOR_IDENTIFICACION,
      CODEUDOR_DIRECCION,
      CODEUDOR_TELEFONOS,
      JUZGADO_EJECUCION,
      JUZGADO_ORIGEN,
      JUZGADO_CIUDAD,
      TIPO_PROCESO,
      EXTRA,
      OBSERVACIONES,
    } = rawCarpeta;

    let idBuilder;
    let notasCounter = 0;

    this.fechaUltimaRevision = FECHA_ULTIMA_REVISION
      ? new Date(
        FECHA_ULTIMA_REVISION 
      )
      : null;
    this.fecha = FECHA_ULTIMA_ACTUACION
      ? new Date(
        FECHA_ULTIMA_ACTUACION 
      )
      : null;

    if ( OBSERVACIONES ) {
      const extras = OBSERVACIONES.split(
        '//' 
      );

      extras.forEach(
        (
          nota: string 
        ) => {
          notasCounter++;
          this.notas.push(
            new NotasBuilder(
              nota, Number(
                NUMERO 
              ), notasCounter 
            ) 
          );
        } 
      );
    }

    if ( EXTRA ) {
      const extras = String(
        EXTRA 
      )
        .split(
          '//' 
        );

      extras.forEach(
        (
          nota: string 
        ) => {
          notasCounter++;
          this.notas.push(
            new NotasBuilder(
              nota, Number(
                NUMERO 
              ), notasCounter 
            ) 
          );
        } 
      );
    }

    const cedulaAsNumber = Number(
      DEMANDADO_IDENTIFICACION 
    );

    idBuilder = isNaN(
      cedulaAsNumber 
    )
      ? Number(
          NUMERO 
        )
      : cedulaAsNumber;

    this.notasCount = notasCounter;
    this.id = idBuilder;
    this.ciudad = String(
      JUZGADO_CIUDAD 
    );
    this.idRegUltimaAct = null;
    this.numero = isNaN(
      Number(
        NUMERO 
      ) 
    )
      ? this.id
      : Number(
          NUMERO 
        );
    this.category = category;
    this.deudor = new ClassDeudor(
      rawCarpeta 
    );

    this.llaveProceso = EXPEDIENTE
      ? String(
          EXPEDIENTE 
        )
      : 'SinEspecificar';
    this.demanda = new ClassDemanda(
      rawCarpeta 
    );
    this.nombre = String(
      DEMANDADO_NOMBRE 
    );
    this.revisado = false;
    this.codeudor = {
      nombre: CODEUDOR_NOMBRE
        ? String(
            CODEUDOR_NOMBRE 
          )
        : null,
      cedula: CODEUDOR_IDENTIFICACION
        ? String(
            CODEUDOR_IDENTIFICACION 
          )
        : null,
      direccion: CODEUDOR_DIRECCION
        ? String(
            CODEUDOR_DIRECCION 
          )
        : null,
      telefono: CODEUDOR_TELEFONOS
        ? String(
            CODEUDOR_TELEFONOS 
          )
        : null,
      id: this.numero,
    };
    this.tipoProceso = TIPO_PROCESO
      ? tipoProcesoBuilder(
          TIPO_PROCESO 
        )
      : 'SINGULAR';
    this.terminado = category === 'Terminados';
    this.ultimaActuacion = null;
    this.juzgado = JuzgadoClass.fromShortName(
      {
        ciudad: String(
          JUZGADO_CIUDAD 
        ),
        juzgadoRaw: JUZGADO_EJECUCION
          ? JUZGADO_EJECUCION
          : JUZGADO_ORIGEN
            ? JUZGADO_ORIGEN
            : '',
      } 
    );
    this.juzgadoTipo = this.juzgado.tipo;
  }

  // --- FETCHING LOGIC ---

  private async fetchWithRetry<T>(
    url: string,
    context: string,
  ): Promise<T | null> {
    let attempts = 0;

    const maxAttempts = 2;

    while ( attempts < maxAttempts ) {
      try {
        console.log(
          `Waiting ${ this.RATE_LIMIT_DELAY_MS }ms...` 
        );
        await sleep(
          this.RATE_LIMIT_DELAY_MS 
        );

        console.log(
          `Fetching: ${ url }` 
        );

        const response = await fetch(
          url 
        );

        if ( !response.ok ) {
          throw new Error(
            `HTTP ${ response.status } ${ response.statusText }` 
          );
        }

        return ( await response.json() ) as T;
      } catch ( error ) {
        attempts++;
        console.error(
          `Attempt ${ attempts } failed:`, error 
        );

        if ( attempts >= maxAttempts ) {
          this.logger.log(
            error, {
              url,
              context,
              carpeta: this.numero,
            } 
          );

          return null;
        }
      }
    }

    return null;
  }

  public async syncWithApi() {
    console.log(
      `\nStarting Sync for Carpeta ${ this.numero }` 
    );

    const procesosUrl = `${ this.baseUrl }/Procesos/Consulta/NumeroRadicacion?numero=${ this.llaveProceso }`;

    const procesosRes = await this.fetchWithRetry<{
      procesos: outProceso[];
    }>(
      procesosUrl, 'FETCH_PROCESOS' 
    );

    if ( procesosRes && Array.isArray(
      procesosRes.procesos 
    ) ) {
      this.procesos = procesosRes.procesos;
      this.idProcesos = this.procesos.map(
        (
          p 
        ) => {
          return p.idProceso;
        } 
      );

      for ( const proceso of this.procesos ) {
        // Fetch Actuaciones
        const actuacionesUrl = `${ this.baseUrl }/Procesos/Actuaciones/${ proceso.idProceso }`;

        const actRes = await this.fetchWithRetry<{
          actuaciones: outActuacion[];
        }>(
          actuacionesUrl, `FETCH_ACTUACIONES_${ proceso.idProceso }` 
        );

        if ( actRes && Array.isArray(
          actRes.actuaciones 
        ) ) {
          this.actuaciones.push(
            ...actRes.actuaciones 
          );

          const ultimaActuacion = actRes.actuaciones.find(
            (
              act 
            ) => {
              return act.cant === act.consActuacion;
            } 
          );

          if ( ultimaActuacion ) {
            this.ultimaActuacion = ultimaActuacion;
            this.fecha = new Date(
              ultimaActuacion.fechaActuacion 
            );
          }
        }
      }
    } else {
      console.log(
        `No processes found for ${ this.llaveProceso }` 
      );
    }
  }

  // --- PERSISTENCE LOGIC (The core requirement) ---

  public async persistToDb() {
    console.log(
      `Persisting data for Carpeta ${ this.numero }...` 
    );

    // 1. Ensure Dependencies Exist (Juzgado)
    // We execute this outside the main transaction or as the first step to ensure ID availability
    const dbJuzgado = await prisma.juzgado.upsert(
      {
        where: {
          id_tipo_ciudad: {
            id    : this.juzgado.id,
            tipo  : this.juzgado.tipo,
            ciudad: this.juzgado.ciudad,
          },
        },
        create: {
          id    : this.juzgado.id,
          tipo  : this.juzgado.tipo,
          ciudad: this.juzgado.ciudad,
          url   : this.juzgado.url,
        },
        update: {
          url: this.juzgado.url,
        },
      } 
    );

    const txOps: any[] = [];

    // 2. Upsert Carpeta (Base)
    txOps.push(
      prisma.carpeta.upsert(
        {
          where: {
            numero: this.numero,
          },
          create: {
            numero             : this.numero,
            llaveProceso       : this.llaveProceso,
            nombre             : this.nombre,
            id                 : this.id,
            category           : this.category,
            tipoProceso        : this.tipoProceso,
            revisado           : this.revisado,
            terminado          : this.terminado,
            ciudad             : this.ciudad,
            juzgadoTipo        : dbJuzgado.tipo,
            juzgadoCiudad      : dbJuzgado.ciudad,
            juzgadoId          : dbJuzgado.id,
            idProcesos         : this.idProcesos,
            notasCount         : this.notasCount,
            fechaUltimaRevision: this.fechaUltimaRevision,
            fecha              : this.fecha,
          },
          update: {
            updatedAt: new Date(),
            fecha    : this.fecha,
          },
        } 
      ),
    );

    // 3. Upsert Procesos
    for ( const proc of this.procesos ) {
      // Logic: Proceso might have a different Juzgado than the folder
      const procJuzgadoObj = JuzgadoClass.fromProceso(
        proc 
      );

      // We must ensure this Juzgado exists too.
      // Since we can't await inside the tx array easily without making it complex,
      // we add the upsert of the Juzgado to the transaction queue before the proceso.
      txOps.push(
        prisma.juzgado.upsert(
          {
            where: {
              id_tipo_ciudad: {
                id    : procJuzgadoObj.id,
                tipo  : procJuzgadoObj.tipo,
                ciudad: procJuzgadoObj.ciudad,
              },
            },
            create: {
              id    : procJuzgadoObj.id,
              tipo  : procJuzgadoObj.tipo,
              ciudad: procJuzgadoObj.ciudad,
              url   : procJuzgadoObj.url,
            },
            update: {
              url: procJuzgadoObj.url,
            },
          } 
        ),
      );

      txOps.push(
        prisma.proceso.upsert(
          {
            where: {
              idProceso: proc.idProceso,
            },
            create: {
              idProceso   : proc.idProceso,
              llaveProceso: proc.llaveProceso,
              idConexion  : proc.idConexion || Math.floor(
                Math.random() * 9999 
              ),
              fechaProceso: proc.fechaProceso
                ? new Date(
                  proc.fechaProceso 
                )
                : null,
              fechaUltimaActuacion: proc.fechaUltimaActuacion
                ? new Date(
                  proc.fechaUltimaActuacion 
                )
                : null,
              despacho         : proc.despacho,
              departamento     : proc.departamento,
              sujetosProcesales: proc.sujetosProcesales,
              esPrivado        : proc.esPrivado,
              cantFilas        : proc.cantFilas,
              juzgadoTipo      : procJuzgadoObj.tipo,
              juzgadoCiudad    : procJuzgadoObj.ciudad,
              juzgadoId        : procJuzgadoObj.id,
              carpetaNumero    : this.numero,
            },
            update: {
              fechaUltimaActuacion: proc.fechaUltimaActuacion
                ? new Date(
                  proc.fechaUltimaActuacion 
                )
                : null,
            },
          } 
        ),
      );
    }

    // 4. Upsert Actuaciones & Calculate Latest
    let latestActId: string | null = null;
    let latestActDate: Date | null = null;
    let maxCons = -1;

    // Filter Acts that belong to our processes
    const validProcessIds = this.procesos.map(
      (
        p 
      ) => {
        return p.idProceso;
      } 
    );
    // Find acts where the process matches via llaveProceso (since idProceso might be missing in raw act)
    // We assume this.procesos contains the correct llaves.

    for ( const act of this.actuaciones ) {
      // Find parent process
      const parentProc = this.procesos.find(
        (
          p 
        ) => {
          return p.llaveProceso === act.llaveProceso;
        } 
      );

      if ( !parentProc ) {
        continue;
      }

      // LOGIC: isUltimaAct based on count vs cons
      const isUltimaCalculated = act.cant === act.consActuacion;

      // LOGIC: Is this the winner for the Carpeta?
      if ( isUltimaCalculated && act.consActuacion > maxCons ) {
        maxCons = act.consActuacion;
        latestActId = String(
          act.idRegActuacion 
        );
        latestActDate = new Date(
          act.fechaActuacion 
        );
      }

      txOps.push(
        prisma.actuacion.upsert(
          {
            where: {
              idRegActuacion: String(
                act.idRegActuacion 
              ),
            },
            create: {
              idRegActuacion: String(
                act.idRegActuacion 
              ),
              llaveProceso  : act.llaveProceso,
              consActuacion : act.consActuacion,
              fechaActuacion: new Date(
                act.fechaActuacion 
              ),
              actuacion    : act.actuacion,
              anotacion    : act.anotacion,
              fechaRegistro: new Date(
                act.fechaRegistro 
              ),
              fechaInicial: act.fechaInicial
                ? new Date(
                  act.fechaInicial 
                )
                : null,
              fechaFinal: act.fechaFinal
                ? new Date(
                  act.fechaFinal 
                )
                : null,
              cant         : act.cant,
              codRegla     : act.codRegla,
              conDocumentos: act.conDocumentos,
              isUltimaAct  : isUltimaCalculated, // LOGIC APPLIED
              idProceso    : parentProc.idProceso,
              // Per schema, Actuacion relates to Carpeta via implicit/explicit connection
              Carpeta      : {
                connect: {
                  numero: this.numero,
                },
              },
            },
            update: {
              isUltimaAct: isUltimaCalculated, // LOGIC APPLIED
              anotacion  : act.anotacion,
            },
          } 
        ),
      );
    }

    // 5. Link Latest Actuacion to Carpeta
    if ( latestActId && latestActDate ) {
      txOps.push(
        prisma.carpeta.update(
          {
            where: {
              numero: this.numero,
            },
            data: {
              fecha          : latestActDate, // Update carpeta date
              ultimaActuacion: {
                connect: {
                  idRegActuacion: latestActId,
                },
              },
            },
          } 
        ),
      );
    }

    // EXECUTE TRANSACTION
    try {
      await prisma.$transaction(
        txOps 
      );
      console.log(
        `Successfully synced Carpeta ${ this.numero }` 
      );
    } catch ( error ) {
      console.error(
        `Transaction failed for Carpeta ${ this.numero }:`, error 
      );
      this.logger.log(
        error, {
          type   : 'DB_TX_FAIL',
          carpeta: this.numero,
        } 
      );
    }
  }
}

// --- 6. MAIN EXECUTION ---

async function main() {
  // Example Input Data
  const rawInput: RawDb[] = RawCarpetas;

  const carpetas = rawInput.map(
    (
      raw 
    ) => {
      return new ClassCarpeta(
        raw 
      );
    } 
  );

  for ( const carpeta of carpetas ) {
    // 1. Fetch from API
    await carpeta.syncWithApi();

    // 2. Persist to DB
    await carpeta.persistToDb();
  }
}

main()
  .catch(
    (
      e 
    ) => {
      return console.error(
        e 
      );
    } 
  )
  .finally(
    async () => {
      return await prisma.$disconnect();
    } 
  );
