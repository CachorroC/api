"use strict";
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rawDb = Convert.toRawDb(json);
Object.defineProperty(exports, "__esModule", { value: true });
exports.Convert = void 0;
// Converts JSON strings to/from your types
class Convert {
    static toRawDb(json) {
        return JSON.parse(json);
    }
    static rawDbToJson(value) {
        return JSON.stringify(value);
    }
}
exports.Convert = Convert;
//# sourceMappingURL=raw-db.js.map