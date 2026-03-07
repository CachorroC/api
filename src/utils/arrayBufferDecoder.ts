/**
 * Safely decodes an ArrayBuffer into a JavaScript Object.
 * * @param {ArrayBuffer} buffer - The raw binary data
 * @param {string} encoding - Default is 'utf-8', but could be 'windows-1252', etc.
 * @returns {Object} - The parsed object, or a fallback object with raw text if parsing fails
 */
export function decodeBufferSafely<T>(buffer: ArrayBuffer , encoding = 'utf-8'): T | { parseError: string; rawText: string } {
  try {
    // 1. Decode bytes to a string.
    // fatal: false ensures invalid bytes are replaced with '' instead of crashing.
    const decoder = new TextDecoder(encoding, { fatal: false });
    const decodedString = decoder.decode(buffer);

    // 2. Try to parse it as JSON
    return JSON.parse(decodedString);

  } catch (error) {
    console.error("Failed to parse the decoded string as JSON:", error.message);

    // Fallback: If it's not JSON, return the raw string so you don't lose the data
    // You can also just return `null` if you strictly require an object
    return {
      parseError: error.message,
      rawText: new TextDecoder(encoding, { fatal: false }).decode(buffer)
    };
  }º
}

// Usage:
// const myBuffer = ... // your ArrayBuffer
// const myObject = decodeBufferSafely(myBuffer);