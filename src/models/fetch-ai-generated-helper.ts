import * as fs from 'fs';
import * as path from 'path';
import { Despachos } from '../data/despachos.js';
import { NotasBuilder } from './nota.js';
import { ClassDemanda } from './demanda.js';
import { ClassDeudor } from './deudor.js';
import { RawDb } from '../types/raw-db.js';
import { RawCarpetas } from '../data/carpetas.js';
import { databaseActuacion,
  fetchResponseActuaciones,
  intActuacion, } from '../types/actuaciones.js';
import { databaseProceso, fetchResponseProceso } from '../types/procesos.js';
import { client } from '../services/prisma.js';
import { PrismaClient } from '../prisma/generated/prisma/client.js';

//GG --- 1. MOCK TYPES & CLASSES (Placeholders for missing imports) ---
//? These allow the code to compile since ClassCarpeta relies on them.

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

//GG --- 2. JUZGADO CLASS (Your Implementation) ---

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

class JuzgadoClass {
  id    : string;
  tipo  : string;
  ciudad: string;
  url   : string;

  constructor(
    {
      id,
      tipo,
      ciudad,
    }: {
      id    : string;
      tipo  : string;
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
      ciudad    : string;
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
    proceso: fetchResponseProceso | databaseProceso 
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

//GG --- 3. UTILITIES & LOGGER ---

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

// --- 4. API RESPONSE TYPES ---

// --- 5. MAIN CARPETA CLASS (Extended with Logic) ---

export class ClassCarpeta {
  private baseUrl: string;
  private logger : FileLogger;
  private readonly RATE_LIMIT_DELAY_MS = 12500; // Increased slightly to be safe (5 req/min)

  //PROPERTIES
  procesos   : databaseProceso[] = [];
  idProcesos : number[] = [];
  actuaciones: databaseActuacion[] = [];
  notas      : NotasBuilder[] = [];

  //PROPERTIES reg objects
  ultimaActuacion: databaseActuacion | null;
  codeudor       : Codeudor;
  demanda        : ClassDemanda;
  deudor         : ClassDeudor;

  //PROPERTIES primitive types
  numero             : number;
  llaveProceso       : string;
  fecha              : Date | null;
  idRegUltimaAct     : string | null;
  id                 : number;
  category           : string;
  nombre             : string;
  revisado           : boolean;
  terminado          : boolean;
  tipoProceso        : TipoProceso;
  notasCount         : number | null;
  juzgadoTipo        : string | null;
  ciudad             : string | null;
  juzgado            : JuzgadoClass;
  fechaUltimaRevision: Date | null;

  constructor(
    rawCarpeta: RawDb 
  ) {
    this.baseUrl = 'https://consultaprocesos.ramajudicial.gov.co:448'; // Fixed URL for API V2
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
      carpetaNumero: this.numero,
      nombre       : CODEUDOR_NOMBRE
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

  //GG --- METHODS ADDED FOR FETCHING AND SYNCING ---

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

  /**
   * Main Logic: Fetches Procesos, then iterates them to fetch Actuaciones.
   */
  public async syncWithApi() {
    console.log(
      `\nStarting Sync for Carpeta ${ this.numero } (${ this.llaveProceso })`,
    );

    // 1. Fetch Procesos
    const procesosUrl = `${ this.baseUrl }/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ this.llaveProceso }&SoloActivos=false&pagina=1`;

    const procesosRes = await this.fetchWithRetry<{
      procesos: fetchResponseProceso[];
    }>(
      procesosUrl, 'FETCH_PROCESOS' 
    );

    if ( procesosRes && Array.isArray(
      procesosRes.procesos 
    ) ) {
      this.procesos = procesosRes.procesos.map(
        (
          proceso 
        ) => {
          return {
            ...proceso,
            fechaProceso: new Date(
              proceso.fechaProceso 
            ),
            fechaUltimaActuacion: new Date(
              proceso.fechaUltimaActuacion 
            ),
          };
        } 
      );
      this.idProcesos = this.procesos.map(
        (
          p 
        ) => {
          return p.idProceso;
        } 
      );

      // 2. Iterate Procesos
      for ( const proceso of this.procesos ) {
        // Create Juzgado Object (Logic requested by prompt)
        const juzgadoObj = JuzgadoClass.fromProceso(
          proceso 
        );

        // 3. Fetch Actuaciones
        const actuacionesUrl = `${ this.baseUrl }/api/v2/Proceso/Actuaciones/${ proceso.idProceso }`;

        const actRes = await this.fetchWithRetry<{
          actuaciones: fetchResponseActuaciones[];
        }>(
          actuacionesUrl, `FETCH_ACTUACIONES_${ proceso.idProceso }` 
        );

        if ( actRes && Array.isArray(
          actRes.actuaciones 
        ) ) {
          const fixedActuaciones: databaseActuacion[] = actRes.actuaciones.map(
            (
              actuacion 
            ) => {
              return {
                ...actuacion,
                idProceso     : proceso.idProceso,
                idRegActuacion: `${ actuacion.idRegActuacion }`,
                createdAt     : new Date(),
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
                isUltimaAct: actuacion.cant === actuacion.consActuacion,
              };
            },
          );

          // Add to class instance
          this.actuaciones.push(
            ...fixedActuaciones 
          );

          // Determine the latest actuacion for the class property
          if ( actRes.actuaciones.length > 0 ) {
            // Basic logic to find most recent (assuming API returns sorted or checking date)
            this.ultimaActuacion
              = fixedActuaciones.find(
                (
                  a 
                ) => {
                  return a.cant === a.consActuacion;
                } 
              ) || fixedActuaciones[ 0 ];
            this.idRegUltimaAct = String(
              fixedActuaciones.find(
                (
                  a 
                ) => {
                  return a.cant === a.consActuacion;
                } 
              )?.idRegActuacion || fixedActuaciones[ 0 ].idRegActuacion,
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

  /**
   * Upserts all gathered data into Prisma
   */
  public async persistToDb(
    client: PrismaClient 
  ) {
    console.log(
      `Persisting data for Carpeta ${ this.numero }` 
    );

    // A. Create/Connect the Juzgado defined in the Constructor
    // Note: This relies on the composite ID.
    const initialJuzgado = await client.juzgado.upsert(
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
        update: {},
      } 
    );

    // B. Upsert the Carpeta itself
    const carpetaRecord = await client.carpeta.upsert(
      {
        where: {
          numero: this.numero,
        },
        create: {
          numero             : this.numero,
          llaveProceso       : this.llaveProceso,
          nombre             : this.nombre,
          id                 : this.id, // using id as Int per schema
          category           : this.category,
          tipoProceso        : this.tipoProceso,
          revisado           : this.revisado,
          terminado          : this.terminado,
          ciudad             : this.ciudad,
          juzgadoTipo        : initialJuzgado.tipo,
          juzgadoCiudad      : initialJuzgado.ciudad,
          juzgadoId          : initialJuzgado.id,
          idProcesos         : this.idProcesos,
          notasCount         : this.notasCount,
          fechaUltimaRevision: this.fechaUltimaRevision,
          fecha              : this.fecha,
        },
        update: {
          updatedAt          : new Date(),
          idProcesos         : this.idProcesos,
          fechaUltimaRevision: new Date(),
          // Update relations if they changed
          juzgadoTipo        : initialJuzgado.tipo,
          juzgadoCiudad      : initialJuzgado.ciudad,
          juzgadoId          : initialJuzgado.id,
        },
      } 
    );

    // C. Iterate Procesos (fetched from API) and Upsert
    for ( const proc of this.procesos ) {
      // Create local Juzgado object for this specific proceso
      const procJuzgado = JuzgadoClass.fromProceso(
        proc 
      );

      // Upsert the Proceso's Juzgado
      const dbProcJuzgado = await client.juzgado.upsert(
        {
          where: {
            id_tipo_ciudad: {
              id    : procJuzgado.id,
              tipo  : procJuzgado.tipo,
              ciudad: procJuzgado.ciudad,
            },
          },
          create: {
            id    : procJuzgado.id,
            tipo  : procJuzgado.tipo,
            ciudad: procJuzgado.ciudad,
            url   : procJuzgado.url,
          },
          update: {
            url: procJuzgado.url,
          },
        } 
      );

      // Upsert Proceso
      await client.proceso.upsert(
        {
          where: {
            idProceso: proc.idProceso,
          },
          create: {
            idProceso   : proc.idProceso,
            llaveProceso: proc.llaveProceso,
            idConexion  : proc.idConexion || Math.floor(
              Math.random() * 1000 
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
            juzgadoTipo      : dbProcJuzgado.tipo,
            juzgadoCiudad    : dbProcJuzgado.ciudad,
            juzgadoId        : dbProcJuzgado.id,
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
      );
    }

    // D. Iterate Actuaciones and Upsert
    // Using transaction for bulk consistency if possible, or loop for safety
    for ( const act of this.actuaciones ) {
      // Find which process this belongs to (usually via API context, but we have it in the object usually)
      // The API response for Actuaciones usually doesn't have idProceso inside the item,
      // but our `fetch` logic knows the context.
      // However, Prisma requires the connection.
      // We will infer it or use the context passed down if we modified the object.
      // *Correction*: In the syncWithApi method, we didn't inject idProceso into the act object.
      // We need to assume the schema relationship allows connecting.
      // Actually, the schema has `idProceso Int` in Actuacion model.
      // We need to ensure we have that value.
      // HACK: Since `outActuacion` from API doesn't have `idProceso`, we must look it up
      // or inject it during the fetch loop.
      // For this specific code block, I will assume we can find the process ID via the array iteration
      // OR we modify `outActuacion` to include it.
      // Let's modify the Loop in persistToDb to look up the process via LLaveProceso or similar?
      // No, `act.llaveProceso` exists. But `Proceso` is related via `idProceso`.
      // To fix this cleanly: I will iterate `this.procesos` again, and filter `this.actuaciones` inside.
    }

    // Better Loop for Actuaciones:
    for ( const proc of this.procesos ) {
      // Filter actuacions belonging to this process (API usually returns them per process)
      // Since `this.actuaciones` is a flat list of all acts for all processes in the folder:
      // We unfortunately don't have a direct link in the standard API response object `outActuacion`
      // connecting it to `idProceso` (int), only `llaveProceso` (string).
      // However, `Proceso` also has `llaveProceso`.

      const relevantActs = this.actuaciones.filter(
        (
          a 
        ) => {
          return a.llaveProceso === proc.llaveProceso;
        } 
      );

      for ( const act of relevantActs ) {
        await client.actuacion.upsert(
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
              isUltimaAct  : act.isUltimaAct,
              idProceso    : proc.idProceso,
              carpetaNumero: this.numero,
            },
            update: {
              isUltimaAct: act.isUltimaAct,
              anotacion  : act.anotacion,
            },
          } 
        );
      }
    }
  }
}

// --- 6. EXECUTION SCRIPT ---

async function main() {
  // 1. Simulate getting RawDb objects (e.g. from an excel import or legacy DB)
  // In a real app, you would query your source here.

  // 2. Instantiate Objects
  const carpetas = RawCarpetas.map(
    (
      raw 
    ) => {
      return new ClassCarpeta(
        raw 
      );
    } 
  );

  // 3. Process Loop
  for ( const carpeta of carpetas ) {
    // A. Fetch Data (Rate limited internally)
    await carpeta.syncWithApi();

    // B. Save to Database
    try {
      await carpeta.persistToDb(
        client 
      );
      console.log(
        `Saved Carpeta ${ carpeta.numero }` 
      );
    } catch ( e ) {
      console.error(
        `Error saving Carpeta ${ carpeta.numero }`, e 
      );
    }
  }
}

main()
  .catch(
    (
      e 
    ) => {
      console.error(
        e 
      );
      process.exit(
        1 
      );
    } 
  )
  .finally(
    async () => {
      await client.$disconnect();
    } 
  );
