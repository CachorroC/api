import prompts from 'prompts';
import { tryAsyncClassCarpetas } from './try-carpeta-async-model.js';
import { runSync } from './services/syncronize_newest_actuaciones_test_2.js';
import { argv } from 'node:process';

async function main() {
  // 1. Check for command-line arguments to bypass the menu
  const args = process.argv.slice(
    2 
  );
  const [
    actionArg
  ] = args;

  try {
    // Automated execution for 'sync-processes'
    if ( actionArg === 'sync-processes' || actionArg === '--sync-processes' ) {
      console.log(
        '🤖 Automated Mode: Starting Sync Processes...' 
      );
      await runSync();
      console.log(
        '🏁 Automated Sync Processes Complete.' 
      );
      process.exit(
        0 
      );
    }

    // Automated execution for 'sync-folders'
    if ( actionArg === 'sync-folders' || actionArg === '--sync-folders' ) {
      console.log(
        '🤖 Automated Mode: Starting Sync Folders...' 
      );
      await tryAsyncClassCarpetas();
      console.log(
        '🏁 Automated Sync Folders Complete.' 
      );
      process.exit(
        0 
      );
    }

    // 2. Interactive menu loop
    while ( true ) {
      console.clear();
      console.log(
        '🚀 Welcome to the Rest-Express CLI Control Panel\n' 
      );
      
      const response = await prompts(
        {
          type   : 'select',
          name   : 'action',
          message: 'What would you like to run?',
          choices: [
            {
              title: '1. Sync Processes (Cron Controller)',
              value: 'sync-processes',
            },
            {
              title: '2. Sync Folders (Optimized Batch Processing)',
              value: 'sync-folders',
            },
            {
              title: '3. Exit',
              value: 'exit',
            },
          ],
          initial: 0,
        } 
      );

      if ( !response.action || response.action === 'exit' ) {
        console.log(
          '👋 Goodbye!' 
        );
        process.exit(
          0 
        );
      }

      console.log(
        `⏳ Running task: ${ response.action }...` 
      );

      if ( response.action === 'sync-processes' ) {
        await runSync();
      } else if ( response.action === 'sync-folders' ) {
        await tryAsyncClassCarpetas();
      }

      console.log(
        '\n✅ Task finished. Press any key to return to menu...' 
      );
      await prompts(
        {
          type   : 'invisible',
          name   : 'continue',
          message: '',
        } 
      );
    }
  } catch ( error ) {
    console.error(
      '❌ Fatal error during execution:', error 
    );
    process.exit(
      1 
    );
  }
}

main();
