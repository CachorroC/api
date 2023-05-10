import {
  intConsultaNumeroRadicacion,
  intProceso,
} from "#@/interfaces/procesos";
import { fixFechas, fixDemandado } from "#@/lib/fix";
import { getBaseUrl } from "#@/lib/getBaseUrl";

import { notFound } from "next/navigation";
import { cache } from "react";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const rows: unknown[] = [];

export async function getProcesos() {
  const res = await fetch(`${getBaseUrl()}/api`);

  const procesos = (await res.json()) as intProceso[];
  return procesos;
}
//? en este bloque está la peticion con llaveProceso a nuestra api pero decido colocarlo con la peticion a la rama judicial

export async function getProcesosByllaveProceso({
  llaveProceso,
}: {
  llaveProceso: string;
}) {
  const res = await fetch(`${getBaseUrl()}/api?llaveProceso=${llaveProceso}`);
  const proceso = (await res.json()) as intProceso[];
  return proceso;
}
/* export async function getProcesosByllaveProceso (
  {
    llaveProceso,
  }: {
    llaveProceso: string;
  }
) {
  const req = await fetch(
    `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=${ llaveProceso }&SoloActivos=true`,
  );
  
  const res = ( await req.json() ) as intConsultaNumeroRadicacion;
  const Procesos = res.procesos.map(
    (
      proceso, index
    ) => {
      const fixed: intProceso = {
        idProceso: proceso.idProceso,
        idConexion: proceso.idConexion,
        llaveProceso: proceso.llaveProceso,
        fechaProceso: fixFechas(
          proceso.fechaProceso
        ),
        fechaUltimaActuacion: fixFechas(
          proceso.fechaUltimaActuacion
        ),
        despacho: proceso.despacho.toLowerCase(),
        departamento: proceso.departamento.toLowerCase().replace(
          /^./,
          (
            str
          ) => {
            return str.toUpperCase();
          }
        ),
        sujetosProcesales: fixDemandado(
          proceso.sujetosProcesales
        ),
        esPrivado: proceso.esPrivado,
        cantFilas: proceso.cantFilas,
      };
      return fixed;
    }
  );
  return Procesos;
}
 */

export async function getProcesoByidProceso({
  idProceso,
}: {
  idProceso: number;
}) {
  const res = await fetch(`${getBaseUrl()}/api?idProceso=${idProceso}`);
  if (!res.ok) {
    throw new Error("no pudo obtener el proceso by idProceso ");
  }
  const proceso = (await res.json()) as intProceso;
  return proceso;
}
