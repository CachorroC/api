import { Despachos } from "../data/despachos";
import { Juzgado } from "../types/carpetas";
import { intProceso } from "../types/procesos";

// Helper to normalize strings for comparison (removes accents, trims, lowercase)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
};

export function extrapolateTipoToCorrectType(tipo: string): string {
  let output = tipo;

  // Removed 'g' flag, it is unnecessary for .test() and can cause state issues
  const hasEjecucion = /EJE|E|EJ/im.test(tipo);
  const isPromiscuoCircuito = /PCTO/im.test(tipo);
  const isPequenasCausas = /PCCM|PCYCM|Peque|causas/im.test(tipo);
  const isPromiscuoMunicipal = /PM|PROM|P M/im.test(tipo);
  const isCivilMunicipal = /(CM|municipal|C M)/im.test(tipo);
  const isCivilCircuito = /(CCTO|CIRCUITO|CTO|C CTO|CC)/im.test(tipo);

  // Fixed corrupted characters (� -> ?, � -> ?, � -> ?)
  if (hasEjecucion) {
    if (isPequenasCausas) {
      output = "DE PEQUE?AS CAUSAS Y COMPETENCIA M?LTIPLE";
    } else if (isPromiscuoMunicipal) {
      output = "PROMISCUO MUNICIPAL";
    } else if (isCivilCircuito) {
      output = "CIVIL DEL CIRCUITO DE EJECUCI?N DE SENTENCIAS";
    } else if (isCivilMunicipal) {
      output = "CIVIL MUNICIPAL DE EJECUCI?N DE SENTENCIAS";
    }
  } else {
    if (isPequenasCausas) {
      output = "DE PEQUE?AS CAUSAS Y COMPETENCIA M?LTIPLE";
    } else if (isPromiscuoMunicipal) {
      output = "PROMISCUO MUNICIPAL";
    } else if (isPromiscuoCircuito) {
      output = "PROMISCUO DEL CIRCUITO";
    } else if (isCivilCircuito) {
      output = "CIVIL DEL CIRCUITO";
    } else if (isCivilMunicipal) {
      output = "CIVIL MUNICIPAL";
    }
  }

  return output;
}

class JuzgadoClass implements Juzgado {
  id: string;
  tipo: string;
  ciudad: string;
  url: string;

  constructor({
    id,
    tipo,
    ciudad,
  }: {
    id: string;
    tipo: string;
    ciudad: string;
  }) {
    this.id = id.padStart(3, "000");
    this.tipo = tipo.toUpperCase().trim();
    this.ciudad = ciudad.toUpperCase().trim();

    // Construct the standard name for comparison
    const constructorString = `JUZGADO ${this.id} ${this.tipo} DE ${this.ciudad}`;
    const normalizedName = normalizeText(constructorString);

    // Use .find() instead of .filter() for better performance (O(n) -> Stops at first match)
    const matchedDespacho = Despachos.find((despacho) => {
      const normalizedIteratedName = normalizeText(despacho.nombre);
      return normalizedIteratedName === normalizedName;
    });

    if (matchedDespacho) {
      this.url = `https://www.ramajudicial.gov.co${matchedDespacho.url}`;

      // regex updated to accept Spanish characters (?, ?, etc) instead of corrupted unicode
      const matchedDespachoParts = matchedDespacho.nombre.match(
        /JUZGADO (\d+) ([A-Z??????\s]+) DE ([.A-Z??????\s-]+)/im,
      );

      if (matchedDespachoParts) {
        const [, newId, newTipo, newCiudad] = matchedDespachoParts;
        this.id = newId;
        this.tipo = newTipo.trim();
        this.ciudad = newCiudad.trim();
      }
    } else {
      this.url = "";
    }
  }

  static fromShortName({
    ciudad,
    juzgadoRaw,
  }: {
    ciudad: string;
    juzgadoRaw: string;
  }) {
    // Regex updated to capture standard alphanumeric + Spanish chars
    const matchedRegexNumberAndLetters = juzgadoRaw.match(
      /(\d+)(\s?)([A-Z??????\s-]+)/im,
    );

    if (!matchedRegexNumberAndLetters) {
      return new JuzgadoClass({
        id: "",
        tipo: juzgadoRaw,
        ciudad,
      });
    }

    const [, rawId, , rawTipo] = matchedRegexNumberAndLetters;

    const newId = rawId.padStart(3, "000");
    const newTipo = extrapolateTipoToCorrectType(rawTipo);

    return new JuzgadoClass({
      id: newId,
      tipo: newTipo,
      ciudad,
    });
  }

  static fromLongName(despacho: string) {
    const matchedDespachoParts = despacho.match(
      /JUZGADO (\d+) ([A-Z??????\s]+) DE ([.A-Z??????\s-]+)/im,
    );

    if (!matchedDespachoParts) {
      return new JuzgadoClass({
        id: "",
        tipo: despacho,
        ciudad: "",
      });
    }

    const [longName, id, tipo, ciudad] = matchedDespachoParts;

    return new JuzgadoClass({
      id,
      tipo,
      ciudad,
    });
  }

  static fromProceso(proceso: intProceso) {
    const matchedDespachoParts = proceso.despacho.match(
      /JUZGADO (\d+) ([A-Z??????\s]+) DE ([.A-Z??????\s-]+)/im,
    );

    if (!matchedDespachoParts) {
      return new JuzgadoClass({
        id: "",
        tipo: proceso.despacho,
        ciudad: proceso.departamento,
      });
    }

    const [longName, id, tipo, ciudad] = matchedDespachoParts;

    return new JuzgadoClass({
      id,
      tipo,
      ciudad,
    });
  }
}

export default JuzgadoClass;
