"use strict";
// To parse this data:
//
//   import { Convert, RawDb } from "./file";
//
//   const welcome = Convert.toRawDb(json);
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rawDb = Convert.toRawDb(json);
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rawDb = Convert.toRawDb(json);
Object.defineProperty(
  exports, "__esModule", { value: true }
);
exports.Convert = exports.ConvertRawDb = void 0;
// Converts JSON strings to/from your types
class ConvertRawDb {
  static toRawDb(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static rawDbToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
}
exports.ConvertRawDb = ConvertRawDb;
// Converts JSON strings to/from your types
class Convert {
  static toRawDb(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static rawDbToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
  static toRawWorkSheets(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static welcomeToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
  static toBancolombia(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static bancolombiaToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
  static toInsolvencia(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static insolvenciaToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
  static toLiosJuridico(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static liosJuridicoToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
  static toReintegra(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static reintegraToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
  static toTerminado(
    json
  ) {
    return JSON.parse(
      json
    );
  }
  static terminadoToJson(
    value
  ) {
    return JSON.stringify(
      value
    );
  }
}
exports.Convert = Convert;
//# sourceMappingURL=raw-db.js.map