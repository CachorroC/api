import { formatDateToString } from './ensureDate.js';

/**
 * Promisified setTimeout to pause execution.
 *
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified time.
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
