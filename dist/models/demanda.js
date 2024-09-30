"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassDemanda = void 0;
const library_1 = require("@prisma/client/runtime/library");
const capital_builder_1 = require("../utils/capital-builder");
const date_validator_1 = require("../utils/date-validator");
const notificacion_1 = require("./notificacion");
const tipoProceso_1 = require("./tipoProceso");
class ClassDemanda {
    constructor(rawCarpeta) {
        const { VALOR_CAPITAL_ADEUDADO: capitalAdeudado, JUZGADO_EJECUCION, JUZGADO_ORIGEN, FECHA_ENTREGA_GARANTIAS_ABOGADO: entregaGarantiasAbogado, ETAPA_PROCESAL: etapaProcesal, DEPARTAMENTO: departamento, NUMERO, FECHA_PRESENTACION_DEMANDA: fechaPresentacion, TIPO_PROCESO: tipoProceso, FECHA_MANDAMIENTO_PAGO: mandamientoPago, JUZGADO_CIUDAD: municipio, RADICADO: radicado, EXPEDIENTE: llaveProceso, FECHA_VENCIMIENTO_PAGARE: vencimientoPagare, FECHA_ORDENA_MEDIDAS_CAUTELARES: fechaOrdenaMedidas, MEDIDA_SOLICITADA: medidaSolicitada, OBLIGACION_1: A, OBLIGACION_2: B, VALOR_LIQUIDACION_DEL_CREDITO, VALOR_AVALUO, BIENES, BIENES_SECUESTRADOS, } = rawCarpeta;
        const [newFechaOrdenaMedida] = (0, date_validator_1.datesExtractor)(fechaOrdenaMedidas);
        this.id = Number(NUMERO);
        this.bienes = BIENES
            ? String(BIENES)
            : BIENES_SECUESTRADOS
                ? String(BIENES_SECUESTRADOS)
                : null;
        this.medidasCautelares = {
            id: Number(NUMERO),
            fechaOrdenaMedida: newFechaOrdenaMedida ?? null,
            medidaSolicitada: medidaSolicitada ? String(medidaSolicitada) : null,
        };
        const obligacionesSet = new Set();
        if (A) {
            obligacionesSet.add(String(A));
        }
        if (B) {
            obligacionesSet.add(String(B));
        }
        this.fechaPresentacion = (0, date_validator_1.datesExtractor)(fechaPresentacion) ?? null;
        this.notificacion = new notificacion_1.ClassNotificacion(rawCarpeta);
        this.mandamientoPago = (0, date_validator_1.datesExtractor)(mandamientoPago) ?? null;
        const NewEntregaDeGarantias = (0, date_validator_1.datesExtractor)(entregaGarantiasAbogado);
        if (NewEntregaDeGarantias.length === 0) {
            this.entregaGarantiasAbogado = null;
        }
        else {
            const [firstEntrega] = NewEntregaDeGarantias;
            this.entregaGarantiasAbogado = firstEntrega;
        }
        this.capitalAdeudado = new library_1.Decimal((0, capital_builder_1.capitalBuilder)(capitalAdeudado));
        this.tipoProceso = (0, tipoProceso_1.tipoProcesoBuilder)(tipoProceso);
        this.etapaProcesal = etapaProcesal ? `${etapaProcesal}` : null;
        this.municipio = municipio ? String(municipio) : null;
        this.obligacion = Array.from(obligacionesSet);
        this.radicado = radicado ? `${radicado}` : null;
        this.vencimientoPagare = (0, date_validator_1.datesExtractor)(vencimientoPagare);
        this.departamento = departamento ? departamento : null;
        this.despacho = JUZGADO_EJECUCION
            ? JUZGADO_EJECUCION
            : JUZGADO_ORIGEN
                ? JUZGADO_ORIGEN
                : null;
        this.llaveProceso = llaveProceso ? String(llaveProceso) : null;
        this.avaluo = new library_1.Decimal((0, capital_builder_1.capitalBuilder)(VALOR_AVALUO));
        this.liquidacion = new library_1.Decimal((0, capital_builder_1.capitalBuilder)(VALOR_LIQUIDACION_DEL_CREDITO));
    }
    liquidacion;
    avaluo;
    capitalAdeudado;
    carpetaNumero;
    departamento;
    despacho;
    bienes;
    entregaGarantiasAbogado;
    etapaProcesal;
    fechaPresentacion;
    id;
    llaveProceso;
    mandamientoPago;
    municipio;
    notificacion;
    obligacion;
    radicado;
    tipoProceso;
    vencimientoPagare;
    medidasCautelares;
    static prismaDemanda(demanda) {
        const newMedidas = {
            id: demanda.id,
            fechaOrdenaMedida: demanda.medidasCautelares.fechaOrdenaMedida,
            medidaSolicitada: demanda.medidasCautelares.medidaSolicitada,
        };
        const newNotificacion = notificacion_1.ClassNotificacion.prismaNotificacion(demanda.notificacion);
        const newDemanda = {
            id: demanda.id,
            tipoProceso: demanda.tipoProceso,
            avaluo: demanda.avaluo,
            capitalAdeudado: demanda.capitalAdeudado,
            departamento: demanda.departamento,
            despacho: demanda.despacho,
            entregaGarantiasAbogado: demanda.entregaGarantiasAbogado,
            fechaPresentacion: demanda.fechaPresentacion,
            vencimientoPagare: demanda.vencimientoPagare,
            etapaProcesal: demanda.etapaProcesal,
            liquidacion: demanda.liquidacion,
            llaveProceso: demanda.llaveProceso,
            mandamientoPago: demanda.mandamientoPago,
            municipio: demanda.municipio,
            obligacion: demanda.obligacion,
            radicado: demanda.radicado,
            medidasCautelares: {
                connectOrCreate: {
                    where: {
                        id: demanda.id,
                    },
                    create: newMedidas,
                },
            },
            notificacion: {
                connectOrCreate: {
                    where: {
                        id: demanda.id,
                    },
                    create: newNotificacion,
                },
            },
        };
        return newDemanda;
    }
}
exports.ClassDemanda = ClassDemanda;
//# sourceMappingURL=demanda.js.map