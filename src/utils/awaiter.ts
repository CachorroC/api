/**
 * @module utils/awaiter
 * @description Promisified Delay/Sleep Utility for Rate Limiting and async Pauses
 * 
 * Provides a sleep/delay function that returns a Promise resolving after specified
 * milliseconds. Used throughout the codebase for:
 * - Rate limiting between API requests (enforceRateLimit in fetchWithSmartRetry)
 * - Batch processing delays (processBatch in try-carpeta-async-model)
 * - Deliberate pauses for error recovery
 * - Providing timestamped logging of delays
 * 
 * FEATURES:
 * - Promise-based (works with async/await)
 * - Automatic console logging with formatted timestamp
 * - Non-blocking (doesn't freeze event loop)
 * - Useful for managing rate limits on government APIs
 * 
 * IMPORT DEPENDENCIES:
 * formatDateToString: Formats Date to readable string (ISO format)
 * 
 * USE CASES:
 * 1. Rate limiting: await sleep(13000) between API calls
 * 2. Batch processing: await sleep(1000) between batches
 * 3. Error recovery: await sleep(5000) before retrying failed request
 */

import { formatDateToString } from './ensureDate.js';

/**
 * @function sleep
 * @description Promisified setTimeout to pause execution and log delay with timestamp.
 * 
 * Creates a Promise that resolves after specified milliseconds, logging the delay
 * start and timestamp to console. Used for rate limiting, batch delays, and error recovery.
 * 
 * EXECUTION FLOW:
 * 1. Create new Date (current time)
 * 2. Format to readable string via formatDateToString()
 * 3. Log sleep start message with duration and timestamp
 * 4. Setup setTimeout callback to resolve promise
 * 5. Return promise to caller
 * 6. Promise resolves after ms milliseconds
 * 
 * @param {number} ms - The number of milliseconds to wait before resolving.
 * @returns {Promise<void>} A promise that resolves after the specified time.
 *                          Does not reject.
 * 
 * @example
 * // Rate limiting: Wait 13 seconds between API calls
 * await sleep(13000); // Resolves after 13 seconds
 * 
 * @example
 * // Used in async batch processor
 * for (const batch of batches) {
 *   await processBatch(batch);
 *   await sleep(1000); // Pause 1 second between batches
 * }
 * 
 * @note Logs to console: "🛌 sleeping {ms} {timestamp} 😴"
 * @note stdout logs when called to help with debugging/auditing delays
 * @note Multiple sleeps can run in parallel if awaited in Promise.all()
 */
export const sleep = (
  ms: number 
) => {
  return new Promise(
    (
      resolve 
    ) => {
      const logTime = new Date();
      const formatedLogTime = formatDateToString(
        logTime 
      );

      console.log(
        `🛌 sleeping ${ ms } ${ formatedLogTime } 😴` 
      );

      return setTimeout(
        resolve, ms 
      );
    } 
  );
};
