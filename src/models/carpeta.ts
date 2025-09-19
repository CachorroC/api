import { Prisma } from '@prisma/client';
import {
  ConsultaActuacion,
  outActuacion,
} from '../types/actuaciones';
import {
  Codeudor,
  IntCarpeta,
  Juzgado,
  TipoProceso,
} from '../types/carpetas';
import {
  ConsultaProcesos,
  outProceso,
} from '../types/procesos';
import { RawDb } from '../types/raw-db';
import { ClassDemanda } from './demanda';
import { ClassDeudor } from './deudor';
import { JuzgadoClass } from './juzgado';
import { NotasBuilder } from './nota';
import { tipoProcesoBuilder } from './tipoProceso';
import { client } from '../services/prisma';
import { sleep } from '../utils/awaiter';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED);

export class ClassCarpeta implements IntCarpeta {
  //PROPERTIES -todas las propiedades  que existen en la class carpeta

  //PROPERTIES array objects
  procesos: outProceso[] = [];
  idProcesos: number[] = [];
  actuaciones: outActuacion[] = [];
  notas: NotasBuilder[] = [];
  //!PROPERTIES

  //PROPERTIES reg objects
  ultimaActuacion: outActuacion | null;
  codeudor: Codeudor;
  demanda: ClassDemanda;
  deudor: ClassDeudor;
  //!PROPERTIES

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
  juzgado: Juzgado;
  fechaUltimaRevision: Date | null;
  //!PROPERTIES
  //!PROPERTIES
  //CONSTRUCTOR - EL CONSTRUCTOR DE LA CARPETA
  constructor(rawCarpeta: RawDb) {
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

    this.fechaUltimaRevision = FECHA_ULTIMA_REVISION
      ? new Date(FECHA_ULTIMA_REVISION)
      : null;

    this.fecha = FECHA_ULTIMA_ACTUACION
      ? new Date(FECHA_ULTIMA_ACTUACION)
      : null;

    if (OBSERVACIONES) {
      const extras = OBSERVACIONES.split('//');
      extras.forEach((nota) => {
        notasCounter++;

        const newNoter = new NotasBuilder(
          nota,
          Number(NUMERO),
          notasCounter
        );
        this.notas.push(newNoter);
      });
    }

    if (EXTRA) {
      console.log(`EXTRAS === ${EXTRA}`);

      const extras = String(EXTRA).split('//');

      extras.forEach((nota) => {
        notasCounter++;

        const newNoter = new NotasBuilder(
          nota,
          Number(NUMERO),
          notasCounter
        );
        this.notas.push(newNoter);
      });
    }

    const cedulaAsNumber = Number(cedula);

    if (isNaN(cedulaAsNumber)) {
      idBuilder = Number(NUMERO);
    } else {
      idBuilder = cedulaAsNumber;
    }

    this.notasCount = notasCounter;
    this.id = idBuilder;
    this.ciudad = String(JUZGADO_CIUDAD);
    this.idRegUltimaAct = null;
    this.numero = isNaN(Number(NUMERO))
      ? this.id
      : Number(NUMERO);
    this.category = category;
    this.deudor = new ClassDeudor(rawCarpeta);

    this.llaveProceso = String(EXPEDIENTE);
    this.demanda = new ClassDemanda(rawCarpeta);
    this.nombre = String(DEMANDADO_NOMBRE);
    this.revisado = false;
    this.codeudor = {
      nombre: CODEUDOR_NOMBRE
        ? String(CODEUDOR_NOMBRE)
        : null,
      cedula: CODEUDOR_IDENTIFICACION
        ? String(CODEUDOR_IDENTIFICACION)
        : null,
      direccion: CODEUDOR_DIRECCION
        ? String(CODEUDOR_DIRECCION)
        : null,
      telefono: CODEUDOR_TELEFONOS
        ? String(CODEUDOR_TELEFONOS)
        : null,
      id: this.numero,
    };
    this.tipoProceso = TIPO_PROCESO
      ? tipoProcesoBuilder(TIPO_PROCESO)
      : 'SINGULAR';

    this.terminado =
      category === 'Terminados' ? true : false;
    this.idRegUltimaAct = null;
    this.ultimaActuacion = null;
    this.llaveProceso = EXPEDIENTE
      ? String(EXPEDIENTE)
      : 'SinEspecificar';
    this.numero = Number(NUMERO);
    this.ciudad = String(JUZGADO_CIUDAD);
    this.juzgado = JuzgadoClass.fromShortName({
      ciudad: String(JUZGADO_CIUDAD),
      juzgadoRaw: JUZGADO_EJECUCION
        ? JUZGADO_EJECUCION
        : JUZGADO_ORIGEN
        ? JUZGADO_ORIGEN
        : '',
    });
    this.juzgadoTipo = this.juzgado.tipo;
  }
  //!CONSTRUCTOR -

  //METHODS
  //ASYNC - getProcesos
  async getProcesos() {
    /*   await sleep( 2000 ) */
    try {
      const isInPrisma = await client.proceso.findMany({
        where: { llaveProceso: this.llaveProceso },
        select: {
          fechaProceso: true,
          fechaUltimaActuacion: true,
          juzgado: true,
          idProceso: true,
          idConexion: true,
          llaveProceso: true,
          despacho: true,
          departamento: true,
          sujetosProcesales: true,
          esPrivado: true,
          cantFilas: true,
        },
      });

      if (isInPrisma.length > 0) {
        for (const rawProceso of isInPrisma) {
          if (rawProceso.esPrivado) {
            continue;
          }

          const proceso = {
            ...rawProceso,
            fechaProceso: rawProceso.fechaProceso
              ? new Date(rawProceso.fechaProceso)
              : null,
            fechaUltimaActuacion:
              rawProceso.fechaUltimaActuacion
                ? new Date(rawProceso.fechaUltimaActuacion)
                : null,
            juzgado: JuzgadoClass.fromProceso(rawProceso),
          };
          this.procesos.push(proceso);
          this.idProcesos.push(proceso.idProceso);
        }
      } else {
        const request = await fetch(
          `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${this.llaveProceso}&SoloActivos=false&pagina=1`,
          {
            cache: 'force-cache',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!request.ok) {
          const json = await request.json();

          throw new Error(
            `${request.status} : ${
              request.statusText
            } === ${JSON.stringify(json)}`
          );
        }

        const consultaProcesos =
          (await request.json()) as ConsultaProcesos;

        const { procesos } = consultaProcesos;

        for (const rawProceso of procesos) {
          if (rawProceso.esPrivado) {
            continue;
          }

          const proceso = {
            ...rawProceso,
            fechaProceso: rawProceso.fechaProceso
              ? new Date(rawProceso.fechaProceso)
              : null,
            fechaUltimaActuacion:
              rawProceso.fechaUltimaActuacion
                ? new Date(rawProceso.fechaUltimaActuacion)
                : null,
            juzgado: JuzgadoClass.fromProceso(rawProceso),
          };
          this.procesos.push(proceso);
          this.idProcesos.push(proceso.idProceso);
        }
      }
      return this.procesos;
    } catch (error) {
      console.log(
        `${this.numero} => error en CarpetaBuilder.getProcesos(${this.llaveProceso}) => ${error}`
      );
      return this.procesos;
    }
  }
  //!ASYNC
  //ASYNC getProcesosByName
  async getProcesosByName() {
    const fetchUrl = new URL(
      `Procesos/Consulta/NombreRazonSocial?nombre=${this.nombre}&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`,
      'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/'
    );

    try {
      const request = await fetch(fetchUrl);

      if (!request.ok) {
        const json = await request.json();

        throw new Error(JSON.stringify(json));
      }

      const consultaProcesos = await request.json();

      const { procesos } = consultaProcesos;

      for (const rawProceso of procesos) {
        if (rawProceso.esPrivado) {
          continue;
        }

        const proceso = {
          ...rawProceso,
          fechaProceso: rawProceso.fechaProceso
            ? new Date(rawProceso.fechaProceso)
            : null,
          fechaUltimaActuacion:
            rawProceso.fechaUltimaActuacion
              ? new Date(rawProceso.fechaUltimaActuacion)
              : null,
          juzgado: JuzgadoClass.fromProceso(rawProceso),
        };
        this.procesos.push(proceso);
        this.idProcesos.push(proceso.idProceso);
      }

      return this.procesos;
    } catch (error) {
      console.log(
        `${this.numero} => error en CarpetaBuilder.getProcesos(${this.llaveProceso}) => ${error}`
      );
      return [];
    }
  }
  //!ASYNC
  //ASYNC - getActuaciones
  async getActuaciones() {
    if (this.idProcesos.length === 0) {
      return [];
    }

    for (const idProceso of this.idProcesos) {
      try {
        const request = await fetch(
          `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${idProceso}`
        );

        if (!request.ok) {
          throw new Error(request.statusText);
        }

        const consultaActuaciones =
          (await request.json()) as ConsultaActuacion;

        const { actuaciones } = consultaActuaciones;

        const outActuaciones = actuaciones.map(
          (actuacion) => {
            return {
              ...actuacion,
              idRegActuacion: `${actuacion.idRegActuacion}`,
              idProceso: Number(idProceso),
              isUltimaAct:
                actuacion.cant === actuacion.consActuacion,
              fechaActuacion: new Date(
                actuacion.fechaActuacion
              ),
              fechaRegistro: new Date(
                actuacion.fechaRegistro
              ),
              fechaInicial: actuacion.fechaInicial
                ? new Date(actuacion.fechaInicial)
                : null,
              fechaFinal: actuacion.fechaFinal
                ? new Date(actuacion.fechaFinal)
                : null,
              createdAt: new Date(actuacion.fechaRegistro),
            };
          }
        );

        outActuaciones.forEach((actuacion) => {
          this.actuaciones.push(actuacion);

          if (actuacion.isUltimaAct) {
            this.ultimaActuacion = actuacion;
            this.fecha = actuacion.fechaActuacion;
            this.idRegUltimaAct = actuacion.idRegActuacion;
          }
        });
        continue;
      } catch (error) {
        console.log(
          `${
            this.numero
          } ERROR ==> getActuaciones ${idProceso} => ${JSON.stringify(
            error,
            null,
            2
          )}`
        );
        continue;
      }
    }
    /*
    if ( this.actuaciones.length > 0 )
    {

      const sorted = [ ...this.actuaciones ].sort(
        (
          a, b
        ) =>
        {


          const aFechaAct = new Date( a.fechaActuacion ).getTime()
          const bFechaAct = new Date( b.fechaActuacion ).getTime()
          return aFechaAct - bFechaAct
        }
      )

      const [ ultimaActuacion ] = sorted;
      this.ultimaActuacion = ultimaActuacion;
      this.fecha = ultimaActuacion.fechaActuacion;
      this.idRegUltimaAct = ultimaActuacion.idRegActuacion;
    } */

    return this.actuaciones;
  }
  //!ASYNC
  //STATIC

  static prismaCarpeta(carpeta: IntCarpeta) {
    const newCarpeta: Prisma.CarpetaCreateInput = {
      id: carpeta.id,
      llaveProceso: carpeta.llaveProceso,
      nombre: carpeta.nombre,
      ciudad: carpeta.ciudad,
      fechaUltimaRevision: carpeta.fechaUltimaRevision,
      numero: carpeta.numero,
      category: carpeta.category,
      fecha: carpeta.fecha,
      idProcesos: carpeta.idProcesos,
      notasCount: carpeta.notasCount,
      revisado: carpeta.revisado,
      terminado: carpeta.terminado,
      tipoProceso: carpeta.tipoProceso,
    };
    return newCarpeta;
  }
  //!STATIC
  //STATICASYNC
  static async updateNotes(incomingCarpeta: ClassCarpeta) {
    const { notas } = incomingCarpeta;

    const updater = await client.nota.createMany({
      data: notas,
      skipDuplicates: true,
    });
    console.log(updater);
    return updater.count;
  }
  static async getCarpeta(numero: number) {
    return await client.carpeta.findFirstOrThrow({
      where: {
        numero: numero,
      },
      include: {
        ultimaActuacion: true,
        deudor: true,
        codeudor: true,
        notas: true,
        tareas: true,
        demanda: {
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
    });
  }
  /*   static async updateCarpeta(
    incomingCarpeta: ClassCarpeta
  ) {
    const {
      ultimaActuacion, demanda, deudor, notas
    }
      = incomingCarpeta;

    const newDemanda = ClassDemanda.prismaDemanda(
      demanda
    );

    const newDeudor = ClassDeudor.prismaDeudor(
      deudor
    );

    const newCarpeta
      = ClassCarpeta.prismaCarpeta(
        incomingCarpeta
      );

    const inserter = await client.carpeta.update(
      {
        where: {
          numero: incomingCarpeta.numero,
        },
        data: {
          category       : newCarpeta.category,
          fecha          : newCarpeta.fecha,
          terminado      : newCarpeta.terminado,
          nombre         : newCarpeta.nombre,
          notasCount     : newCarpeta.notasCount,
          ultimaActuacion: ultimaActuacion
            ? {
                connectOrCreate: {
                  where: {
                    idRegActuacion:
                    String(ultimaActuacion.idRegActuacion)
                  },
                  create: {
                    ...ultimaActuacion,
                    idRegActuacion: String(ultimaActuacion.idRegActuacion)

                  },
                },
              }
            : undefined,
          deudor: {
            update: {
              ...newDeudor,
            },
          },
          demanda: {
            update: {
              ...newDemanda,
            },
          },
          notas: {
            createMany: {
              data          : notas,
              skipDuplicates: true,
            },
          },
        },
      }
    );
    console.log(
      inserter
    );
  } */
  static async insertCarpeta(
    incomingCarpeta: ClassCarpeta
  ) {
    const {
      ultimaActuacion,
      procesos,
      actuaciones,
      demanda,
      deudor,
      codeudor,
      notas,
    } = incomingCarpeta;

    const newDemanda = ClassDemanda.prismaDemanda(demanda);

    const newDeudor = ClassDeudor.prismaDeudor(deudor);

    const newCarpeta =
      ClassCarpeta.prismaCarpeta(incomingCarpeta);

    try {
      await client.carpeta.upsert({
        where: {
          numero: incomingCarpeta.numero,
        },
        create: {
          ...newCarpeta,
          juzgado: {
            connectOrCreate: {
              where: {
                id_tipo_ciudad: {
                  tipo: incomingCarpeta.juzgado.tipo,
                  id: incomingCarpeta.juzgado.id,
                  ciudad: incomingCarpeta.juzgado.ciudad,
                },
              },
              create: {
                tipo: incomingCarpeta.juzgado.tipo,
                id: incomingCarpeta.juzgado.id,
                ciudad: incomingCarpeta.juzgado.ciudad,
                url: incomingCarpeta.juzgado.url,
              },
            },
          },
          ultimaActuacion: ultimaActuacion
            ? {
                connectOrCreate: {
                  where: {
                    idRegActuacion:
                      ultimaActuacion.idRegActuacion,
                  },
                  create: {
                    ...ultimaActuacion,
                    idRegActuacion: `${ultimaActuacion.idRegActuacion}`,
                  },
                },
              }
            : undefined,
          deudor: {
            connectOrCreate: {
              where: {
                id: incomingCarpeta.numero,
              },
              create: newDeudor,
            },
          },
          demanda: {
            connectOrCreate: {
              where: {
                id: incomingCarpeta.numero,
              },
              create: newDemanda,
            },
          },
          codeudor: {
            connectOrCreate: {
              where: {
                id: incomingCarpeta.numero,
              },
              create: {
                ...codeudor,
              },
            },
          },
          notas: {
            createMany: {
              data: notas,
              skipDuplicates: true,
            },
          },
          procesos: {
            connectOrCreate: procesos.map((proceso) => {
              const { juzgado, ...restProceso } = proceso;

              const procesoCreateorConnect = {
                where: {
                  idProceso: proceso.idProceso,
                },
                create: {
                  ...restProceso,
                  juzgado: {
                    connectOrCreate: {
                      where: {
                        id_tipo_ciudad: {
                          tipo: juzgado.tipo,
                          id: juzgado.id,
                          ciudad: juzgado.ciudad,
                        },
                      },
                      create: {
                        tipo: juzgado.tipo,
                        id: juzgado.id,
                        ciudad: juzgado.ciudad,
                        url: juzgado.url,
                      },
                    },
                  },
                  actuaciones: {
                    connectOrCreate: actuaciones.map(
                      (actuacion) => {
                        const actuacionCreateOrConnect: Prisma.ActuacionCreateOrConnectWithoutCarpetaInput =
                          {
                            where: {
                              idRegActuacion:
                                actuacion.idRegActuacion,
                            },
                            create: {
                              ...actuacion,
                              idRegActuacion: `${actuacion.idRegActuacion}`,
                            },
                          };
                        return actuacionCreateOrConnect;
                      }
                    ),
                  },
                },
              };

              return procesoCreateorConnect;
            }),
          },
        },
        update: {
          ...newCarpeta,
          fecha: newCarpeta.fecha,
          fechaUltimaRevision:
            newCarpeta.fechaUltimaRevision,
          category: newCarpeta.category,
          terminado: newCarpeta.terminado,
          revisado: newCarpeta.revisado,
          ciudad: newCarpeta.ciudad,
          nombre: newCarpeta.nombre,
          notasCount: newCarpeta.notasCount,
          juzgado: {
            connectOrCreate: {
              where: {
                id_tipo_ciudad: {
                  tipo: incomingCarpeta.juzgado.tipo,
                  id: incomingCarpeta.juzgado.id,
                  ciudad: incomingCarpeta.juzgado.ciudad,
                },
              },
              create: {
                tipo: incomingCarpeta.juzgado.tipo,
                id: incomingCarpeta.juzgado.id,
                ciudad: incomingCarpeta.juzgado.ciudad,
                url: incomingCarpeta.juzgado.url,
              },
            },
          },
          ultimaActuacion: ultimaActuacion
            ? {
                connectOrCreate: {
                  where: {
                    idRegActuacion:
                      ultimaActuacion.idRegActuacion,
                  },
                  create: {
                    ...ultimaActuacion,
                    idRegActuacion: `${ultimaActuacion.idRegActuacion}`,
                  },
                },
              }
            : undefined,
          demanda: {
            connectOrCreate: {
              where: {
                id: incomingCarpeta.numero,
              },
              create: newDemanda,
            },
          },
          notas: {
            createMany: {
              data: notas,
              skipDuplicates: true,
            },
          },
          procesos: {
            connectOrCreate: procesos.map((proceso) => {
              const { juzgado, ...restProceso } = proceso;

              const procesoCreateorConnect: Prisma.ProcesoCreateOrConnectWithoutCarpetaInput =
                {
                  where: {
                    idProceso: proceso.idProceso,
                  },
                  create: {
                    ...restProceso,
                    juzgado: {
                      connectOrCreate: {
                        where: {
                          id_tipo_ciudad: {
                            tipo: juzgado.tipo,
                            id: juzgado.id,
                            ciudad: juzgado.ciudad,
                          },
                        },
                        create: {
                          tipo: juzgado.tipo,
                          id: juzgado.id,
                          ciudad: juzgado.ciudad,
                          url: juzgado.url,
                        },
                      },
                    },
                    actuaciones: {
                      connectOrCreate: actuaciones.map(
                        (actuacion) => {
                          const actuacionCreateOrConnect: Prisma.ActuacionCreateOrConnectWithoutCarpetaInput =
                            {
                              where: {
                                idRegActuacion:
                                  actuacion.idRegActuacion,
                              },
                              create: {
                                ...actuacion,
                                idRegActuacion: `${actuacion.idRegActuacion}`,
                              },
                            };
                          return actuacionCreateOrConnect;
                        }
                      ),
                    },
                  },
                };

              return procesoCreateorConnect;
            }),
          },
        },
      });
    } catch (error) {
      console.log(`error al insertar la carpeta: ${error}`);
    }
  }
  //!STATICASYNC
  //!METHODS
}
