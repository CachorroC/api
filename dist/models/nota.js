"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.NotasBuilder = void 0;

const date_validator_1 = require("../utils/date-validator");

class NotasBuilder {
  createdAt;
  pathname;
  dueDate;
  text;
  content = [];
  id;
  constructor(incomingNote, carpetaNumero, index) {
    this.content = incomingNote.split("//");

    const dateExtract = (0, date_validator_1.datesExtractor)(incomingNote);

    if (dateExtract.length === 0) {
      this.dueDate = null;
    }

    const [firstDate] = dateExtract;
    this.dueDate = firstDate;
    this.text = incomingNote;
    this.createdAt = new Date();
    this.pathname = carpetaNumero ? `/Carpeta/${carpetaNumero}` : null;
    this.id = `${carpetaNumero ? carpetaNumero : Date.now()}-${
      index ? index : Math.random()
    }`;
  }
}
exports.NotasBuilder = NotasBuilder;
//# sourceMappingURL=nota.js.map
