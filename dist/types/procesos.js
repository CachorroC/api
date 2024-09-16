"use strict";
// To parse this data:
//
//   import { Convert, ConsultaNumeroRadicacion } from "./file";
//
//   const consultaNumeroRadicacion = Convert.toConsultaNumeroRadicacion(json);
Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.Convert = void 0;

// Converts JSON strings to/from your types
class Convert {
  static toConsultaNumeroRadicacion(json) {
    return JSON.parse(json);
  }
  static consultaNumeroRadicacionToJson(value) {
    return JSON.stringify(value);
  }
  static toPaginacion(json) {
    return JSON.parse(json);
  }
  static paginacionToJson(value) {
    return JSON.stringify(value);
  }
  static toParametros(json) {
    return JSON.parse(json);
  }
  static parametrosToJson(value) {
    return JSON.stringify(value);
  }
  static toProceso(json) {
    return JSON.parse(json);
  }
  static procesoToJson(value) {
    return JSON.stringify(value);
  }
}
exports.Convert = Convert;
//# sourceMappingURL=procesos.js.map
