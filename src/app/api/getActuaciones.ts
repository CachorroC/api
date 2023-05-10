import { intActuacion, intConsultaActuaciones } from "#@/interfaces/procesos";
import { fixFechas } from "#@/lib/fix";
import "server-only";

export default async function getActuaciones({
  idProceso,
}: {
  idProceso: number;
}) {
  const req = await fetch(
    `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${idProceso}`,
    { cache: "no-store" }
  );
  const res = (await req.json()) as intConsultaActuaciones;
  return res.actuaciones.map((actuacion, index) => {
    const fixed: intActuacion = {
      idRegActuacion: actuacion.idRegActuacion,
      llaveProceso: actuacion.llaveProceso,
      consActuacion: actuacion.consActuacion,
      fechaActuacion: fixFechas(actuacion.fechaActuacion),
      actuacion: actuacion.actuacion,
      anotacion: actuacion.anotacion,
      fechaInicial: fixFechas(actuacion.fechaInicial),
      fechaFinal: fixFechas(actuacion.fechaFinal),
      fechaRegistro: fixFechas(actuacion.fechaRegistro),
      codRegla: actuacion.codRegla,
      conDocumentos: actuacion.conDocumentos,
      cant: actuacion.cant,
    };
    return fixed;
  });
}
