import { client } from '../services/prisma';

async function getAllDespachos() {
  const procesos = await client.proceso.findMany();
  const despachosSet = new Set<string>(
    procesos.map(
      (
        p 
      ) => {
        return p.despacho;
      } 
    ),
  );
  saveDespachos(
    despachosSet 
  );

  return Array.from(
    despachosSet 
  );
}

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

async function saveDespachos(
  dataStream: Set<string> 
) {
  const dirPath = './logs';
  const filePath = join(
    dirPath, 'allDespachos.json' 
  );

  try {
    // 1. Ensure the directory exists
    // 'recursive: true' prevents errors if the folder already exists
    await mkdir(
      dirPath, {
        recursive: true,
      } 
    );

    // 2. Convert Set to Array and stringify
    // We spread the set into an array [...] so JSON.stringify can read it
    const jsonContent = JSON.stringify(
      [
        ...dataStream
      ], null, 2 
    );

    // 3. Write the file
    await writeFile(
      filePath, jsonContent, 'utf-8' 
    );

    console.log(
      `File successfully written to ${ filePath }` 
    );
  } catch ( error ) {
    console.error(
      'Error handling file operations:', error 
    );
  }
}

getAllDespachos();
