/**
 * Generates a random hex string of the given length
 * @example
 * // returns something like 8AF1
 * generateRandomHexString(4) 
 * @example
 * // returns something like 0D41C8AF
 * generateRandomHexString()
 * @param  {Number} [length=8] string length to generate
 * @return {String}            random hex string
 */
export function generateRandomHexString (length = 8) {  
    var string = '';
    var chars = '0123456789ABCDEF';
  
    for (let i = 0; i < length; i++) {
      const randomNumber = Math.floor(Math.random() * chars.length);
      string += chars.substring(randomNumber, randomNumber + 1);
    }
  
    return string;
  }

/**
 * Converts a Uint8Array to hex string
 * @param  {Uint8Array} uint8Array target Uint8Array
 * @return {String} corresponding hex string of target array
 */
export const uint8ArrayToHexString = (uint8Array: Uint8Array) => uint8Array.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

// Used specifically for hexStringToUint8Array function
const hexStringToUint8ArrayRegex = /.{1,2}/g

/**
 * Converts an hex string to Uint8Array
 * @param  {String} hexString target hex string
 * @return {Uint8Array} corresponding Uint8Array of target string
 */
export const hexStringToUint8Array = (hexString: string) => {
  const match = hexString.match(hexStringToUint8ArrayRegex)
  return match ? new Uint8Array(match.map(byte => parseInt(byte, 16))) : new Uint8Array()
}