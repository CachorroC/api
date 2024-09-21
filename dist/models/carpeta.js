"use strict";
Object.defineProperty(
  exports, "__esModule", { value: true }
);
exports.ClassCarpeta = void 0;
const demanda_1 = require(
  "./demanda"
);
const deudor_1 = require(
  "./deudor"
);
const juzgado_1 = require(
  "./juzgado"
);
const nota_1 = require(
  "./nota"
);
const tipoProceso_1 = require(
  "./tipoProceso"
);
const prisma_1 = require(
  "../services/prisma"
);
process.env[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
console.log(
  process.env.NODE_TLS_REJECT_UNAUTHORIZED
);
class ClassCarpeta {
  //PROPERTIES -todas las propiedades  que existen en la class carpeta
  //PROPERTIES array objects
  procesos = [];
  idProcesos = [];
  actuaciones = [];
  notas = [];
  //!PROPERTIES
  //PROPERTIES reg objects
  ultimaActuacion;
  codeudor;
  demanda;
  deudor;
  //!PROPERTIES
  //PROPERTIES primitive types
  numero;
  llaveProceso;
  fecha;
  idRegUltimaAct;
  id;
  category;
  nombre;
  revisado;
  terminado;
  tipoProceso;
  notasCount;
  juzgadoTipo;
  ciudad;
  juzgado;
  fechaUltimaRevision;
  //!PROPERTIES
  //!PROPERTIES
  //CONSTRUCTOR - EL CONSTRUCTOR DE LA CARPETA
  constructor(
    rawCarpeta
  ) {
    const { NUMERO, category, DEMANDADO_IDENTIFICACION: cedula, EXPEDIENTE, DEMANDADO_NOMBRE, FECHA_ULTIMA_REVISION, FECHA_ULTIMA_ACTUACION, CODEUDOR_NOMBRE, CODEUDOR_IDENTIFICACION, CODEUDOR_DIRECCION, CODEUDOR_TELEFONOS, JUZGADO_EJECUCION, JUZGADO_ORIGEN, JUZGADO_CIUDAD, TIPO_PROCESO, EXTRA, OBSERVACIONES, } = rawCarpeta;
    let idBuilder;
    let notasCounter = 0;
    if (FECHA_ULTIMA_REVISION) {
      this.fechaUltimaRevision = new Date(
        FECHA_ULTIMA_REVISION
      );
    }
    if (FECHA_ULTIMA_ACTUACION) {
      this.fecha = new Date(
        FECHA_ULTIMA_ACTUACION
      );
    }
    if (OBSERVACIONES) {
      const extras = OBSERVACIONES.split(
        "//"
      );
      extras.forEach(
        (
          nota
        ) => {
          notasCounter++;
          const newNoter = new nota_1.NotasBuilder(
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
    if (EXTRA) {
      console.log(
        `EXTRAS === ${EXTRA}`
      );
      const extras = String(
        EXTRA
      ).split(
        "//"
      );
      extras.forEach(
        (
          nota
        ) => {
          notasCounter++;
          const newNoter = new nota_1.NotasBuilder(
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
    const cedulaAsNumber = Number(
      cedula
    );
    if (isNaN(
      cedulaAsNumber
    )) {
      idBuilder = Number(
        NUMERO
      );
    }
    else {
      idBuilder = cedulaAsNumber;
    }
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
    ) ? this.id : Number(
        NUMERO
      );
    this.category = category;
    this.deudor = new deudor_1.ClassDeudor(
      rawCarpeta
    );
    this.llaveProceso = String(
      EXPEDIENTE
    );
    this.demanda = new demanda_1.ClassDemanda(
      rawCarpeta
    );
    this.nombre = String(
      DEMANDADO_NOMBRE
    );
    this.revisado = false;
    this.codeudor = {
      nombre: CODEUDOR_NOMBRE ? String(
        CODEUDOR_NOMBRE
      ) : null,
      cedula: CODEUDOR_IDENTIFICACION ? String(
        CODEUDOR_IDENTIFICACION
      ) : null,
      direccion: CODEUDOR_DIRECCION ? String(
        CODEUDOR_DIRECCION
      ) : null,
      telefono: CODEUDOR_TELEFONOS ? String(
        CODEUDOR_TELEFONOS
      ) : null,
      id: this.numero,
    };
    this.tipoProceso = TIPO_PROCESO
      ? (0, tipoProceso_1.tipoProcesoBuilder)(
          TIPO_PROCESO
        )
      : "SINGULAR";
    this.terminado = category === "Terminados" ? true : false;
    this.idRegUltimaAct = null;
    this.fecha = null;
    this.ultimaActuacion = null;
    this.llaveProceso = EXPEDIENTE ? String(
      EXPEDIENTE
    ) : "SinEspecificar";
    this.numero = Number(
      NUMERO
    );
    this.ciudad = String(
      JUZGADO_CIUDAD
    );
    this.juzgado = juzgado_1.JuzgadoClass.fromShortName(
      {
        ciudad: String(
          JUZGADO_CIUDAD
        ),
        juzgadoRaw: JUZGADO_EJECUCION
          ? JUZGADO_EJECUCION
          : JUZGADO_ORIGEN
            ? JUZGADO_ORIGEN
            : "",
      }
    );
    this.fechaUltimaRevision = null;
    this.juzgadoTipo = this.juzgado.tipo;
  }
  //!CONSTRUCTOR -
  //METHODS
  //ASYNC - getProcesos
  async getProcesos() {
    try {
      const request = await fetch(
        `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${this.llaveProceso}&SoloActivos=false&pagina=1`
      );
      if (!request.ok) {
        const json = await request.json();
        throw new Error(
          `${request.status} : ${request.statusText} === ${JSON.stringify(
            json
          )}`
        );
      }
      const consultaProcesos = (await request.json());
      const { procesos } = consultaProcesos;
      for (const rawProceso of procesos) {
        if (rawProceso.esPrivado) {
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
          juzgado: juzgado_1.JuzgadoClass.fromProceso(
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
    }
    catch (error) {
      console.log(
        `${this.numero} => error en CarpetaBuilder.getProcesos(${this.llaveProceso}) => ${error}`
      );
      return null;
    }
  }
  //!ASYNC
  //ASYNC getProcesosByName
  async getProcesosByName() {
    const fetchUrl = new URL(
      `Procesos/Consulta/NombreRazonSocial?nombre=${this.nombre}&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`, "https://consultaprocesos.ramajudicial.gov.co:448/api/v2/"
    );
    try {
      const request = await fetch(
        fetchUrl
      );
      if (!request.ok) {
        const json = await request.json();
        throw new Error(
          JSON.stringify(
            json
          )
        );
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
            ? new Date(
              rawProceso.fechaProceso
            )
            : null,
          fechaUltimaActuacion: rawProceso.fechaUltimaActuacion
            ? new Date(
              rawProceso.fechaUltimaActuacion
            )
            : null,
          juzgado: juzgado_1.JuzgadoClass.fromProceso(
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
    }
    catch (error) {
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
          throw new Error(
            request.statusText
          );
        }
        const consultaActuaciones = (await request.json());
        const { actuaciones } = consultaActuaciones;
        const outActuaciones = actuaciones.map(
          (
            actuacion
          ) => {
            return {
              ...actuacion,
              idProceso: idProceso,
              isUltimaAct: actuacion.cant === actuacion.consActuacion,
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
            if (actuacion.isUltimaAct) {
              this.ultimaActuacion = actuacion;
              this.fecha = actuacion.fechaActuacion;
              this.idRegUltimaAct = actuacion.idRegActuacion;
            }
          }
        );
        continue;
      }
      catch (error) {
        console.log(
          `${this.numero} ERROR ==> getActuaciones ${idProceso} => ${JSON.stringify(
            error, null, 2
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
  static prismaCarpeta(
    carpeta
  ) {
    const newCarpeta = {
      id: carpeta.id,
      llaveProceso: carpeta.llaveProceso,
      nombre: carpeta.nombre,
      ciudad: carpeta.ciudad,
      numero: carpeta.numero,
      category: carpeta.category,
      fecha: carpeta.fecha,
      fechaUltimaRevision: carpeta.fechaUltimaRevision,
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
  static async updateNotes(
    incomingCarpeta
  ) {
    const { notas } = incomingCarpeta;
    const updater = await prisma_1.client.nota.createMany(
      {
        data: notas,
        skipDuplicates: true,
      }
    );
    console.log(
      updater
    );
    return updater.count;
  }
  static async getCarpeta(
    numero
  ) {
    return await prisma_1.client.carpeta.findFirstOrThrow(
      {
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
      }
    );
  }
  static async updateCarpeta(
    incomingCarpeta
  ) {
    const { ultimaActuacion, demanda, deudor, notas } = incomingCarpeta;
    const newDemanda = demanda_1.ClassDemanda.prismaDemanda(
      demanda
    );
    const newDeudor = deudor_1.ClassDeudor.prismaDeudor(
      deudor
    );
    const newCarpeta = ClassCarpeta.prismaCarpeta(
      incomingCarpeta
    );
    const inserter = await prisma_1.client.carpeta.update(
      {
        where: {
          numero: incomingCarpeta.numero,
        },
        data: {
          category: newCarpeta.category,
          fecha: newCarpeta.fecha,
          terminado: newCarpeta.terminado,
          nombre: newCarpeta.nombre,
          notasCount: newCarpeta.notasCount,
          ultimaActuacion: ultimaActuacion
            ? {
                connectOrCreate: {
                  where: {
                    idRegActuacion: ultimaActuacion.idRegActuacion,
                  },
                  create: {
                    ...ultimaActuacion,
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
              data: notas,
              skipDuplicates: true,
            },
          },
        },
      }
    );
    console.log(
      inserter
    );
  }
  static async insertCarpeta(
    incomingCarpeta
  ) {
    const { ultimaActuacion, procesos, actuaciones, demanda, deudor, codeudor, notas, } = incomingCarpeta;
    const newDemanda = demanda_1.ClassDemanda.prismaDemanda(
      demanda
    );
    const newDeudor = deudor_1.ClassDeudor.prismaDeudor(
      deudor
    );
    const newCarpeta = ClassCarpeta.prismaCarpeta(
      incomingCarpeta
    );
    await prisma_1.client.carpeta.upsert(
      {
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
                    idRegActuacion: ultimaActuacion.idRegActuacion,
                  },
                  create: {
                    ...ultimaActuacion,
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
            connectOrCreate: procesos.map(
              (
                proceso
              ) => {
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
                        (
                          actuacion
                        ) => {
                          const actuacionCreateOrConnect = {
                            where: {
                              idRegActuacion: actuacion.idRegActuacion,
                            },
                            create: {
                              ...actuacion,
                            },
                          };
                          return actuacionCreateOrConnect;
                        }
                      ),
                    },
                  },
                };
                return procesoCreateorConnect;
              }
            ),
          },
        },
        update: {
          ...newCarpeta,
          fecha: newCarpeta.fecha,
          fechaUltimaRevision: newCarpeta.fechaUltimaRevision,
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
                    idRegActuacion: ultimaActuacion.idRegActuacion,
                  },
                  create: {
                    ...ultimaActuacion,
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
            connectOrCreate: procesos.map(
              (
                proceso
              ) => {
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
                        (
                          actuacion
                        ) => {
                          const actuacionCreateOrConnect = {
                            where: {
                              idRegActuacion: actuacion.idRegActuacion,
                            },
                            create: {
                              ...actuacion,
                            },
                          };
                          return actuacionCreateOrConnect;
                        }
                      ),
                    },
                  },
                };
                return procesoCreateorConnect;
              }
            ),
          },
        },
      }
    );
  }
}
exports.ClassCarpeta = ClassCarpeta;
//# sourceMappingURL=carpeta.js.map