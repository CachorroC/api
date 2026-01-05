// 1. Custom Error
export class ApiError extends Error {
  constructor(public message: string, public statusCode?: number) {
    super(message);
    this.name = "ApiError";
  }
}

// 2. Helper for delays
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class RobustApiClient {
  private baseUrl: string;
  private readonly RATE_LIMIT_DELAY_MS = 12000; // 12 seconds (5 req/min)

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Internal Request Method
   * Performs the actual fetch
   */
  async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new ApiError(`HTTP Error: ${response.status}`, response.status);
    }

    const data = await response.json().catch(() => {
      throw new ApiError("Invalid JSON response");
    });

    return data as T;
  }

  /**
   * Retry Wrapper
   * Wraps the request in a loop to handle temporary failures
   */
  async requestWithRetry<T>(endpoint: string, maxRetries: number = 3): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.request<T>(endpoint);
      } catch (error) {
        attempt++;

        // LOGIC: When should we give up?
        // 1. If we hit the max retries
        // 2. If it's a 404 (Not Found) - retrying won't find it
        // 3. If it's a 4xx Client Error (User fault)
        const isClientError = error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500;

        if (attempt >= maxRetries || isClientError) {
          throw error;
        }

        console.warn(`⚠️ Attempt ${attempt} failed. Retrying in 2 seconds...`);
        await wait(2000); // Wait 2 seconds before retrying
      }
    }
    throw new Error("Unreachable code");
  }

  /**
   * Batch Processor
   * Handles Array Iteration + Rate Limiting + Error Management
   */
  public async fetchBatch<T, U extends { id: string | number }>(
    items: U[],
    pathBuilder: (item: U) => string
  ): Promise<Array<{ originalItem: U; status: 'success' | 'error' | string; data?: T; error?: string }>> {

    const results = [];

    for (const [index, item] of items.entries()) {
      // RATE LIMITER: Strict 12s delay between new items
      if (index > 0) {
        console.log(`⏳ Rate Limit: Waiting ${this.RATE_LIMIT_DELAY_MS / 1000}s...`);
        await wait(this.RATE_LIMIT_DELAY_MS);
      }

      try {
        console.log(`Fetching ID: ${item.id}...`);

        // We call requestWithRetry instead of request directly
        const endpoint = pathBuilder(item);
        const data = await this.requestWithRetry<T>(endpoint);

        results.push({ originalItem: item, status: 'success', data });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`❌ Final Failure ID ${item.id}: ${message}`);
        results.push({ originalItem: item, status: 'error', error: message });
      }
    }

    return results;
  }
}