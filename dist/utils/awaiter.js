"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
const sleep = (ms) => {
    return new Promise((resolve) => {
        console.log(`sleeping ${ms} ${new Date().toString()}`);
        return setTimeout(resolve, ms);
    });
};
exports.sleep = sleep;
//# sourceMappingURL=awaiter.js.map