import { client } from "../services/prisma";
import { intActuacion } from "../types/actuaciones";
import * as fs from "fs/promises";

export async function actuacionesGetAuto() {
  const actuaciones = await client.actuacion.findMany();

  const newActs = actuaciones.map((actuacion) => {
    return actuacionHasAuto(actuacion);
  });

  fs.writeFile("actuacionesNewMap.json", JSON.stringify(newActs));
  return newActs;
}

export function actuacionHasAuto(incomingActuacion: intActuacion) {
  const { actuacion } = incomingActuacion;

  const hasAuto = /([Aa][Uu][Tt][Oo]+)\s([A-Z a-zÓÍÚÉÀóíúáé,.()\w/]+)/.test(
    actuacion,
  );

  const hasRadicado =
    /([Rr][Aa][Dd][Ii][Cc][Aa]+)([A-Z a-zÓÍÚÉÀóíúáé,.()\w/]+)/.test(actuacion);

  return {
    ...incomingActuacion,
    hasAuto: hasAuto,
    hasRadicado: hasRadicado,
  };
}
