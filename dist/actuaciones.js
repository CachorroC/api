"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const prisma_1 = require("./services/prisma");
const awaiter_1 = require("./utils/awaiter");
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED);
async function fetcher(idProceso) {
    try {
        const request = await fetch(`https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${idProceso}`);
        if (!request.ok) {
            throw new Error(`${idProceso}: ${request.status} ${request.statusText}${JSON.stringify(request, null, 2)}`);
        }
        const json = (await request.json());
        const { actuaciones } = json;
        return actuaciones.map((actuacion) => {
            return {
                ...actuacion,
                fechaActuacion: new Date(actuacion.fechaActuacion),
                fechaRegistro: new Date(actuacion.fechaRegistro),
                fechaInicial: actuacion.fechaInicial
                    ? new Date(actuacion.fechaInicial)
                    : null,
                fechaFinal: actuacion.fechaFinal
                    ? new Date(actuacion.fechaFinal)
                    : null,
                isUltimaAct: actuacion.cant === actuacion.consActuacion,
                idProceso: idProceso,
                createdAt: new Date(actuacion.fechaRegistro),
            };
        });
    }
    catch (error) {
        console.log(error);
        return null;
    }
}
async function getIdProcesos() {
    const carpetas = await prisma_1.client.carpeta.findMany();
    return carpetas.flatMap((carpeta) => {
        return carpeta.idProcesos.map((idProceso) => {
            return {
                idProceso,
                carpetaNumero: carpeta.numero,
                llaveProceso: carpeta.llaveProceso,
                carpetaId: carpeta.id,
            };
        });
    });
}
async function* AsyncGenerateActuaciones(procesos) {
    for (const { idProceso, carpetaNumero, carpetaId } of procesos) {
        await (0, awaiter_1.sleep)(1000);
        const fetcherIdProceso = await fetcher(idProceso);
        if (fetcherIdProceso) {
            await prisma_1.client.actuacion.createMany({
                data: fetcherIdProceso,
                skipDuplicates: true,
            });
            await prismaUpdaterActuaciones(fetcherIdProceso, carpetaNumero, carpetaId);
        }
        yield fetcherIdProceso;
    }
}
async function updatePreviousLastActuacion(idRegUltimaAct) {
    try {
        if (idRegUltimaAct === null) {
            throw new Error('la idRegAct de la ultima actuacion es null');
        }
        await prisma_1.client.actuacion.update({
            where: {
                idRegActuacion: idRegUltimaAct,
            },
            data: {
                isUltimaAct: false,
            },
        });
    }
    catch (error) {
        console.log(`error al cambiar la ultima actuacion: ${error}`);
    }
}
async function updateCarpetaWithNewLastActuacion({ ultimaActuacion, numero }) {
    try {
        await prisma_1.client.carpeta.update({
            where: {
                numero: numero,
            },
            data: {
                fecha: new Date(ultimaActuacion.fechaActuacion),
                revisado: false,
                ultimaActuacion: {
                    connectOrCreate: {
                        where: {
                            idRegActuacion: ultimaActuacion.idRegActuacion,
                        },
                        create: {
                            ...ultimaActuacion,
                        },
                    },
                },
            },
        });
    }
    catch (error) {
        console.log(`error al cambiar la carpeta y actualizar la ultima actuacion: ${error}`);
    }
}
async function prismaUpdaterActuaciones(actuacionesComplete, numeroCarpeta, numeroId) {
    const [ultimaActuacion] = actuacionesComplete.filter((a) => {
        return a.consActuacion === a.cant;
    });
    try {
        const carpeta = await prisma_1.client.carpeta.findFirstOrThrow({
            where: {
                OR: [
                    {
                        llaveProceso: ultimaActuacion.llaveProceso,
                    },
                    {
                        numero: numeroCarpeta,
                        id: numeroId,
                    },
                ],
            },
        });
        const incomingDate = new Date(ultimaActuacion.fechaActuacion)
            .getTime();
        const savedDate = carpeta.fecha
            ? carpeta.fecha.getTime()
            : null;
        if (!savedDate || savedDate < incomingDate) {
            console.log('no hay saved date o la saved date es menor que incoming date');
            await updatePreviousLastActuacion(carpeta.idRegUltimaAct);
            await updateCarpetaWithNewLastActuacion({
                ultimaActuacion,
                numero: numeroCarpeta
            });
            await fs.mkdir(`./src/date/${new Date()
                .getFullYear()}/${new Date()
                .getMonth()}/${new Date()
                .getDate()}`, {
                recursive: true,
            });
            fs.writeFile(`./src/date/${new Date()
                .getFullYear()}/${new Date()
                .getMonth()}/${new Date()
                .getDate()}/${ultimaActuacion.idRegActuacion}.json`, JSON.stringify(ultimaActuacion));
        }
    }
    catch (error) {
        console.log(`prisma updater actuaciones error : ${error}`);
    }
}
async function main() {
    const ActsMap = [];
    const idProcesos = await getIdProcesos();
    for await (const actuacionesJson of AsyncGenerateActuaciones(idProcesos)) {
        ActsMap.push(actuacionesJson);
    }
    fs.writeFile('actuacionesOutput.json', JSON.stringify(ActsMap, null, 2));
    return ActsMap;
}
main();
//# sourceMappingURL=actuaciones.js.map