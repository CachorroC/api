import { Despachos } from '../data/despachos.js';
import { Juzgado } from '../types/carpetas.js';
import { fetchResponseProceso, intProceso } from '../types/procesos.js';

/**
 * Helper to normalize strings for comparison.
 * Standardizes text by converting to lowercase, stripping diacritics/accents,
 * and trimming external whitespace.
 * * @param text - The raw string to normalize.
 * @returns The standardized, clean string safe for strict equivalence checks.
 */
const normalizeText = (
  text: string 
): string => {
  return text
    .toLowerCase()
    .normalize(
      'NFD' 
    )
    .replace(
      /\p{Diacritic}/gu, '' 
    )
    .trim();
};

/**
 * Parses and maps shorthand court types or abbreviations to their fully qualified legal names.
 * Applies a series of regex tests to identify combinations of jurisdictions
 * (e.g., identifying if a court is both "Municipal" and "Ejecución").
 *
 * @param tipo - The raw or abbreviated court type (e.g., 'EJE', 'PCTO', 'CM').
 * @returns The fully extrapolated and formatted court type string.
 */
export function extrapolateTipoToCorrectType(
  tipo: string 
): string {
  let output = tipo.toUpperCase()
    .trim();

  // Flag indicators based on common legal abbreviations in the Colombian system
  const hasEjecucion = /EJE|E\b|EJ\b|EJEC/im.test(
    tipo 
  );
  const isPromiscuoCircuito = /PCTO/im.test(
    tipo 
  );
  const isPequenasCausas = /PCCM|PCYCM|PEQUE|CAUSAS/im.test(
    tipo 
  );
  const isPromiscuoMunicipal = /PM\b|PROM|P M/im.test(
    tipo 
  );
  const isCivilMunicipal = /(CM\b|MUNICIPAL|C M)/im.test(
    tipo 
  );
  const isCivilCircuito = /(CCTO|CIRCUITO|CTO\b|C CTO|CC\b)/im.test(
    tipo 
  );
  const isAdministrativo = /ADMIN|ADMON|SECCI(Ó|O)N/im.test(
    tipo 
  );

  // Added basic support for Familia/Laboral
  const isFamilia = /FAMILIA/im.test(
    tipo 
  );
  const isLaboral = /LABORAL/im.test(
    tipo 
  );

  // Evaluate execution courts first, as they represent a specific subclass
  if ( hasEjecucion ) {
    if ( isPequenasCausas ) {
      output = 'DE PEQUEÑAS CAUSAS Y COMPETENCIA MÚLTIPLE';
    } else if ( isPromiscuoMunicipal ) {
      output = 'PROMISCUO MUNICIPAL';
    } else if ( isCivilCircuito ) {
      output = 'CIVIL DEL CIRCUITO DE EJECUCIÓN DE SENTENCIAS';
    } else if ( isCivilMunicipal ) {
      output = 'CIVIL MUNICIPAL DE EJECUCIÓN DE SENTENCIAS';
    } else if ( isAdministrativo ) {
      output = 'ADMINISTRATIVO DE EJECUCIÓN DE SENTENCIAS';
    }
  } else {
    // Standard non-execution courts
    if ( isPequenasCausas ) {
      output = 'DE PEQUEÑAS CAUSAS Y COMPETENCIA MÚLTIPLE';
    } else if ( isPromiscuoMunicipal ) {
      output = 'PROMISCUO MUNICIPAL';
    } else if ( isPromiscuoCircuito ) {
      output = 'PROMISCUO DEL CIRCUITO';
    } else if ( isFamilia ) {
      output = 'DE FAMILIA';
    } else if ( isLaboral ) {
      output = 'LABORAL DEL CIRCUITO';
    } else if ( isCivilCircuito ) {
      output = 'CIVIL DEL CIRCUITO';
    } else if ( isCivilMunicipal ) {
      output = 'CIVIL MUNICIPAL';
    } else if ( isAdministrativo ) {
      output = 'ADMINISTRATIVO DE LA SECCIÓN CUARTA';
    }
  }

  return output;
}

/**
 * Represents a legal court (Juzgado) entity.
 * Provides functionalities to parse, instantiate, and fetch canonical data
 * (like the official rama judicial URL) by matching partial or raw court data
 * against the known `Despachos` database.
 * * @implements {Juzgado}
 */
class JuzgadoClass implements Juzgado {
  id    : string;
  tipo  : string;
  ciudad: string;
  url   : string;

  /**
   * Initializes a new instance of JuzgadoClass.
   * Attempting to match the provided data against the known `Despachos` database
   * to retrieve the canonical URL and exact naming structure.
   *
   * @param params - Initialization payload containing court details.
   * @param params.id - The court identifier/number (e.g., '01', '001').
   * @param params.tipo - The type of court jurisdiction.
   * @param params.ciudad - The city where the court is located.
   */
  constructor(
    {
      id,
      tipo,
      ciudad,
    }: {
      id    : string;
      tipo  : string;
      ciudad: string;
    } 
  ) {
    // Retain the exact ID string (2 or 3 digits) passed in
    this.id = id;
    this.tipo = tipo.toUpperCase()
      .trim();
    this.ciudad = ciudad.toUpperCase()
      .trim();

    // Create normalized variations so we match the Despachos DB
    // regardless of padding inconsistencies (e.g., '1', '01', or '001')
    const unpaddedId = id.replace(
      /^0+/, '' 
    ) || '0';
    const paddedId3 = unpaddedId.padStart(
      3, '0' 
    );
    const paddedId2 = unpaddedId.padStart(
      2, '0' 
    );

    const possibleNames = [
      normalizeText(
        `JUZGADO ${ this.id } ${ this.tipo } DE ${ this.ciudad }` 
      ),
      normalizeText(
        `JUZGADO ${ paddedId3 } ${ this.tipo } DE ${ this.ciudad }` 
      ),
      normalizeText(
        `JUZGADO ${ paddedId2 } ${ this.tipo } DE ${ this.ciudad }` 
      ),
    ];

    // Attempt to locate a matching canonical entry in the database
    const matchedDespacho = Despachos.find(
      (
        despacho 
      ) => {
        const normalizedIteratedName = normalizeText(
          despacho.nombre 
        );

        return possibleNames.includes(
          normalizedIteratedName 
        );
      } 
    );

    if ( matchedDespacho ) {
      this.url = `https://www.ramajudicial.gov.co${ matchedDespacho.url }`;

      // Update properties to the pristine, canonical DB format using the smart extractor
      const canonicalParts = JuzgadoClass.extractPartsFromLongName(
        matchedDespacho.nombre,
      );

      if ( canonicalParts.id ) {
        this.id = canonicalParts.id;
        this.tipo = canonicalParts.tipo;
        this.ciudad = canonicalParts.ciudad;
      }
    } else {
      this.url = '';
    }
  }

  /**
   * Reliably isolates and extracts the ID, type, and city from a long, unformatted court string.
   * Employs special fallback handling to prevent splitting errors on known
   * compound city names that include "DE" or "-" (e.g., "SANTA ROSA DE VITERBO").
   *
   * @private
   * @static
   * @param rawName - The full, raw name of the court/despacho.
   * @returns An object containing the safely extracted `id`, `tipo`, and `ciudad`.
   */
  private static extractPartsFromLongName(
    rawName: string 
  ) {
    let id = '';
    let tipo = '';
    let ciudad = '';

    // 1. Isolate the ID digits from the string
    const idMatch = rawName.match(
      /(\d+)/ 
    );

    if ( idMatch ) {
      [
        , id
      ] = idMatch;
    }

    // 2. Strip noise terms (JUZGADO, DESPACHO, asterisks, and the ID) to isolate Tipo and Ciudad
    const cleanedName = rawName
      .replace(
        /JUZGADO|DESPACHO/gi, '' 
      )
      .replace(
        id, '' 
      )
      .replace(
        /\*/g, '' 
      )
      .trim();

    // 3. Prevent splitting errors on cities that naturally contain "DE" or "-"
    const compoundCities = [
      'SANTA ROSA DE VITERBO',
      'SAN JOSE DEL GUAVIARE',
      'SAN JUAN DEL CESAR',
      'VALLE DEL CAUCA',
      'SAN VICENTE DEL CAGUAN',
      'SAN ANDRES DE CUERQUIA',
      'SAN ANDRES DE SOTAVENTO',
      'SAN BERNARDO DEL VIENTO',
      'SAN CARLOS DE GUAROA',
      'SAN JUAN DE RIOSECO',
      'SAN MARTIN DE LOBA',
      'SAN MIGUEL DE SEMA',
      'SANTIAGO DE TOLU',
      'SABANAS DE SAN ANGEL',
      'VALLE DE GUAMUEZ',
      'VALLE DE SAN JOSE',
      'VALLE DE SAN JUAN',
      'AGUA DE DIOS',
      'BELEN DE LOS ANDAQUIES',
      'BELEN DE UMBRIA',
      'BELEN DE BAJIRA',
      'CARMEN DE BOLIVAR',
      'CARMEN DE CARUPA',
      'CARMEN DEL DARIEN',
      'CARTAGENA DEL CHAIRA',
      'CERRO DE SAN ANTONIO',
      'EL CARMEN DE VIBORAL',
      'EL CARMEN DE CHUCURI',
      'EL TABLON DE GOMEZ',
      'LA JAGUA DE IBIRICO',
      'LA JAGUA DEL PILAR',
      'LITORAL DE SAN JUAN',
      'LOPEZ DE MICAY',
      'PALMAR DE VARELA',
      'PALMAS DEL SOCORRO',
      'PAZ DE ARIPORO',
      'PAZ DE RIO',
      'RIO DE ORO',
      'SABANA DE TORRES',
      'SAN JOSE DE PARE',
      'SAN JOSE DE URE',
      'SANTA BARBARA DE PINTO',
      'SANTA ROSA DE LIMA',
      'SAN ANDRES',
      'BOGOTA',
      'MEDELLIN',
    ];

    const normalizedName = normalizeText(
      cleanedName 
    )
      .toUpperCase();

    // Check if the string ends with any of our known compound cities
    const foundCity = compoundCities.find(
      (
        c 
      ) => {
        return normalizedName.endsWith(
          c 
        );
      } 
    );

    if ( foundCity ) {
      // If a known compound city is at the end, slice it off securely
      const matchIndex = normalizedName.lastIndexOf(
        foundCity 
      );
      ciudad = cleanedName.slice(
        matchIndex 
      )
        .trim();
      tipo = cleanedName
        .slice(
          0, matchIndex 
        )
        .replace(
          /\s+(DE|-)\s*$/i, '' 
        )
        .trim();
    } else {
      // Otherwise, assume a standard format and split at the absolute LAST occurrence of " DE " or " - "
      const lastSeparatorMatch = cleanedName.match(
        /\s+(DE|-)\s+(?!.*\s+(DE|-)\s+)(.*)$/i,
      );

      if ( lastSeparatorMatch ) {
        ciudad = lastSeparatorMatch[ 3 ].trim();
        tipo = cleanedName.substring(
          0, lastSeparatorMatch.index 
        )
          .trim();
      } else {
        // Fallback for completely unbroken strings without "DE" or "-"
        tipo = cleanedName;
      }
    }

    // Final scrub of any trailing/leading hyphens left over on the tipo
    tipo = tipo.replace(
      /^-\s*/, '' 
    )
      .trim();

    return {
      id,
      tipo,
      ciudad,
    };
  }

  /**
   * Factory method: Creates a `JuzgadoClass` instance from a short code syntax
   * (e.g., '01CM') and an explicit city.
   *
   * @static
   * @param params - An object containing the city and the raw shortcode string.
   * @param params.ciudad - The explicit city name.
   * @param params.juzgadoRaw - The raw abbreviation containing ID and type (e.g. '01EJE').
   * @returns A new, extrapolated instance of `JuzgadoClass`.
   */
  static fromShortName(
    {
      ciudad,
      juzgadoRaw,
    }: {
      ciudad    : string;
      juzgadoRaw: string;
    } 
  ) {
    let rawId = '';
    let rawTipo = juzgadoRaw;

    // Grab the first block of digits natively, skipping prefixes like slashes
    const match = juzgadoRaw.match(
      /(\d+)/ 
    );

    if ( match ) {
      [
        , rawId
      ] = match;
      // Eliminate the digits from the string to evaluate the raw code properly
      rawTipo = juzgadoRaw
        .replace(
          /.*?(\d+)\s*/, '' 
        )
        .replace(
          /^[/\\-\s]+/, '' 
        )
        .trim();
    }

    const newTipo = extrapolateTipoToCorrectType(
      rawTipo 
    );

    return new JuzgadoClass(
      {
        id  : rawId,
        tipo: newTipo,
        ciudad,
      } 
    );
  }

  /**
   * Factory method: Creates a `JuzgadoClass` instance from a single, long-form court string.
   *
   * @static
   * @param despacho - The full string representation of the court (e.g., "JUZGADO 01 CIVIL MUNICIPAL DE BOGOTA").
   * @returns A new instance of `JuzgadoClass`.
   */
  static fromLongName(
    despacho: string 
  ) {
    const parts = this.extractPartsFromLongName(
      despacho 
    );

    if ( !parts.id && !parts.ciudad ) {
      // Fallback logic if the string is entirely malformed and un-parsable
      return new JuzgadoClass(
        {
          id    : '',
          tipo  : despacho,
          ciudad: '',
        } 
      );
    }

    return new JuzgadoClass(
      {
        id    : parts.id,
        tipo  : parts.tipo,
        ciudad: parts.ciudad,
      } 
    );
  }

  /**
   * Factory method: Creates a `JuzgadoClass` instance mapped directly from a Proceso response object.
   *
   * @static
   * @param proceso - The legal process data payload, containing a despacho string and a departamento/ciudad.
   * @returns A new instance of `JuzgadoClass`.
   */
  static fromProceso(
    proceso: fetchResponseProceso | intProceso 
  ) {
    const parts = this.extractPartsFromLongName(
      proceso.despacho 
    );

    // If no ID can be found, default to putting the raw string into 'tipo'
    if ( !parts.id ) {
      return new JuzgadoClass(
        {
          id    : '',
          tipo  : proceso.despacho,
          ciudad: proceso.departamento,
        } 
      );
    }

    return new JuzgadoClass(
      {
        id    : parts.id,
        tipo  : parts.tipo,
        ciudad: parts.ciudad || proceso.departamento,
      } 
    );
  }
}

export default JuzgadoClass;
