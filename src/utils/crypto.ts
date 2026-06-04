/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const XOR_KEY = 42; // Symmetric obfuscation key

/**
 * Encrypts a string using a simple symmetric XOR cipher of each character code.
 * Re-encoding to Base64 safeguards the data inside standard web localStorage.
 */
export function encryptData(rawText: string): string {
  try {
    let result = '';
    for (let i = 0; i < rawText.length; i++) {
      result += String.fromCharCode(rawText.charCodeAt(i) ^ XOR_KEY);
    }
    return btoa(result);
  } catch (error) {
    console.error('XOR encryption error:', error);
    return '';
  }
}

/**
 * Decrypts a Base64 XOR-obfuscated string back to its original raw state.
 */
export function decryptData(obfuscatedText: string): string {
  try {
    if (!obfuscatedText) return '';
    const rawBinary = atob(obfuscatedText);
    let result = '';
    for (let i = 0; i < rawBinary.length; i++) {
      result += String.fromCharCode(rawBinary.charCodeAt(i) ^ XOR_KEY);
    }
    return result;
  } catch (error) {
    console.warn('XOR decryption failed. Attempting raw JSON fallback.', error);
    return obfuscatedText; // Fallback gracefully if already stored as raw text before obfuscation
  }
}
