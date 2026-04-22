import { areNamesCompletelyDifferent, getStringSimilarity } from '../utils/string-similarity.js';

const testCases = [
  {
    n1      : 'Jhon',
    n2      : 'Sandra',
    expected: true, // Completely different
  },
  {
    n1      : 'JUAN DE JESUS ESCOBAR SCOBAR',
    n2      : 'JUAN DE JESUS ESCOBAR ESCOBAR',
    expected: false, // Similar enough (one word missing/typo)
  },
  {
    n1      : 'Sandra',
    n2      : 'Sanda',
    expected: false, // Minor typo (one letter missing)
  },
  {
    n1      : null,
    n2      : 'Sandra',
    expected: true, // null vs value is completely different
  },
  {
    n1      : 'JUAN DE JESUS ESCOBAR',
    n2      : 'JUAN DE JESUS ESCOBAR ESCOBAR',
    expected: false, // Word missing
  }
];

console.log(
  '🧪 Running String Similarity Tests...\n' 
);

testCases.forEach(
  (
    {
      n1, n2, expected 
    }, index 
  ) => {
    const similarity = getStringSimilarity(
      n1 as string, n2 as string 
    );
    const result = areNamesCompletelyDifferent(
      n1, n2 
    );
    const passed = result === expected;

    console.log(
      `Test #${ index + 1 }: ["${ n1 }"] vs ["${ n2 }"]` 
    );
    console.log(
      `  Similarity: ${ similarity.toFixed(
        4 
      ) }` 
    );
    console.log(
      `  Result: ${ result ? 'DIFFERENT' : 'SIMILAR' } (Expected: ${ expected ? 'DIFFERENT' : 'SIMILAR' })` 
    );
    console.log(
      `  Status: ${ passed ? '✅ PASSED' : '❌ FAILED' }\n` 
    );
  } 
);
