import { sanitizeText } from './textSanitizer.js';

/**
 * Calculates the Levenshtein distance between two strings.
 *
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} The distance between the strings.
 */
function levenshteinDistance(
  a: string, b: string
): number {
  const matrix: number[][] = [];

  for ( let i = 0; i <= b.length; i++ ) {
    matrix[ i ] = [
      i 
    ];
  }

  for ( let j = 0; j <= a.length; j++ ) {
    matrix[ 0 ][ j ] = j;
  }

  for ( let i = 1; i <= b.length; i++ ) {
    for ( let j = 1; j <= a.length; j++ ) {
      if ( b.charAt(
        i - 1
      ) === a.charAt(
        j - 1
      ) ) {
        matrix[ i ][ j ] = matrix[ i - 1 ][ j - 1 ];
      } else {
        matrix[ i ][ j ] = Math.min(
          matrix[ i - 1 ][ j - 1 ] + 1,
          Math.min(
            matrix[ i ][ j - 1 ] + 1, matrix[ i - 1 ][ j ] + 1
          )
        );
      }
    }
  }

  return matrix[ b.length ][ a.length ];
}

/**
 * Calculates the similarity between two strings using a token-based approach and Levenshtein distance.
 * Returns a value between 0 and 1, where 1 is identical.
 *
 * @param {string} str1 - First string.
 * @param {string} str2 - Second string.
 * @returns {number} Similarity score (0 to 1).
 */
export function getStringSimilarity(
  str1: string, str2: string
): number {
  const s1 = sanitizeText(
    str1
  ).toUpperCase();
  const s2 = sanitizeText(
    str2
  ).toUpperCase();

  if ( s1 === s2 ) {
    return 1;
  }

  if ( !s1 || !s2 ) {
    return 0;
  }

  // 1. Jaccard similarity (token based) - Good for word reordering/missing words
  const tokens1 = new Set(
    s1.split(
      /\s+/
    )
  );
  const tokens2 = new Set(
    s2.split(
      /\s+/
    )
  );

  const intersection = new Set(
    [
      ...tokens1 
    ].filter(
      (
        x
      ) => {
        return tokens2.has(
          x
        );
      }
    )
  );
  const union = new Set(
    [
      ...tokens1,
      ...tokens2 
    ]
  );

  const jaccard = intersection.size / union.size;

  // 2. Levenshtein similarity (character based) - Good for typos
  const distance = levenshteinDistance(
    s1, s2
  );
  const maxLength = Math.max(
    s1.length, s2.length
  );
  const levSimilarity = ( maxLength - distance ) / maxLength;

  // Return the maximum of both to be lenient with differences
  const similarity = Math.max(
    jaccard, levSimilarity
  );
  console.log(
    `"${ str1 }" is ${ ( similarity * 100 ).toFixed(
      2
    ) }% similar to "${ str2 }"`
  );

  return similarity;
}

/**
 * Determines if two names are completely different based on a similarity threshold.
 *
 * @param {string | null | undefined} name1 - First name.
 * @param {string | null | undefined} name2 - Second name.
 * @returns {boolean} True if names are completely different, false if they are similar enough.
 */
export function areNamesCompletelyDifferent(
  name1: string | null | undefined,
  name2: string | null | undefined
): boolean {
  // If both are falsy, they are not "completely different"
  if ( !name1 && !name2 ) {
    return false;
  }

  // If one is falsy and the other is not, they are considered completely different
  if ( !name1 || !name2 ) {
    return true;
  }

  const similarity = getStringSimilarity(
    name1, name2
  );

  // Threshold of 0.7 allows for missing words in long names or minor typos.
  return similarity < 0.7;
}
