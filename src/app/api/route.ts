import { NextRequest, NextResponse } from "next/server";
import { intProceso } from "#@/interfaces/procesos";
import Procesos from "#@/delta/procesos";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const delay = searchParams.get("delay");

  if (delay) {
    await new Promise((resolve) => {
      return setTimeout(resolve, Number(delay));
    });
  }
  const idProceso = searchParams.get("idProceso");

  if (idProceso) {
    const procesos = Procesos.find((proceso) => {
      return proceso.idProceso.toString() === idProceso;
    });

    return new NextResponse(JSON.stringify(procesos), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  }
  const llaveProceso = searchParams.get("llaveProceso");

  if (llaveProceso) {
    const procesos = Procesos.filter((proceso) => {
      return proceso.llaveProceso === llaveProceso;
    });

    return new NextResponse(JSON.stringify(procesos), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const procesos = Procesos.map((Proceso) => {
    return Proceso;
  });
  return new NextResponse(JSON.stringify(procesos), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}
