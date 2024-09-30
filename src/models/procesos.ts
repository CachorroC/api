import { client } from "../services/prisma";
import { ConsultaNumeroRadicacion, outProceso } from "../types/procesos";
import { JuzgadoClass } from "./juzgado";

export class ClassProcesos {
  idProcesosSet: Set<number> = new Set();
  procesos: outProceso[] = [];
  numero: number;
  carpetaId: number;
  constructor(procesos: outProceso[], numero: number, carpetaId: number) {
    this.carpetaId = carpetaId;
    this.numero = numero;

    procesos.forEach((proceso) => {
      if (!proceso.esPrivado) {
        this.procesos.push(proceso);
        this.idProcesosSet.add(proceso.idProceso);
      }
    });
  }
  async prismaUpdateProcesos() {
    try {
      const carpeta = await client.carpeta.findFirstOrThrow({
        where: {
          numero: this.numero,
        },
      });
      carpeta.idProcesos.forEach((idProceso) => {
        this.idProcesosSet.add(idProceso);
      });

      const updater = await client.carpeta.update({
        where: {
          mainId: {
            numero: this.numero,
            id: this.carpetaId,
          },
        },
        data: {
          idProcesos: {
            set: Array.from(this.idProcesosSet),
          },
          procesos: {
            connectOrCreate: this.procesos.map((proceso) => {
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
                          id: proceso.juzgado.id,
                          tipo: proceso.juzgado.tipo,
                          ciudad: proceso.juzgado.ciudad,
                        },
                      },
                      create: proceso.juzgado,
                    },
                  },
                },
              };
            }),
          },
        },
      });
      console.log(updater);
      return updater;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getProcesos(llaveProceso: string, numero = 0, carpetaId = 0) {
    try {
      const request = await fetch(
        `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${llaveProceso}&SoloActivos=false&pagina=1`,
      );

      if (!request.ok) {
        throw new Error(
          `${llaveProceso}: ${request.status} ${
            request.statusText
          }${JSON.stringify(request, null, 2)}`,
        );
      }

      const json = (await request.json()) as ConsultaNumeroRadicacion;

      const { procesos } = json;

      const mappedprocesos = procesos.map((proceso) => {
        return {
          ...proceso,
          fechaProceso: proceso.fechaProceso
            ? new Date(proceso.fechaProceso)
            : null,
          fechaUltimaActuacion: proceso.fechaUltimaActuacion
            ? new Date(proceso.fechaUltimaActuacion)
            : null,
          juzgado: JuzgadoClass.fromProceso(proceso),
        };
      });
      return new ClassProcesos(mappedprocesos, numero, carpetaId);
    } catch (error) {
      console.log(error);
      return new ClassProcesos([], numero, carpetaId);
    }
  }
}
