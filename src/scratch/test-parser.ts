import { parseNotes } from '../utils/notes-parser';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function testParser() {
  const notesPath = path.join(process.cwd(), 'notes.json');
  if (!fs.existsSync(notesPath)) {
    console.error('notes.json not found');
    return;
  }

  const notesData = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
  
  // Pick some interesting examples
  const examples = [
    notesData[0].notes[2], // Multi date, natural language
    notesData[1].notes[2], // Numeric dates
    notesData[15].notes[2], // Mixed formats
    notesData[31].notes[2], // Many notes
    "17 DE NERO DE 2019 SE DEVOLVIERON GARANTIAS", // Typo NERO
    "9 DE MAYO DE 2.018 SE DEVOLVIERON GARANTIAS", // Dot in year
    "1 DE FEBRERO SE ENVIO A GARANTIA" // Missing year
  ];

  console.log('--- Testing parseNotes ---\n');

  examples.forEach((example, i) => {
    console.log(`Example ${i + 1}: "${example}"`);
    const results = parseNotes(example);
    console.log('Results:', JSON.stringify(results, (key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    }, 2));
    console.log('\n-------------------------\n');
  });
}

testParser().catch(console.error);
