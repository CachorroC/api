/**
 * @module models/tipoProceso
 * @description Process Type Classification Builder
 * 
 * Utility for identifying and classifying legal process types by regex pattern matching
 * against Spanish process type names. Used during demanda model construction to tag
 * processes with their legal classification (ACUMULADO, HIPOTECARIO, PRENDARIO, SINGULAR).
 * 
 * CLASSIFICATION STRATEGY:
 * 1. Match against Spanish keywords (case-insensitive)
 * 2. ACUMULADO: "ACUM..." (Accumulated/grouped processes)
 * 3. HIPOTECARIO: "HIPOT..." (Mortgage-related)
 * 4. PRENDARIO: "PREN..." (Pledge/collateral-based)
 * 5. SINGULAR: Default/single case
 * 
 * REGEX PATTERNS:
 * Each pattern uses case-insensitive flag and ellipsis wildcard to match partial words:
 * /[Aa][Cc][Uu][Mm]...../g - Matches "ACUMULADO" exactly with 6 char variations
 * 
 * DEFAULT: Returns 'SINGULAR' if no match found or input is null/undefined
 */

/**
 * @function tipoProcesoBuilder
 * @description Classifies legal process type by matching Spanish keywords using regex.
 * Returns one of four Colombian legal process classifications.
 * 
 * @param {string | undefined} tipoProceso - Raw process type string from API/database
 *                                           (e.g., "ACUMULADO", "HIPOTECARIO")
 * @returns {('ACUMULADO' | 'HIPOTECARIO' | 'PRENDARIO' | 'SINGULAR')} Process type
 *         classification. Defaults to 'SINGULAR' if no match or null input.
 * 
 * @pattern Priority Order:
 * 1. ACUMULADO: Accumulated processes (multiple related cases grouped)
 * 2. HIPOTECARIO: Mortgage processes
 * 3. PRENDARIO: Collateral/pledge processes
 * 4. SINGULAR: Single case (catch-all default)
 * 
 * @example
 * tipoProcesoBuilder('ACUMULADO') // Returns: 'ACUMULADO'
 * tipoProcesoBuilder('HIPOTECARIO') // Returns: 'HIPOTECARIO'
 * tipoProcesoBuilder('UNKNOWN') // Returns: 'SINGULAR'
 * tipoProcesoBuilder(undefined) // Returns: 'SINGULAR'
 * tipoProcesoBuilder('') // Returns: 'SINGULAR'
 * 
 * @note Case-insensitive matching (Aa, Cc, Uu, Mm patterns)
 * @note Regex patterns designed to match partial Spanish spellings with flexibility
 */
export function tipoProcesoBuilder(
  tipoProceso?: string 
) {
  if ( !tipoProceso ) {
    return 'SINGULAR';
  }

  const tipoProcesoMatchAcumulado = tipoProceso.match(
    /[Aa][Cc][Uu][Mm]...../g 
  );

  const isAcumulado = tipoProcesoMatchAcumulado !== null;

  const tipoProcesoMatchHipotecario = tipoProceso.match(
    /[Hh][Ii][Pp][Oo][Tt][Ee]..../g,
  );

  const isHipotecario = tipoProcesoMatchHipotecario !== null;

  const tipoProcesoMatchPrendario = tipoProceso.match(
    /[Pp][Rr][Ee][Nn]...../g 
  );

  const isPrendario = tipoProcesoMatchPrendario !== null;

  const tipoProcesoMatchSingular = tipoProceso.match(
    /[Ss][Ii][Nn][Gg]...../g 
  );

  const isSingular = tipoProcesoMatchSingular !== null;

  if ( isAcumulado ) {
    return 'ACUMULADO';
  } else if ( isHipotecario ) {
    return 'HIPOTECARIO';
  } else if ( isPrendario ) {
    return 'PRENDARIO';
  } else if ( isSingular ) {
    return 'SINGULAR';
  }

  return 'SINGULAR';
}
