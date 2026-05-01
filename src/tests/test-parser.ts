import { parseNotes } from '../utils/notes-parser';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function testParser() {
  const notesPath = path.join(
    process.cwd(), 'notes.json'
  );

  if ( !fs.existsSync(
    notesPath
  ) ) {
    console.error(
      'notes.json not found'
    );

    return;
  }

  const notesData = JSON.parse(
    fs.readFileSync(
      notesPath, 'utf8'
    )
  );

  // Pick some interesting examples
  const examples = [
    notesData[ 0 ].notes[ 2 ], // Multi date, natural language
    notesData[ 1 ].notes[ 2 ], // Numeric dates
    '17 DE NERO DE 2019 SE DEVOLVIERON GARANTIAS', // Typo NERO
    'AGOSOTO 15 DE 2023 SE REVISO RUNT', // Inverse natural (Fix target)
    '9 DE MAYO DE 2.018 SE DEVOLVIERON GARANTIAS', // Dot in year
    '1 DE FEBRERO SE ENVIO A GARANTIA', // Missing year
    'EL 22/10/18 SE CANCELO EMBARGO', // 2-digit year
    'SE HIZO SECUESTRO EL 2/9/2027 Y LIBERACION EL 5/9/2027' // Multiple dates (Structural check)
  ];

  console.log(
    '--- Testing parseNotes (Updated Structure) ---\n'
  );

  examples.forEach(
    (
      example, i
    ) => {
      if ( !example ) {
        return;
      }

      console.log(
        `Example ${ i + 1 }: "${ example }"`
      );
      const results = parseNotes(
        example
      );
      console.log(
        'Results:', JSON.stringify(
          results, (
            key, value
          ) => {
            if ( value instanceof Date ) {
              return value.toISOString().split(
                'T'
              )[ 0 ];
            }

            return value;
          }, 2
        )
      );
      console.log(
        '\n-------------------------\n'
      );
    }
  );
}

testParser().catch(
  console.error
);
