
export async function fetchWithSmartRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 5,
  baseDelay = 4000,
): Promise<Response> {
  const totalAttempts = maxRetries + 1;
  let attempt = 1;

  while ( attempt <= totalAttempts ) {
    if ( attempt > 1 ) {
      console.log(
        `🔄 fetchWithSmartRetry Attempt ${ attempt } for ${ url }`
      );
    }

    try {
      const response = await fetch(
        url, options
      );

      // --- HANDLE 429 (RATE LIMITS) ---
      if ( response.status === 429 ) {
        const retryAfterHeader = response.headers.get(
          'retry-after'
        );
        // Telegram often sends retry-after in seconds
        const waitTime = retryAfterHeader
          ? ( parseInt(
              retryAfterHeader, 10
            ) * 1000 ) + 1000
          : baseDelay * Math.pow(
            2, attempt
          );

        console.warn(
          `⚠️ [429 Too Many Requests] Pausing for ${ waitTime }ms...`
        );
        await wait(
          waitTime
        );
        attempt++;

        continue;
      }

      if ( response.status === 403 ) {
        await wait(
          2000
        );
        attempt++;
        console.log(
          response.statusText
        );

        continue;
      }

      // --- HANDLE 403 (FORBIDDEN) ---
      // If it's Telegram, a 403 usually means the user hasn't started the bot.
      // We should NOT retry this indefinitely, or we'll get stuck.
      /* if ( response.status === 403 ) {
        // We throw a specific error so we can log it gracefully without retrying
        throw new ApiError(
          `403 Forbidden: Check permissions or Bot settings. URL: ${ url }`, 403
        );
      } */

      // Check for server errors
      if ( [
        500,
        502,
        503,
        504
      ].includes(
        response.status
      ) ) {
        throw new ApiError(
          `Server Status ${ response.status }`, `🚫 failed request: fetchWithSmartRetry: ${ url } statusCode<500`
        );
      }

      return response;

    } catch ( error: any ) {
      // Stop if we ran out of attempts or if it's a 403 (don't retry forbidden)
      if ( attempt >= totalAttempts /* || error.name === 'AbortError'  || error.statusCode === 403 */ ) {
        throw error;
      }

      const delay = ( baseDelay * attempt );
      console.warn(
        `⚠️ [Retry] Attempt ${ attempt }/${ totalAttempts } failed for ${ url }. Retrying in ${ delay }ms...`
      );
      console.log(
        `⚠️ [Retry] Attempt ${ attempt }/${ totalAttempts } failed for ${ url }. Retrying in ${ delay }ms...`
      );
      await wait(
        delay
      );
      attempt++;
    }
  }

  throw new ApiError(
    'fetchWithSmartRetry failed unexpectedly', `🚫 failed request: fetchWithSmartRetry: ${ url }`
  );
}
