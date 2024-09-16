"use strict";
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const prismaCarpeta = Convert.toPrismaCarpeta(json);
Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.Convert = void 0;

// Converts JSON strings to/from your types
class Convert {
  static toPrismaCarpeta(json) {
    return JSON.parse(json);
  }
  static prismaCarpetaToJson(value) {
    return JSON.stringify(value);
  }
  static toPrismaDemanda(json) {
    return JSON.parse(json);
  }
  static PrismademandaToJson(value) {
    return JSON.stringify(value);
  }
  static toPrismaDeudor(json) {
    return JSON.parse(json);
  }
  static deudorToJson(value) {
    return JSON.stringify(value);
  }
  static toPrismaJuzgado(json) {
    return JSON.parse(json);
  }
  static juzgadoToJson(value) {
    return JSON.stringify(value);
  }
  static toPrismaNota(json) {
    return JSON.parse(json);
  }
  static notaToJson(value) {
    return JSON.stringify(value);
  }
  static toProceso(json) {
    return JSON.parse(json);
  }
  static procesoToJson(value) {
    return JSON.stringify(value);
  }
  static toPrismaTarea(json) {
    return JSON.parse(json);
  }
  static tareaToJson(value) {
    return JSON.stringify(value);
  }
  static toPrismaSubPrismaTarea(json) {
    return JSON.parse(json);
  }
  static subPrismaTareaToJson(value) {
    return JSON.stringify(value);
  }
  static toUltimaActuacion(json) {
    return JSON.parse(json);
  }
  static ultimaActuacionToJson(value) {
    return JSON.stringify(value);
  }
}
exports.Convert = Convert;
//# sourceMappingURL=safe-parse-carpeta.js.map
