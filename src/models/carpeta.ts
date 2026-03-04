import { ConsultaActuacion,
  DatabaseActuacionType, } from '../types/actuaciones.js';
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
import JuzgadoClass from './juzgado.js';
import { Prisma } from '../prisma/generated/prisma/client.js';
import { getLatestByDate } from '../utils/latestActuacion.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';
import { ensureDate } from '../utils/ensureDate.js';

// ⚠️ Desactiva la verificación de certificados SSL/TLS.
// Esto es común cuando se consumen APIs gubernamentales antiguas o mal configuradas,
// pero implica un riesgo de seguridad en producción.
process.env[ 'NODE_TLS_REJECT_UNAUTHORIZED' ] = '0';
console.log(
  process.env.NODE_TLS_REJECT_UNAUTHORIZED 
);

// -----------------------------------

/**
 * @class ClassCarpeta
 * @implements {IntCarpeta}
 * @description Representa un expediente o carpeta legal y encapsula su lógica de negocio.
 * Se encarga de transformar datos crudos, consultar la API de la Rama Judicial para obtener procesos
 * y actuaciones, y sincronizar toda la información estructurada con la base de datos a través de Prisma.
 */
export class ClassCarpeta implements IntCarpeta {
  procesos           : outProceso[] = [];
  idProcesos         : string[] = [];
  actuaciones        : DatabaseActuacionType[] = [];
  notas              : NotasBuilder[] = [];
  ultimaActuacion    : DatabaseActuacionType | null;
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

  /**
   * @constructor
   * @description Transforma los datos crudos (RawDb) a la estructura de la clase `ClassCarpeta`.
   * Procesa fechas, extrae y separa notas/observaciones, normaliza IDs (usando cédula o número interno),
   * y construye las entidades relacionadas como Juzgado, Deudor, Demanda y Codeudor.
   * * @param {RawDb} rawCarpeta - Objeto con los datos crudos provenientes de la fuente inicial.
   */
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

    //TODO agregar las filas de ultimo_estado_aparece y ultimo_estado_revisado

    // 📅 Conversión de fechas string a objetos Date
    this.fechaUltimaRevision = ensureDate(
      FECHA_ULTIMA_REVISION 
    );
    this.fecha = ensureDate(
      FECHA_ULTIMA_ACTUACION 
    );

    // 📝 Procesamiento de Observaciones:
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

    // 📝 Procesamiento de Extras:
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

  /**
   * @async
   * @method getProcesos
   * @description Consulta procesos en la API de la Rama Judicial utilizando el expediente (`llaveProceso`).
   * Omite procesos privados o específicos (e.g., id 3175205751). Registra en un archivo local (`carpeta-404-log.json`)
   * las respuestas fallidas (HTTP 404) o radicados sin procesos.
   * * @returns {Promise<outProceso[]>} Un array con los procesos encontrados y procesados.
   * @throws {Error} Lanza un error si la solicitud falla con un código de estado distinto de 404.
   */
  async getProcesos(): Promise<outProceso[]> {
    try {
      console.log(
        '🧡 initiating getProcesos' 
      );
      const request = await fetchWithSmartRetry(
        `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ this.llaveProceso }&SoloActivos=false&pagina=1`,
      );

      if ( !request.ok ) {
        const json = await request.json();

        if ( request.status === 404 ) {
          // Lógica de logueo 404...
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
            json,
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
        `📰 hay ${ procesos.length } procesos en ${ this.numero }` 
      );

      if ( procesos.length === 0 && this.llaveProceso.startsWith(
        '1' 
      ) ) {
        // Lógica de logueo vacío...
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

      for ( const rawProceso of procesos ) {
        if ( rawProceso.esPrivado || rawProceso.idProceso === 3175205751 ) {
          continue;
        }

        const proceso: outProceso = {
          ...rawProceso,
          idProceso   : rawProceso.idProceso.toString(),
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
          proceso.idProceso.toString() 
        );
        this.juzgado = JuzgadoClass.fromProceso(
          rawProceso 
        );
      }
    } catch ( error ) {
      console.log(
        `💩${ this.numero } => error en CarpetaBuilder.getProcesos(${ this.llaveProceso }) => ${ error }`,
      );
    }

    return this.procesos;
  }

  /**
   * @async
   * @method getActuaciones
   * @description Obtiene el historial de actuaciones (movimientos) iterando sobre el array interno de `idProcesos`.
   * Formatea las fechas, detecta la "última actuación" a nivel global y las asocia al expediente.
   * * @returns {Promise<DatabaseActuacionType[]>} Un array consolidado con todas las actuaciones de todos los procesos encontrados.
   */
  async getActuaciones(): Promise<DatabaseActuacionType[]> {
    console.log(
      '🧡 initiating getActuaciones' 
    );

    if ( this.idProcesos.length === 0 ) {
      return [];
    }

    for ( const idProceso of this.idProcesos ) {
      try {
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
          `💾 hay ${ actuaciones.length } actuaciones en ${ this.numero }`,
        );

        const ultimaAct = getLatestByDate(
          actuaciones 
        );

        const DatabaseActuacionTypees = actuaciones.map(
          (
            actuacion 
          ) => {
            const isUltimaAct
              = ultimaAct
            && String(
              ultimaAct.idRegActuacion 
            )
              === String(
                actuacion.idRegActuacion 
              )
                ? true
                : actuacion.cant === actuacion.consActuacion;

            return {
              ...actuacion,
              idRegActuacion: `${ actuacion.idRegActuacion }`,
              idProceso     : idProceso.toString(),
              isUltimaAct,
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

        DatabaseActuacionTypees.forEach(
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

  /**
   * @async
   * @method getProcesosByName
   * @description Método alternativo para buscar procesos utilizando el nombre o razón social en lugar del número de radicado.
   * Filtra procesos privados y actualiza los arrays de estado internos `procesos` e `idProcesos`.
   * * @returns {Promise<outProceso[]>} Un array con los procesos encontrados por nombre.
   */
  async getProcesosByName(): Promise<outProceso[]> {
    const fetchUrl = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial?nombre=${ this.nombre }&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`;

    try {
      const request = await fetchWithSmartRetry(
        fetchUrl 
      );

      if ( !request.ok ) {
        const json = await request.json();

        throw new Error(
          JSON.stringify(
            json 
          ) 
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
          {
            ...proceso,
            idProceso: proceso.idProceso.toString(),
          } 
        );
        this.idProcesos.push(
          proceso.idProceso.toString() 
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

  /**
   * @async
   * @method agregateToDBMethod
   * @description Método principal de persistencia. Orquesta el guardado/actualización en cascada de todos los datos
   * de la instancia hacia la base de datos usando Prisma (Carpeta, Juzgado, Deudor, Demanda, Codeudor, Notas,
   * Procesos y Actuaciones). Implementa `upsert` e ignora duplicados donde corresponde.
   * * @returns {Promise<void>}
   */
  async agregateToDBMethod(): Promise<void> {
    console.log(
      `💾 Saving updates for ${ this.numero }...` 
    );

    const newDemanda = ClassDemanda.prismaDemanda(
      this.demanda 
    );
    const newDeudor = ClassDeudor.prismaDeudor(
      this.deudor 
    );
    const newCarpeta = ClassCarpeta.prismaCarpeta(
      this 
    );

    // 1. Upsert carpeta base
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
    }

    // 2. Relacionar juzgado
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
    try {
      console.log(
        '\n        🙆 update carpeta with deudor' 
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
    if ( this.procesos && this.procesos.length > 0 ) {
      for ( const proceso of this.procesos ) {
        try {
          const {
            juzgado, ...restProceso 
          } = proceso;

          // 🛑 1. Throw a safety error if juzgado is somehow missing,
          // to satisfy TypeScript and prevent Prisma from crashing.
          if ( !juzgado ) {
            throw new Error(
              `El proceso ${ proceso.idProceso } no tiene un juzgado válido, lo cual es requerido por la base de datos.`,
            );
          }

          // ✅ 2. Provide the relation directly without the ternary operator
          await client.proceso.upsert(
            {
              where: {
                idProceso: proceso.idProceso.toString(),
              },
              create: {
                ...restProceso,
                carpeta: {
                  connect: {
                    numero: this.numero,
                  },
                },
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
              },
              update: {
                ...restProceso,
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
              },
            } 
          );
        } catch ( error ) {
          console.log(
            `❌ Error al crear proceso ${ proceso.idProceso }: ${ error }`,
          );
        }

        const processActuaciones = this.actuaciones.filter(
          (
            a 
          ) => {
            return a.idProceso.toString() === proceso.idProceso.toString();
          } 
        );
        const ultimaActuacion = getLatestByDate(
          processActuaciones 
        );

        for ( const actuacion of processActuaciones ) {
          try {
            const isUltima
              = ultimaActuacion
              && String(
                actuacion.idRegActuacion 
              )
                === String(
                  ultimaActuacion.idRegActuacion 
                );

            await client.actuacion.upsert(
              {
                where: {
                  idRegActuacion: actuacion.idRegActuacion,
                },
                create: {
                  ...actuacion,
                  isUltimaAct: isUltima
                    ? true
                    : actuacion.cant === actuacion.consActuacion,
                  idRegActuacion: `${ actuacion.idRegActuacion }`,
                  proceso       : {
                    connect: {
                      idProceso: proceso.idProceso,
                    },
                  },
                },
                update: {
                  ...actuacion,
                  isUltimaAct: isUltima
                    ? true
                    : actuacion.cant === actuacion.consActuacion,
                  ...( isUltima && {
                    cant: actuacion.cant,
                  } ),
                },
              } 
            );
          } catch ( error ) {
            console.log(
              `❌ Error al crear actuacion ${ actuacion.idRegActuacion }: ${ error }`,
            );
          }

          if (
            String(
              actuacion.idRegActuacion 
            )
            === String(
              ultimaActuacion?.idRegActuacion 
            )
          ) {
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
        }
      }
    }
  }

  /**
   * @static
   * @method prismaCarpeta
   * @description Helper estático que extrae las propiedades de la instancia `IntCarpeta`
   * y las mapea a un formato aceptado por Prisma para operaciones de creación (`Prisma.CarpetaCreateInput`).
   * * @param {IntCarpeta} carpeta - La instancia de la carpeta a formatear.
   * @returns {Prisma.CarpetaCreateInput} El objeto formateado para Prisma.
   */
  static prismaCarpeta(
    carpeta: IntCarpeta 
  ): Prisma.CarpetaCreateInput {
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

  /**
   * @static
   * @async
   * @method updateNotes
   * @description Toma las notas de una instancia de Carpeta y las inserta masivamente en la base de datos,
   * omitiendo aquellas que ya existan (skipDuplicates).
   * * @param {ClassCarpeta} incomingCarpeta - La instancia de la carpeta que contiene las notas a actualizar.
   * @returns {Promise<number>} La cantidad de registros insertados.
   */
  static async updateNotes(
    incomingCarpeta: ClassCarpeta 
  ): Promise<number> {
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

  /**
   * @static
   * @async
   * @method getCarpeta
   * @description Recupera un expediente completo desde la base de datos utilizando su `numero`,
   * incluyendo todas sus relaciones (actuaciones, deudor, codeudor, notas, tareas, demanda y procesos).
   * * @param {number} numero - El número único de la carpeta a consultar.
   * @returns {Promise<any>} Objeto completo del expediente con relaciones incluidas. Lanza error si no se encuentra.
   */
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
}
