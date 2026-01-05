"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tipoProcesoBuilder = tipoProcesoBuilder;
function tipoProcesoBuilder(tipoProceso) {
    if (!tipoProceso) {
        return 'SINGULAR';
    }
    const tipoProcesoMatchAcumulado = tipoProceso.match(/[Aa][Cc][Uu][Mm]...../g);
    const isAcumulado = tipoProcesoMatchAcumulado !== null;
    const tipoProcesoMatchHipotecario = tipoProceso.match(/[Hh][Ii][Pp][Oo][Tt][Ee]..../g);
    const isHipotecario = tipoProcesoMatchHipotecario !== null;
    const tipoProcesoMatchPrendario = tipoProceso.match(/[Pp][Rr][Ee][Nn]...../g);
    const isPrendario = tipoProcesoMatchPrendario !== null;
    const tipoProcesoMatchSingular = tipoProceso.match(/[Ss][Ii][Nn][Gg]...../g);
    const isSingular = tipoProcesoMatchSingular !== null;
    if (isAcumulado) {
        return 'ACUMULADO';
    }
    else if (isHipotecario) {
        return 'HIPOTECARIO';
    }
    else if (isPrendario) {
        return 'PRENDARIO';
    }
    else if (isSingular) {
        return 'SINGULAR';
    }
    return 'SINGULAR';
}
//# sourceMappingURL=tipoProceso.js.map