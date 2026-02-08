/**
 * Retry utility with exponential backoff for resilient API calls
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  retryableStatusCodes: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [
    "ECONNRESET",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "fetch failed",
    "NetworkError",
  ],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay,
  );

  if (config.jitter) {
    // Add random jitter (±25%)
    const jitterAmount = exponentialDelay * 0.25;
    return exponentialDelay - jitterAmount + Math.random() * jitterAmount * 2;
  }

  return exponentialDelay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on configuration
 */
export function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (error instanceof Error) {
    // Check error message
    if (
      config.retryableErrors.some((retryableError) =>
        error.message.includes(retryableError),
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a status code is retryable
 */
export function isRetryableStatus(
  status: number | undefined,
  config: RetryConfig,
): boolean {
  if (status === undefined) return false;
  return config.retryableStatusCodes.includes(status);
}

/**
 * Extract status code from various error types
 */
function extractStatusCode(error: unknown): number | undefined {
  if (error instanceof Response) {
    return error.status;
  }

  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status as number;
  }

  return undefined;
}

/**
 * Error classification utilities
 */
export function isAuthError(error: unknown): boolean {
  const status = extractStatusCode(error);
  return status === 401 || status === 403;
}

export function isRateLimitError(error: unknown): boolean {
  const status = extractStatusCode(error);
  return status === 429;
}

export function isValidationError(error: unknown): boolean {
  const status = extractStatusCode(error);
  return status === 400;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    );
  }
  return false;
}

/**
 * Retry wrapper with exponential backoff
 *
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Result of the function
 * @throws Last error if all attempts fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const statusCode = extractStatusCode(error);
      const shouldRetry =
        attempt < finalConfig.maxAttempts &&
        (isRetryableError(error, finalConfig) ||
          isRetryableStatus(statusCode, finalConfig));

      if (!shouldRetry) {
        throw lastError;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, finalConfig);
      console.warn(
        `Attempt ${attempt}/${finalConfig.maxAttempts} failed. Retrying in ${Math.round(delay)}ms...`,
        lastError.message,
      );
      await sleep(delay);
    }
  }

  throw (
    lastError ||
    new Error(`All ${finalConfig.maxAttempts} retry attempts failed`)
  );
}

/**
 * Create a retryable function with pre-configured options
 */
export function createRetryable<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, config: Partial<RetryConfig> = {}): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), config);
  }) as T;
}
