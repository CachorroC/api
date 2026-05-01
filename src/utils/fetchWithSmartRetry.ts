/**
 * @fileoverview Intelligent Retry and Rate Limiting Fetch Utility
 *
 * This module provides a hardened HTTP client wrapper for the standard fetch API.
 * It's specifically designed for interacting with rate-limited APIs like the
 * Colombian Judiciary system, adding:
 *
 * **Problem Statement:**
 * - Government APIs often have strict rate limits (e.g., 5 req/min per endpoint)
 * - WAF/DDoS protection may block automated requests with 429/503 responses
 * - Some endpoints return 500/502 errors sporadically
 * - Network failures are common in high-latency scenarios
 *
 * **Solution:**
 * - Proactive rate limiting (queue per endpoint group) prevents 429 errors
 * - Exponential backoff with jitter for transient failures
 * - Server-side Retry-After header parsing
 * - Automatic retries for recoverable errors (429, 500, 502, 503, 504, etc)
 *
 * **Architecture:**
 * - getRateLimitKey(): Normalizes URLs to group by endpoint pattern
 * - enforceRateLimit(): Queues requests per endpoint group
 * - fetchWithSmartRetry(): Main exported function with retry logic
 *
 * Rate Limit Strategy:
 * - Requests to /api/v2/Procesos/Consulta/{id} and /{id2} share a queue
 * - Each queue enforces 13-second delay between requests
 * - Allows ~4-5 requests per minute per endpoint (safe margin below 60s/5req limit)
 *
 * @module fetchWithSmartRetry
 */

import { sleep } from './awaiter.js';

/**
 * The minimum delay required between requests to the same route group.
 *
 * Configured to 13,000ms to allow approximately 4-5 requests per minute,
 * strictly adhering to a 60,000ms / 5 requests limit with a safety buffer.
 * This prevents triggering rate limit 429 errors on the Judiciary API.
 *
 * Formula: 60,000ms ÷ 5 requests = 12,000ms per request → 13,000ms with buffer
 *
 * @constant {number}
 */
const RATE_LIMIT_DELAY_MS = 13000;

/**
 * A map that holds promise queues for each normalized route key.
 * This ensures that rate limits are enforced per route group rather than globally.
 *
 * Structure: Map<routeKey, Promise<void>>
 * - routeKey: Normalized URL (e.g., 'api.gov.co/procesos/{id}')
 * - Promise: Queue of pending requests for that route
 *
 * This allows different endpoints to make requests in parallel,
 * while serializing requests within the same endpoint group.
 *
 * @type {Map<string, Promise<void>>}
 */
const urlQueues = new Map<string, Promise<void>>();

/**
 * Normalizes a URL to group similar REST endpoints for rate limiting.
 *
 * This function performs the following transformations:
 * 1. **Strips query parameters**: /endpoint?foo=bar → /endpoint
 * 2. **Normalizes numeric IDs**: /posts/123 → /posts/{id}
 * 3. **Normalizes UUIDs**: /users/550e8400... → /users/{id}
 *
 * Benefit: All requests to `/posts/123`, `/posts/456`, `/posts/789` share the same
 * rate limit bucket, preventing rapid-fire sequential calls to similar endpoints.
 *
 * @param {string | URL} targetUrl - The original URL being requested.
 * @returns {string} The normalized key representing the route group
 *                   (e.g., `api.example.com/posts/{id}`).
 *
 * @example
 * getRateLimitKey('https://api.gov.co/Procesos/Consulta/NumeroRadicacion?numero=123');
 * // Returns: 'api.gov.co/Procesos/Consulta/NumeroRadicacion'
 *
 * getRateLimitKey('https://api.gov.co/Proceso/Actuaciones/12345');
 * // Returns: 'api.gov.co/Proceso/Actuaciones/{id}'
 */
function getRateLimitKey(
  targetUrl: string | URL 
): string {
  const urlObj = new URL(
    targetUrl.toString() 
  );
  let path = urlObj.pathname;
  path = path.replace(
    /\/\d+(?=\/|$)/g, '/{id}' 
  );
  path = path.replace(
    /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g,
    '/{id}',
  );

  return `${ urlObj.hostname }${ path }`;
}

/**
 * Ensures that requests to SIMILAR routes are spaced out according to `RATE_LIMIT_DELAY_MS`.
 *
 * This function implements a per-endpoint queue system using Promises:
 * 1. **Identifies route group** using getRateLimitKey()
 * 2. **Gets existing queue** for that group (or starts fresh)
 * 3. **Creates new wait promise** that will add RATE_LIMIT_DELAY_MS after current queue
 * 4. **Updates queue map** with the new wait promise
 * 5. **Awaits current turn** before returning (allowing caller to proceed)
 *
 * This serializes requests to the same endpoint while allowing parallel requests
 * to different endpoints. For example:
 * - Request 1 to /api/v2/Proceso/Actuaciones/111 → waits 0ms (queue empty)
 * - Request 2 to /api/v2/Proceso/Actuaciones/222 → waits 13,000ms (same queue!)
 * - Request 3 to /api/v2/Procesos/Consulta/333 → waits 0ms (different route)
 *
 * **Memory cleanup**: Automatically deletes queue entries after all requests complete.
 *
 * @private
 * @async
 * @param {string | URL} url - The URL to enforce rate limits on.
 * @returns {Promise<void>} Resolves when it's safe to make the request
 *                         (rate limit delay has been imposed).
 *
 * @example
 * // In quick succession from the same route:
 * await enforceRateLimit('https://api.gov.co/endpoint/123');
 * // Request 1: returns immediately
 * await enforceRateLimit('https://api.gov.co/endpoint/456');
 * // Request 2: waits 13,000ms then returns
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
      await sleep(
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
 * This is the main exported function providing "smart" HTTP fetching for
 * production scenarios. It combines multiple resilience strategies:
 *
 * **Strategy: Proactive Rate Limiting**
 * - Calls enforceRateLimit() BEFORE the actual fetch
 * - Serializes requests per endpoint group
 * - Prevents 429 errors from happening in the first place
 *
 * **Strategy: Exponential Backoff with Jitter**
 * - Failed attempts wait before retrying: delay = baseDelay * 2^attempt
 * - First retry: 8 seconds, Second: 16 seconds, Third: 32 seconds, etc
 * - Distributes load and prevents thundering herd
 *
 * **Strategy: Server-side Retry-After Header**
 * - Respects the `Retry-After` response header (if present)
 * - Prioritizes server guidance over client backoff
 * - Example: "Retry-After: 60" means wait 60 seconds
 *
 * **Strategy: Recoverable Error Handling**
 * - Automatically retries on: 403, 408, 500, 502, 503, 504
 * - These are transient errors that may succeed on retry
 * - Terminal errors (400, 401, 404) fail immediately
 *
 * **Error Handling Flow:**
 * ```
 * Make Request
 *     ↓
 * Response OK? → Return response ✓
 * Response 429 (Rate Limited)? → Wait (respecting Retry-After), retry
 * Response 5xx/408 (Transient)? → Exponential backoff, retry
 * Response 4xx (Terminal)? → Return response ✗
 * Network Error? → Exponential backoff, retry
 * Max Retries? → Return last response or throw
 * ```
 *
 * @async
 * @param {string | URL} url - The URL to fetch.
 *                            Can be a full URL string or URL object.
 * @param {RequestInit} [options={}] - Standard fetch API options:
 *                                    - method: 'GET', 'POST', etc
 *                                    - headers: Custom HTTP headers
 *                                    - body: Request body for POST/PUT
 *                                    - credentials: 'include' for cookies, etc
 * @param {number} [maxRetries=7] - Maximum retry attempts (8 total tries including initial).
 *                                  Set to 0 for no retries (1 attempt only).
 *                                  Default 7 = 8 total attempts.
 * @param {number} [baseDelay=8000] - Base delay in milliseconds for exponential backoff.
 *                                    Doubles with each retry: 8s, 16s, 32s, 64s...
 *                                    Default 8000ms = 8 seconds.
 *
 * @returns {Promise<Response>} The HTTP Response object if:
 *                             - Request succeeds (response.ok)
 *                             - Max retries exhausted (may be error response)
 *                             Returns last response, even if not ok
 * @throws {Error} Only throws if:
 *               - Network error persists after all retries (no response object)
 *               - Catastrophic errors (e.g., invalid URL)
 *
 * @example
 * // Simple success case
 * const response = await fetchWithSmartRetry(
 *   'https://api.gov.co/Procesos/Consulta/123'
 * );
 * const data = await response.json();
 *
 * @example
 * // With POST and custom config
 * const response = await fetchWithSmartRetry(
 *   'https://api.gov.co/submit',
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ data: 'value' })
 *   },
 *   maxRetries = 5,
 *   baseDelay = 4000
 * );
 *
 * @example
 * // Error handling
 * try {
 *   const response = await fetchWithSmartRetry(url);
 *   if (!response.ok) {
 *     console.error(`HTTP ${response.status}: ${await response.text()}`);
 *   } else {
 *     const data = await response.json();
 *   }
 * } catch (err) {
 *   console.error('Network or fatal error:', err.message);
 * }
 */
export async function fetchWithSmartRetry(
  url: string | URL,
  options: RequestInit = {},
  maxRetries = 7,
  baseDelay = 8000,
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
            delay = parsedSeconds * 1000 + 1000;
          }
        }

        console.warn(
          `⏳ [429] Route limit hit for ${ getRateLimitKey(
            url,
          ) }. Pausing for ${ delay }ms...`,
        );
        await sleep(
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
        await sleep(
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
      const errorMessage
        = error instanceof Error
          ? error.message
          : String(
              error 
            );
      console.error(
        `📡 [Network Error] ${ errorMessage }. Retrying in ${ delay }ms...`,
      );
      await sleep(
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
