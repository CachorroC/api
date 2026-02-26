/**
 * The minimum delay required between requests to the same route group.
 *
 * Configured to 13,000ms to allow approximately 4-5 requests per minute,
 * strictly adhering to a 60,000ms / 5 requests limit with a safety buffer.
 * @constant {number}
 */
const RATE_LIMIT_DELAY_MS = 13000;

/**
 * A map that holds promise queues for each normalized route key.
 * This ensures that rate limits are enforced per route group rather than globally.
 * @type {Map<string, Promise<void>>}
 */
const urlQueues = new Map<string, Promise<void>>();

/**
 * Promisified setTimeout to pause execution.
 *
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified time.
 */
const wait = (
  ms: number
) => {
  return new Promise(
    (
      resolve
    ) => {
      return setTimeout(
        resolve, ms
      );
    }
  );
};

/**
 * Normalizes a URL to group similar REST endpoints for rate limiting.
 *
 * This function performs the following transformations:
 * 1. Strips query parameters.
 * 2. Replaces numeric IDs (e.g., `/posts/123`) with `/{id}`.
 * 3. Replaces UUIDs (e.g., `/users/123e4567...`) with `/{id}`.
 *
 * This allows all requests to `/posts/123` and `/posts/456` to share the same rate limit bucket.
 *
 * @param {string | URL} targetUrl - The original URL being requested.
 * @returns {string} The normalized key representing the route group (e.g., `api.example.com/posts/{id}`).
 */
function getRateLimitKey(
  targetUrl: string | URL
): string {
  // Convert to URL object (this automatically drops the #hash if present)
  const urlObj = new URL(
    targetUrl.toString()
  );
  console.log(
    `path: ${ targetUrl }`
  );
  let path = urlObj.pathname;
  console.log(
    `path: ${ path }`
  );

  // 1. Replace numeric IDs (e.g., /posts/123 -> /posts/{id})
  path = path.replace(
    /\/\d+(?=\/|$)/g, '/{id}'
  );
  console.log(
    `path: ${ path }`
  );

  // 2. Replace UUIDs (e.g., /users/123e4567-e89b... -> /users/{id})
  path = path.replace(
    /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g, '/{id}'
  );
  console.log(
    `path: ${ path }`
  );

  // Return the hostname + normalized path (ignoring urlObj.search / query params)
  return `${ urlObj.hostname }${ path }`;
}

/**
 * Ensures that requests to SIMILAR routes are spaced out according to `RATE_LIMIT_DELAY_MS`.
 *
 * Uses `getRateLimitKey()` to identify the route group and then serializes requests
 * to that specific group using a promise queue. This prevents 429 errors from
 * hitting specific endpoints too frequently while allowing parallel requests to different endpoints.
 *
 * @param {string | URL} url - The URL to enforce rate limits on.
 * @returns {Promise<void>} Resolves when the rate limit delay has passed and the request can proceed.
 */
async function enforceRateLimit(
  url: string | URL
): Promise<void> {
  // Use our new helper to get the grouped bucket key
  const routeKey = getRateLimitKey(
    url
  );

  // Get the existing queue for this route, or start a fresh one
  const currentWait = urlQueues.get(
    routeKey
  ) || Promise.resolve();

  // Schedule the NEXT request to this route to wait
  const nextWait = currentWait.then(
    async () => {
      await wait(
        RATE_LIMIT_DELAY_MS
      );

      // 🧹 Memory Cleanup
      if ( urlQueues.get(
        routeKey
      ) === nextWait ) {
        urlQueues.delete(
          routeKey
        );
      }
    }
  );

  // Update the map with the newly extended queue
  urlQueues.set(
    routeKey, nextWait
  );

  // Wait for our turn in this specific route's queue
  await currentWait;
}

/**
 * Fetches a resource from a URL with robust retry logic and intelligent rate limiting.
 *
 * Features:
 * - **Proactive Rate Limiting**: Uses `enforceRateLimit()` at the start to serialize requests
 *   to the same endpoint group, preventing 429 errors before they happen.
 * - **Exponential Backoff**: Increases the wait time between retries.
 * - **Header-aware 429 Handling**: Respects the `Retry-After` header if provided by the server.
 * - **Recoverable Error Handling**: Automatically retries on 408, 500, 502, 503, 504 statuses.
 *
 * @param {string | URL} url - The URL to fetch.
 * @param {RequestInit} [options={}] - Standard fetch options (method, headers, body, etc.).
 * @param {number} [maxRetries=7] - The maximum number of retry attempts. Default is 7.
 * @param {number} [baseDelay=8000] - The base delay in milliseconds used for exponential backoff calculation. Default is 8000ms.
 *
 * @returns {Promise<Response>} The fetch Response object if successful or if max retries are exhausted without a throw for non-network errors.
 * @throws {Error} Throws if a network error persists after all retries, or if an unrecoverable error occurs.
 */
export async function fetchWithSmartRetry(
  url: string | URL,
  options: RequestInit = {},
  maxRetries = 7,
  baseDelay = 8000
): Promise<Response> {
  let attempt = 0;

  while ( attempt <= maxRetries ) {
    try {
      // 🛡️ PROACTIVE RATE LIMITING
      if ( attempt === 0 ) {
        await enforceRateLimit(
          url
        );
      }

      const response = await fetch(
        url, options
      );

      // ✅ 1. Success Case
      if ( response.ok ) {
        return response;
      }

      // 🛑 2. Handle Rate Limits (429 Too Many Requests)
      if ( response.status === 429 ) {
        const retryAfter = response.headers.get(
          'retry-after'
        );
        let delay = baseDelay * Math.pow(
          2, attempt
        );

        if ( retryAfter ) {
          const parsedSeconds = parseInt(
            retryAfter, 10
          );

          if ( !isNaN(
            parsedSeconds
          ) ) {
            delay = ( parsedSeconds * 1000 ) + 1000;
          }
        }

        console.warn(
          `⏳ [429] Route limit hit for ${ getRateLimitKey(
            url
          ) }. Pausing for ${ delay }ms...`
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
          return response;
        }

        const delay = baseDelay * Math.pow(
          2, attempt
        );
        console.log(
          `⚠️ [HTTP ${ response.status }] Retrying in ${ delay }ms...`
        );
        await wait(
          delay
        );
        attempt++;

        continue;
      }

      // ❌ 4. Fatal Client Errors (400, 401, 404)
      return response;

    } catch ( error ) {
      // 📡 5. Network / Connection Errors
      if ( attempt >= maxRetries ) {
        throw error;
      }

      const delay = baseDelay * Math.pow(
        2, attempt
      );
      const errorMessage = error instanceof Error
        ? error.message
        : String(
            error
          );
      console.error(
        `📡 [Network Error] ${ errorMessage }. Retrying in ${ delay }ms...`
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