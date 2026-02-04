import { ConsultaActuacion, outActuacion } from '../types/actuaciones.js';
import { Category,
  Codeudor,
  IntCarpeta,
  Juzgado,
  TipoProceso, } from '../types/carpetas.js';
import { ConsultaProcesos, outProceso } from '../types/procesos.js';
import { RawDb } from '../types/raw-db.js';
import { ClassDemanda } from './demanda.js';
import { ClassDeudor } from './deudor.js';
import { NotasBuilder } from './nota.js';
import { tipoProcesoBuilder } from './tipoProceso.js';
import { client } from '../services/prisma.js';
import { sleep } from '../utils/awaiter.js';
import JuzgadoClass from './juzgado.js';
import { Prisma } from '../prisma/generated/prisma/client.js';

// ⚠️ Desactiva la verificación de certificados SSL/TLS.
// Esto es común cuando se consumen APIs gubernamentales antiguas o mal configuradas,
// pero implica un riesgo de seguridad en producción.
process.env[ 'NODE_TLS_REJECT_UNAUTHORIZED' ] = '0';
console.log(
  process.env.NODE_TLS_REJECT_UNAUTHORIZED
);

// ⏱️ Configuración de Rate Limiting (Límite de velocidad)
// Se define una espera de 12.5 segundos entre peticiones para evitar bloqueos por parte del servidor.
const RATE_LIMIT_DELAY = 9000; // 12.5 seconds (allows ~4.8 requests per minute)

const MAX_RETRIES = 3; // 🔄 Número máximo de intentos si falla la petición.

// 🚫 Códigos de estado HTTP que merecen un reintento (ej. servidor ocupado, tiempo de espera).
const RETRY_STATUS_CODES = [
  403,
  408,
  429,
  500,
  502,
  503,
  504
]; // Errors worth retrying

// Variable global para rastrear cuándo fue la última llamada exitosa a la API.
let lastApiCallTime = 0;

/**
 * Enforces the rate limit by sleeping if the last request was too recent.
 * 🚦 Semáforo de Peticiones:
 * Calcula cuánto tiempo ha pasado desde la última llamada.
 * Si es menor a 12.5s, duerme el proceso el tiempo restante.
 */
async function enforceRateLimit() {
  const now = Date.now();

  const timeSinceLastCall = now - lastApiCallTime;

  if ( timeSinceLastCall < RATE_LIMIT_DELAY ) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastCall;

    console.log(
      `⏲️ Rate Limit: Waiting ${ ( waitTime / 1000 ).toFixed(
        1
      ) }s...`
    );
    await sleep(
      waitTime
    ); // 💤 Pausa la ejecución.
  }

  lastApiCallTime = Date.now();
}

/**
 * Fetches with Rate Limit AND Smart Retry logic.
 * 🧠 Fetch Inteligente:
 * 1. Aplica el rate limit.
 * 2. Hace la petición.
 * 3. Si falla con un error recuperable (500, 429), se llama a sí misma recursivamente (reintenta).
 */
export async function fetchWithSmartRetry(
  url: string | URL,
  options?: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  // 1. Wait for the Rate Limit gap before making the request
  // 🛑 Esperar turno
  await enforceRateLimit();

  try {
    const response = await fetch(
      url, options
    );

    // 2. Success Case
    // ✅ Si la respuesta es exitosa (200-299), retornarla inmediatamente.
    if ( response.ok ) {
      return response;
    }

    // 3. Retry Logic for specific HTTP Status Codes
    // 🔄 Si el error está en la lista de reintentos y quedan intentos disponibles.
    if ( RETRY_STATUS_CODES.includes(
      response.status
    ) && retries > 0 ) {
      console.warn(
        `⚠️ API Error ${ response.status }. Retrying... (${ retries } attempts left)`,
      );
      console.log(
        `⚠️ API Error ${ response.status }. Retrying... (${ retries } attempts left)`,
      );

      // We assume the 'enforceRateLimit' at the start of the recursion
      // provides enough backoff time (12.5s), so we don't need extra sleep here.
      // 🔁 Llamada recursiva disminuyendo el contador de retries.
      return fetchWithSmartRetry(
        url, options, retries - 1
      );
    }

    // 4. Fatal HTTP Errors (404, 400, etc.) - Return response to be handled by caller
    // ❌ Error fatal (ej. 404 Not Found), no sirve reintentar. Se devuelve tal cual.
    return response;
  } catch ( error ) {
    // 5. Network Errors (DNS, Offline, Connection Refused)
    // You requested NOT to retry these.
    console.error(
      `❌ Network/Fetch Error: ${ error }`
    );

    throw error;
  }
}

// -----------------------------------
// 📂 Clase Principal Carpeta
// Representa un expediente o carpeta legal y su lógica de negocio.
export class ClassCarpeta implements IntCarpeta {
  procesos           : outProceso[] = [];
  idProcesos         : number[] = [];
  actuaciones        : outActuacion[] = [];
  notas              : NotasBuilder[] = [];
  ultimaActuacion    : outActuacion | null;
  codeudor           : Codeudor;
  demanda            : ClassDemanda;
  deudor             : ClassDeudor;
  numero             : number;
  llaveProceso       : string;
  fecha              : Date | null;
  idRegUltimaAct     : string | null;
  id                 : number;
  category           : Category;
  nombre             : string;
  revisado           : boolean;
  terminado          : boolean;
  tipoProceso        : TipoProceso;
  notasCount         : number | null;
  juzgadoTipo        : string | null;
  ciudad             : string | null;
  juzgado            : Juzgado;
  fechaUltimaRevision: Date | null;

  // 🏗️ Constructor: Transforma los datos crudos (RawDb) a la estructura de la clase.
  constructor(
    rawCarpeta: RawDb
  ) {
    const {
      NUMERO,
      category,
      DEMANDADO_IDENTIFICACION: cedula,
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

    // 📅 Conversión de fechas string a objetos Date
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

    // 📝 Procesamiento de Observaciones:
    // Separa las notas por '//' y crea objetos NotasBuilder
    if ( OBSERVACIONES ) {
      const extras = OBSERVACIONES.split(
        '//'
      );

      extras.forEach(
        (
          nota
        ) => {
          notasCounter++;

          const newNoter = new NotasBuilder(
            nota, Number(
              NUMERO
            ), notasCounter
          );

          this.notas.push(
            newNoter
          );
        }
      );
    }

    // 📝 Procesamiento de Extras (similar a observaciones):
    if ( EXTRA ) {
      console.log(
        `EXTRAS === ${ EXTRA }`
      );

      const extras = String(
        EXTRA
      )
        .split(
          '//'
        );

      extras.forEach(
        (
          nota
        ) => {
          notasCounter++;

          const newNoter = new NotasBuilder(
            nota, Number(
              NUMERO
            ), notasCounter
          );

          this.notas.push(
            newNoter
          );
        }
      );
    }

    // 🆔 Lógica para definir el ID: usa la cédula si es número válido, si no, usa el NUMERO interno.
    const cedulaAsNumber = Number(
      cedula
    );

    if ( isNaN(
      cedulaAsNumber
    ) ) {
      idBuilder = Number(
        NUMERO
      );
    } else {
      idBuilder = cedulaAsNumber;
    }

    // Asignación de propiedades base
    this.notasCount = notasCounter;
    this.id = idBuilder;
    this.idRegUltimaAct = null;
    this.category = category.replaceAll(
      ' ', ''
    ) as Category;
    this.ciudad = String(
      JUZGADO_CIUDAD
    );
    this.numero = isNaN(
      Number(
        NUMERO
      )
    )
      ? this.id
      : Number(
          NUMERO
        );
    this.deudor = new ClassDeudor(
      rawCarpeta
    );
    this.demanda = new ClassDemanda(
      rawCarpeta
    );
    this.nombre = String(
      DEMANDADO_NOMBRE
    );
    this.revisado = false;
    // 👥 Construcción del objeto Codeudor
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

    this.terminado = category === 'Terminados'
      ? true
      : false;
    this.idRegUltimaAct = null;
    this.ultimaActuacion = null;
    this.llaveProceso = EXPEDIENTE
      ? String(
          EXPEDIENTE
        )
          .replace(
            /\s/g, ''
          )
      : 'SinEspecificar';
    this.numero = Number(
      NUMERO
    );
    this.ciudad = String(
      JUZGADO_CIUDAD
    );

    // ⚖️ Normalización del Juzgado
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
  //!CONSTRUCTOR -
  //METHODS
  //ASYNC - getProcesos
  // 🌐 Método para consultar procesos en la API de la Rama Judicial usando el expediente (llaveProceso)
  async getProcesos() {
    try {
      console.log(
        '🧡 initiating getProcesos'
      );

      // !!! UPDATED: Using fetchWithSmartRetry !!!
      // 📡 Llamada a la API externa
      const request = await fetchWithSmartRetry(
        `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ this.llaveProceso }&SoloActivos=false&pagina=1`,
      );

      if ( !request.ok ) {
        const json = await request.json();

        if ( request.status === 404 ) {
          // Loguear el error 404 con la data relevante
          try {
            const fs = await import(
              'fs'
            );
            const path = await import(
              'path'
            );
            const logPath = path.resolve(
              __dirname, 'carpeta-404-log.json'
            );
            let logArr = [];

            try {
              const prev = fs.existsSync(
                logPath
              )
                ? fs.readFileSync(
                    logPath, 'utf8'
                  )
                : '[]';
              logArr = JSON.parse(
                prev
              );
            } catch ( e ) {
              console.log(
                e
              );
              logArr = [];
            }

            logArr.push(
              {
                fecha: new Date()
                  .toISOString(),
                llaveProceso: this.llaveProceso,
                numero      : this.numero,
                status      : request.status,
                json,
              }
            );

            try {
              fs.writeFileSync(
                logPath, JSON.stringify(
                  logArr, null, 2
                )
              );
            } catch ( e ) {
              console.error(
                'No se pudo escribir el log 404:', e
              );
            }
          } catch ( e ) {
            console.error(
              'Error al intentar loguear el 404:', e
            );
          }
        }

        throw new Error(
          `📉${ request.status } : ${ request.statusText } === ${ JSON.stringify(
            json
          ) }`,
        );
      }

      const consultaProcesos = ( await request.json() ) as ConsultaProcesos;

      const {
        procesos
      } = consultaProcesos;
      console.log(
        consultaProcesos
      );
      console.log(
        `
          📰 hay ${ procesos.length } procesos en ${ this.numero }
          `
      );

      if ( procesos.length === 0 && this.llaveProceso.startsWith(
        '1'
      ) ) {
        // Loguear el error 404 con la data relevante
        try {
          const fs = await import(
            'fs'
          );
          const path = await import(
            'path'
          );
          const logPath = path.resolve(
            __dirname, 'carpeta-404-log.json'
          );
          let logArr = [];

          try {
            const prev = fs.existsSync(
              logPath
            )
              ? fs.readFileSync(
                  logPath, 'utf8'
                )
              : '[]';
            logArr = JSON.parse(
              prev
            );
          } catch ( e ) {
            console.log(
              e
            );
            logArr = [];
          }

          logArr.push(
            {
              fecha: new Date()
                .toISOString(),
              llaveProceso: this.llaveProceso,
              numero      : this.numero,
              procesos    : 'no hay procesos para esta carpeta, revisar el radicado',
            }
          );

          try {
            fs.writeFileSync(
              logPath, JSON.stringify(
                logArr, null, 2
              )
            );
          } catch ( e ) {
            console.error(
              'No se pudo escribir el log 404:', e
            );
          }
        } catch ( e ) {
          console.error(
            'Error al intentar loguear el 404:', e
          );
        }
      }

      // 🔄 Itera sobre los procesos encontrados y los formatea
      for ( const rawProceso of procesos ) {
        if ( rawProceso.esPrivado || rawProceso.idProceso === 3175205751 ) {
          continue;
        }

        const proceso: outProceso = {
          ...rawProceso,
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
        ); // Guarda los IDs para usarlos luego en getActuaciones
      }
    } catch ( error ) {
      console.log(
        `💩${ this.numero } => error en CarpetaBuilder.getProcesos(${ this.llaveProceso }) => ${ error }`,
      );
    }

    return this.procesos;
  }

  //ASYNC - getActuaciones
  // 📜 Obtiene el historial de actuaciones (movimientos) para cada proceso encontrado.
  async getActuaciones() {
    console.log(
      '🧡 initiating getActuaciones'
    );

    if ( this.idProcesos.length === 0 ) {
      return [];
    }

    // 🔄 Loop a través de cada ID de proceso
    for ( const idProceso of this.idProcesos ) {
      try {
        // !!! UPDATED: Using fetchWithSmartRetry !!!
        // 📡 Consulta a la API de Actuaciones por ID de proceso
        const request = await fetchWithSmartRetry(
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
        console.log(
          `
          💾 hay ${ actuaciones.length } actuaciones en ${ this.numero }
          `
        );

        // 🛠️ Mapeo y transformación de datos de actuación
        const outActuaciones = actuaciones.map(
          (
            actuacion
          ) => {
            return {
              ...actuacion,
              idRegActuacion: `${ actuacion.idRegActuacion }`,
              idProceso     : Number(
                idProceso
              ),
              isUltimaAct   : actuacion.cant === actuacion.consActuacion, // Detecta si es la última
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

        // 📥 Guardado en el array de la clase y detección de la "Ultima Actuación" global
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
      } catch ( error ) {
        console.log(
          `💩${ this.numero } ERROR ==> getActuaciones ${ idProceso } => ${ JSON.stringify(
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
  // 🔍 Búsqueda alternativa por Nombre/Razón Social
  async getProcesosByName() {
    const fetchUrl = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial?nombre=${ this.nombre }&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`;

    try {
      const request = await fetchWithSmartRetry(
        fetchUrl
      ); // Use SmartRetry here too

      if ( !request.ok ) {
        const json = await request.json();

        throw new Error(
          JSON.stringify(
            json
          )
        );
      }

      const consultaProcesos = await request.json();

      const {
        procesos
      } = consultaProcesos;

      for ( const rawProceso of procesos ) {
        if ( rawProceso.esPrivado ) {
          continue; // 🛡️ Saltar procesos privados
        }

        const proceso = {
          ...rawProceso,
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
        `${ this.numero } => error en getProcesosByName => ${ error }`
      );

      return [];
    }
  }
  //!ASYNC
  //ASYNC - getActuaciones

  //!ASYNC
  //STATIC

  // 💾 MÉTODO PRINCIPAL DE GUARDADO (Instancia)
  // Guarda/Actualiza toda la información recolectada en la base de datos local usando Prisma.
  async agregateToDBMethod() {
    console.log(
      `💾 Saving updates for ${ this.numero }...`
    );

    // 🔨 Preparación de objetos para Prisma
    const newDemanda = ClassDemanda.prismaDemanda(
      this.demanda
    );

    const newDeudor = ClassDeudor.prismaDeudor(
      this.deudor
    );

    const newCarpeta = ClassCarpeta.prismaCarpeta(
      this
    );

    // 1. Upsert carpeta base (sin relaciones)
    // 📁 Crea la carpeta si no existe, o la actualiza si ya existe.
    try {
      console.log(
        '📁 try carpeta upsert'
      );
      await client.carpeta.upsert(
        {
          where: {
            numero: this.numero,
          },
          create: {
            ...newCarpeta,
          },
          update: {
            ...newCarpeta,
          },
        }
      );
    } catch ( error ) {
      console.log(
        `❌ Error al crear carpeta base: ${ error }`
      );

      //return;
    }

    // 2. Relacionar juzgado
    // 🏛️ Conecta la carpeta con el Juzgado, creándolo si no existe.
    try {
      console.log(
        '🧑‍⚖️ carpeta update juzgado'
      );
      await client.carpeta.update(
        {
          where: {
            numero: this.numero,
          },
          data: {
            juzgado: {
              connectOrCreate: {
                where: {
                  id_tipo_ciudad: {
                    tipo  : this.juzgado.tipo,
                    id    : this.juzgado.id,
                    ciudad: this.juzgado.ciudad,
                  },
                },
                create: {
                  tipo  : this.juzgado.tipo,
                  id    : this.juzgado.id,
                  ciudad: this.juzgado.ciudad,
                  url   : this.juzgado.url,
                },
              },
            },
          },
        }
      );
    } catch ( error ) {
      console.log(
        `❌ Error al conectar juzgado: ${ error }`
      );
    }

    // 4. Relacionar deudor
    // 👤 Asocia al deudor a la carpeta.
    try {
      console.log(
        `
        🙆 update carpeta with deudor`
      );
      await client.carpeta.update(
        {
          where: {
            numero: this.numero,
          },
          data: {
            deudor: {
              connectOrCreate: {
                where: {
                  id: this.numero,
                },
                create: newDeudor,
              },
            },
          },
        }
      );
    } catch ( error ) {
      console.log(
        `❌ Error al conectar deudor: ${ error }`
      );
    }

    // 5. Relacionar demanda
    // 📜 Asocia los datos de la demanda.
    try {
      console.log(
        '🕴️update carpeta with demanda'
      );
      await client.carpeta.update(
        {
          where: {
            numero: this.numero,
          },
          data: {
            demanda: {
              connectOrCreate: {
                where: {
                  id: this.numero,
                },
                create: newDemanda,
              },
            },
          },
        }
      );
    } catch ( error ) {
      console.log(
        `❌ Error al conectar demanda: ${ error }`
      );
    }

    // 6. Relacionar codeudor
    // 👥 Asocia al codeudor si existe.
    try {
      console.log(
        '🧜 update carpeta with codeudor'
      );
      await client.carpeta.update(
        {
          where: {
            numero: this.numero,
          },
          data: {
            codeudor: {
              connectOrCreate: {
                where: {
                  id: this.numero,
                },
                create: {
                  ...this.codeudor,
                },
              },
            },
          },
        }
      );
    } catch ( error ) {
      console.log(
        `❌ Error al conectar codeudor: ${ error }`
      );
    }

    // 7. Crear notas
    // 📒 Guarda notas masivamente, saltando duplicados.
    if ( this.notas && this.notas.length > 0 ) {
      try {
        console.log(
          '📓create notes'
        );
        await client.nota.createMany(
          {
            data          : this.notas,
            skipDuplicates: true,
          }
        );
      } catch ( error ) {
        console.log(
          `❌ Error al crear notas: ${ error }`
        );
      }
    }

    // 8. Relacionar procesos y actuaciones
    // 🔗 Itera sobre todos los procesos y sus actuaciones para guardarlos en cascada.
    if ( this.procesos && this.procesos.length > 0 ) {
      for ( const proceso of this.procesos ) {
        try {
          const {
            juzgado, ...restProceso
          } = proceso;

          // Construir input para juzgado solo si existe
          const createData = {
            ...restProceso,
            ...( juzgado && {
              juzgado: {
                connectOrCreate: {
                  where: {
                    id_tipo_ciudad: {
                      tipo  : juzgado.tipo,
                      id    : juzgado.id,
                      ciudad: juzgado.ciudad,
                    },
                  },
                  create: {
                    tipo  : juzgado.tipo,
                    id    : juzgado.id,
                    ciudad: juzgado.ciudad,
                    url   : juzgado.url,
                  },
                },
              },
            } ),
            carpeta: {
              connect: {
                numero: this.numero,
              },
            },
          };

          const updateData = {
            ...restProceso,
            ...( juzgado && {
              juzgado: {
                connectOrCreate: {
                  where: {
                    id_tipo_ciudad: {
                      tipo  : juzgado.tipo,
                      id    : juzgado.id,
                      ciudad: juzgado.ciudad,
                    },
                  },
                  create: {
                    tipo  : juzgado.tipo,
                    id    : juzgado.id,
                    ciudad: juzgado.ciudad,
                    url   : juzgado.url,
                  },
                },
              },
            } ),
          };

          // 💾 Upsert del Proceso
          await client.proceso.upsert(
            {
              where: {
                idProceso: proceso.idProceso,
              },
              create: createData,
              update: updateData,
            }
          );
        } catch ( error ) {
          console.log(
            `❌ Error al crear proceso ${ proceso.idProceso }: ${ error }`,
          );
        }

        // Actuaciones para este proceso
        // 🔍 Filtra las actuaciones que pertenecen a este proceso específico.

        //lo voy a comment porque el código que maneja las actuaciones debe estar manejado exclusivamente por el helper que sí notifica cuando hay una nueva y por consiguiente el manejo de las Actuaciones
        /* const processActuaciones = this.actuaciones.filter(
          (
            a
          ) => {
            return a.idProceso === proceso.idProceso;
          }
        );

        // 💾 Guarda cada actuación.
        for ( const actuacion of processActuaciones ) {
          try {
            await client.actuacion.upsert(
              {
                where: {
                  idRegActuacion: actuacion.idRegActuacion,
                },
                create: {
                  ...actuacion,
                  idRegActuacion: `${ actuacion.idRegActuacion }`,
                  proceso       : {
                    connect: {
                      idProceso: proceso.idProceso,
                    },
                  },
                },
                update: {
                  ...actuacion,
                  isUltimaAct: actuacion.cant === actuacion.consActuacion,
                },
              }
            );
          } catch ( error ) {
            console.log(
              `❌ Error al crear actuacion ${ actuacion.idRegActuacion }: ${ error }`,
            );
          }

          if ( actuacion.isUltimaAct ) {
            // 3. Relacionar ultimaActuacion
            // 🆕 Actualiza la referencia a la actuación más reciente.

            try {
              console.log(
                '☢️ try ultimaActuacion upsert and update carpeta'
              );
              await client.carpeta.update(
                {
                  where: {
                    numero: this.numero,
                  },
                  data: {
                    ultimaActuacion: {
                      connectOrCreate: {
                        where: {
                          idRegActuacion: actuacion.idRegActuacion,
                        },
                        create: {
                          ...actuacion,
                          idRegActuacion: `${ actuacion.idRegActuacion }`,
                          proceso       : {
                            connect: {
                              idProceso: actuacion.idProceso,
                            },
                          },
                        },
                      },
                    },
                  },
                }
              );
            } catch ( error ) {
              console.log(
                `❌ Error al conectar ultimaActuacion: ${ error }`
              );
            }
          }
        } */
      }
    }
  }

  // 🛠️ Helper Estático para formatear datos
  static prismaCarpeta(
    carpeta: IntCarpeta
  ) {
    const newCarpeta: Prisma.CarpetaCreateInput = {
      id                 : carpeta.id,
      llaveProceso       : carpeta.llaveProceso,
      nombre             : carpeta.nombre,
      ciudad             : carpeta.ciudad,
      fechaUltimaRevision: carpeta.fechaUltimaRevision,
      numero             : carpeta.numero,
      category           : carpeta.category,
      fecha              : carpeta.fecha,
      idProcesos         : carpeta.idProcesos,
      notasCount         : carpeta.notasCount,
      revisado           : carpeta.revisado,
      terminado          : carpeta.terminado,
      tipoProceso        : carpeta.tipoProceso,
    };

    return newCarpeta;
  }
  //!STATIC
  //STATICASYNC
  static async updateNotes(
    incomingCarpeta: ClassCarpeta
  ) {
    const {
      notas
    } = incomingCarpeta;

    const updater = await client.nota.createMany(
      {
        data          : notas,
        skipDuplicates: true,
      }
    );

    console.log(
      updater
    );

    return updater.count;
  }
  // 👓 Método para LEER una carpeta completa de la DB con todas sus relaciones.
  static async getCarpeta(
    numero: number
  ) {
    return await client.carpeta.findFirstOrThrow(
      {
        where: {
          numero: numero,
        },
        include: {
          ultimaActuacion: true,
          deudor         : true,
          codeudor       : true,
          notas          : true,
          tareas         : true,
          demanda        : {
            include: {
              notificacion: {
                include: {
                  notifiers: true,
                },
              },
              medidasCautelares: true,
            },
          },
          procesos: {
            include: {
              juzgado: true,
            },
          },
        },
      }
    );
  }

  // 💾 MÉTODO ESTÁTICO DE GUARDADO
  // Funciona igual que agregateToDBMethod pero recibe la carpeta como argumento
  // Útil cuando se tiene el objeto pero no se ha instanciado la clase o se procesa en lote.

  //!STATICASYNC
  //!METHODS
}
