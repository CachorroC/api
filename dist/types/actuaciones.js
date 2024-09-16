'use strict';
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const consultaActuacion = Convert.toConsultaActuacion(json);
Object.defineProperty(
  exports, '__esModule', {
    value: true,
  } 
);
exports.actuacionConvert = void 0;

// Converts JSON strings to/from your types
class actuacionConvert {
  static actuacioneToJson(
    value 
  ) {
    return JSON.stringify(
      value 
    );
  }
  static consultaActuacionToJson(
    value 
  ) {
    return JSON.stringify(
      value 
    );
  }
  static dataToJson(
    value 
  ) {
    return JSON.stringify(
      value 
    );
  }
  static paginacionToJson(
    value 
  ) {
    return JSON.stringify(
      value 
    );
  }
  static toActuacione(
    json 
  ) {
    return JSON.parse(
      json 
    );
  }
  static toConsultaActuacion(
    json 
  ) {
    return JSON.parse(
      json 
    );
  }
  static toData(
    json 
  ) {
    return JSON.parse(
      json 
    );
  }
  static toPaginacion(
    json 
  ) {
    return JSON.parse(
      json 
    );
  }
}
exports.actuacionConvert = actuacionConvert;
//# sourceMappingURL=actuaciones.js.map
