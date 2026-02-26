const wait = (
  ms: number
) => {
  return new Promise(
    resolve => {
      return setTimeout(
        resolve, ms
      );
    }
  );
};

/**
 * Executes a network request using the native `fetch` API with built-in smart retry logic.
 *
 * This wrapper enhances standard fetch by automatically retries requests that fail due to
 * network disruptions, rate limiting (HTTP 429), or recoverable server-side errors
 * (HTTP 403, 408, 500, 502, 503, 504).
 * * It utilizes an exponential backoff strategy to prevent server overload and explicitly
 * respects the `Retry-After` header when provided during a 429 response. Fatal client errors
 * (e.g., 400, 401, 404) are bypassed and returned immediately to the caller.
 *
 * @param {string | URL} url - The absolute or relative URL to fetch.
 * @param {RequestInit} [options={}] - Standard fetch options (method, headers, body, etc.).
 * In Node 18+, you can pass a custom `dispatcher` here to bypass SSL.
 * @param {number} [maxRetries=3] - The maximum number of retry attempts before yielding the final response or throwing.
 * @param {number} [baseDelay=1000] - The base delay in milliseconds used to calculate the exponential backoff (`baseDelay * 2^attempt`).
 * * @returns {Promise<Response>} A promise that resolves to the standard fetch `Response` object.
 * **Note:** This resolves successfully even on HTTP error statuses (like 500) if the maximum retries are exhausted, allowing the caller to read the error body.
 * * @throws {Error} Throws an error only if a low-level network/connection failure (e.g., DNS resolution failed, offline) persists beyond `maxRetries`.
 *
 * @example
 * // Basic usage:
 * const response = await fetchWithSmartRetry('https://api.example.com/data');
 * if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
 * const data = await response.json();
 *
 * @example
 * // Advanced usage bypassing SSL for a legacy API (Node 18+):
 * import { Agent } from 'undici';
 * * const legacyAgent = new Agent({ connect: { rejectUnauthorized: false } });
 * const response = await fetchWithSmartRetry(
 * 'https://bad-ssl-api.gov/data',
 * { dispatcher: legacyAgent }, // Custom agent injected here
 * 5,                           // 5 max retries
 * 2000                         // 2-second base delay
 * );
 */
export async function fetchWithSmartRetry(
  url: string | URL,
  options: RequestInit = {},
  maxRetries = 7,
  baseDelay = 8000 // 1 second base delay
): Promise<Response> {
  let attempt = 0;

  while ( attempt <= maxRetries ) {
    if ( attempt > 0 ) {
      console.log(
        `🔄 fetchWithSmartRetry: Attempt ${ attempt + 1 } of ${ maxRetries + 1 } for ${ url }`
      );
    }

    try {
      const response = await fetch(
        url, options
      );

      // ✅ 1. Success Case
      if ( response.ok ) {
        return response;
      }

      // 🛑 2. Handle Rate Limits (429 Too Many Requests)
      if ( response.status === 429 ) {
        if ( attempt >= maxRetries ) {
          return response;
        }

        const retryAfter = response.headers.get(
          'retry-after'
        );

        // Default to exponential backoff if no header is present
        let delay = baseDelay * Math.pow(
          2, attempt
        );

        // If header exists, parse it (assuming seconds format)
        if ( retryAfter ) {
          const parsedSeconds = parseInt(
            retryAfter, 10
          );

          if ( !isNaN(
            parsedSeconds
          ) ) {
            delay = ( parsedSeconds * 1000 ) + 1000; // Add 1s buffer
          }
        }

        console.log(
          `⏳ [429 Rate Limit] Pausing for ${ delay }ms...`
        );
        await wait(
          delay
        );
        attempt++;

        continue;
      }

      // ⚠️ 3. Handle Recoverable Server Errors
      const RECOVERABLE_STATUSES = [
        403,
        408,
        500,
        502,
        503,
        504
      ];

      if ( RECOVERABLE_STATUSES.includes(
        response.status
      ) ) {
        if ( attempt >= maxRetries ) {
          await wait(
            2000
          );

          return response;
        } // Let caller handle the final failure

        const delay = baseDelay * Math.pow(
          2, attempt
        );
        console.log(
          `⚠️ [HTTP ${ response.status }] Server struggling. Retrying in ${ delay }ms...`
        );
        await wait(
          delay
        );
        attempt++;

        continue;
      }

      // ❌ 4. Fatal Client Errors (400, 401, 404)
      // Do not retry. Return immediately for caller to handle.
      return response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch ( error: any ) {
      // 📡 5. Network / Connection Errors (DNS failure, offline, etc.)
      if ( attempt >= maxRetries ) {
        console.log(
          `❌ Max retries reached or fatal network error for ${ url }.`
        );

        throw error; // Throwing here makes sense as there is no HTTP Response to return
      }

      const delay = baseDelay * Math.pow(
        2, attempt
      );
      console.log(
        `📡 [Network Error] ${ error.message }. Retrying in ${ delay }ms...`
      );
      await wait(
        delay
      );
      attempt++;

      continue;
    }
  }

  throw new Error(
    'Unexpected end of fetch retry loop'
  );
}