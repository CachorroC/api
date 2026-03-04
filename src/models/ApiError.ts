
/**
 * Custom error class for API interactions.
 * Includes a `callerId` to easily trace which part of the sync process failed.
 */
export class ApiError extends Error {
  /**
   * @param message - The error description.
   * @param callerId - Identifier of the function or process that threw the error.
   * @param statusCode - Optional HTTP status code associated with the error.
   */
  constructor(
    public message: string,
    public callerId: string,
    public statusCode?: number
  ) {
    super(
      message
    );
    this.name = 'ApiError';
    this.callerId = callerId;
    this.statusCode = statusCode;
    console.log(
      `${ callerId }ApiError: ${ message }`
    );
  }
}