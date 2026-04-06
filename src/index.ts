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
      process.exit(
        0
      );
    }

    // 2. Fallback to interactive menu if no arguments are provided
    console.clear();
    console.log(
      '🚀 Welcome to the Rest-Express CLI Control Panel\n'
    );
    // print process.argv
    argv.forEach(
      (
        val, index
      ) => {
        console.log(
          `${ index }: ${ val }`
        );
      }
    );

    const response = await prompts(
      {
        type   : 'select',
        name   : 'action',
        message: 'What would you like to run?',
        choices: [
          {
            title: '1. Sync Processes (Cron Controller)',
            value: 'sync-processes'
          },
          {
            title: '2. Sync Folders (Optimized Batch Processing)',
            value: 'sync-folders'
          },
          {
            title: '3. Exit',
            value: 'exit'
          }
        ],
        initial: 0
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

    if ( response.action === 'sync-processes' ) {
      await runSync();
    } else if ( response.action === 'sync-folders' ) {
      await tryAsyncClassCarpetas();
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