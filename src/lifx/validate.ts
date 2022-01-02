// @ts-nocheck - here we are making runtime checks so static type checking are not needed
import * as constants from "./constants.ts";

const errorMessage = generateErrorMessages();

type ErrorThrowCallback = (errorMessage, ...params) => void;

type ValidateRangeResult = {
  throwOnError: ErrorThrowCallback;
};

type ValidateNumberResult = {
  onRange: (min: number, max: number) => ValidateRangeResult;
  throwOnError: ErrorThrowCallback;
};

const validateNumber = (() => {
  function validateRange(variable, min, max) {
    const result = {} as ValidateRangeResult;
    if (variable < min || variable > max) {
      result.throwOnError = (errorMessage, ...params) =>
        throwRangeError(errorMessage(...params));
    } else {
      result.throwOnError = () => { };
    }
    return result;
  }

  return (variable) => {
    const result = {} as ValidateNumberResult;
    if (typeof variable !== "number") {
      result.onRange = () => result;
      result.throwOnError = (errorMessage, ...params) =>
        throwTypeError(errorMessage(...params));
    } else {
      result.onRange = (min, max) => validateRange(variable, min, max);
      result.throwOnError = () => { };
    }
    return result;
  };
})();

/**
 * Checks validity of given color hue, saturation and brightness values
 * @param {any} hue value to validate
 * @param {any} saturation value to validate
 * @param {any} brightness brightness value to validate
 * @param {String} context validation context
 */
export function colorHsb(hue, saturation, brightness, context) {
  validateNumber(hue).onRange(constants.HSBK_MINIMUM_HUE, constants.HSBK_MAXIMUM_HUE).throwOnError(errorMessage.hue, context);
  validateNumber(saturation).onRange(constants.HSBK_MINIMUM_SATURATION,constants.HSBK_MAXIMUM_SATURATION).throwOnError(errorMessage.saturation, context);
  validateNumber(brightness).onRange(constants.HSBK_MINIMUM_BRIGHTNESS,constants.HSBK_MAXIMUM_BRIGHTNESS).throwOnError(errorMessage.brightness, context);
}

/**
 * Checks validity of color RGB values
 * @param {any} red Red value to validate
 * @param {any} green Green value to validate
 * @param {any} blue Blue value to validate
 * @param {String} context validation context
 */
export function colorRgb(red, green, blue, context) {
  const { RGB_MINIMUM_VALUE, RGB_MAXIMUM_VALUE } = constants;
  validateNumber(red).onRange(RGB_MINIMUM_VALUE, RGB_MAXIMUM_VALUE).throwOnError(errorMessage.red, context);
  validateNumber(green).onRange(RGB_MINIMUM_VALUE, RGB_MAXIMUM_VALUE).throwOnError(errorMessage.green, context);
  validateNumber(blue).onRange(RGB_MINIMUM_VALUE, RGB_MAXIMUM_VALUE).throwOnError(errorMessage.blue, context);
}

/**
 * Checks validity of IR brightness
 * @param {any} brightness IR brightness to validate
 * @param {String} context validation context
 */
export function irBrightness(brightness, context) {
  validateNumber(brightness).onRange(constants.IR_MINIMUM_BRIGHTNESS,constants.IR_MAXIMUM_BRIGHTNESS).throwOnError(errorMessage.irBrightness, context);
}

/**
 * Checks validity of an optional kelvin value
 * @param {any} kelvin Kelvin value to validate
 * @param {String} context validation context
 */
export function optionalKelvin(kelvin, context) {
  if (kelvin !== undefined) {
    validateNumber(kelvin).onRange(constants.HSBK_MINIMUM_KELVIN, constants.HSBK_MAXIMUM_KELVIN).throwOnError(errorMessage.kelvin, context);
  }
}

/**
 * Checks validity of an optional transition time
 * @param {any} duration Transition time to validate
 * @param {String} context validation context
 */
export function optionalDuration(duration, context) {
  if (duration !== undefined && typeof duration !== "number") {
    throwTypeError(`LIFX ${context} expects duration to be a number`);
  }
}

/**
 * Checks validity of a callback function
 * @param {any} callback Callback to validate
 * @param {String} context validation context
 */
export function callback(callback, context) {
  if (typeof callback !== "function") {
    throwTypeError(`LIFX ${context} expects callback to be a function`);
  }
}

/**
 * Checks validity of an optional callback function
 * @param {any} callback Callback to validate
 * @param {String} context validation context
 */
export function optionalCallback(callback, context) {
  if (callback !== undefined && typeof callback !== "function") {
    throwTypeError(`LIFX ${context} expects callback to be a function`);
  }
}

/**
 * Checks validity of an optional boolean
 * @param {any} value value to validate
 * @param {any} parameter validated parameter name
 * @param {String} context validation context
 */
export function optionalBoolean(value, parameter, context) {
  if (value !== undefined && typeof value !== "boolean") {
    throwTypeError(`LIFX ${context} expects "${parameter}" to be a boolean`);
  }
}

/**
 * Checks validity of an optional number
 * @param {any} value value to validate
 * @param {any} parameter validated parameter name
 * @param {String} context validation context
 */
export function optionalNumber(value, parameter, context) {
  if (value !== undefined && typeof value !== "number") {
    throwTypeError(`LIFX ${context} expects "${parameter}" to be a number`);
  }
}

/**
 * Checks validity of an waveform id
 * @param {any} value value to validate
 * @param {String} context validation context
 */
export function optionalWaveform(value, context) {
  if (value !== undefined && typeof value !== "number") {
    throwTypeError(`LIFX ${context} expects "waveform" to be a number`);
  }
  if (value !== undefined) {
    if (value < 0) {
      throwTypeError(`LIFX ${context} expects "waveform" to be >= 0`);
    }
    if (value > 4) {
      throwTypeError(`LIFX ${context} expects "waveform" to be <= 4`);
    }
  }
}

/**
 * Checks validity of a light zone index
 * @param {any} index Light zone index to validate
 * @param {String} context validation context
 */
export function zoneIndex(index, context) {
  validateNumber(index).onRange(constants.ZONE_INDEX_MINIMUM_VALUE,constants.ZONE_INDEX_MAXIMUM_VALUE).throwOnError(errorMessage.zone, context);
}

/**
 * Checks validity of an optional light zone index
 * @param {any} index Light zone index to validate
 * @param {String} context validation context
 * @return {Boolean} const true or an exception
 */
export function optionalZoneIndex(index, context) {
  if (index !== undefined) {
    validateNumber(index).onRange(constants.ZONE_INDEX_MINIMUM_VALUE,constants.ZONE_INDEX_MAXIMUM_VALUE).throwOnError(errorMessage.zone, context);
  }
  return true;
}

/**
 * test if the given value is an uint value
 * @param {Number} val the given uint value as number
 * @param {String} context the string for the error message
 * @param {Number} range the range of the uint value
 * @return {Boolean} const true or an exception
 */
export function isUIntRange(val, context, range) {
  validateNumber(val).onRange(0, range).throwOnError(() =>
    `LIFX ${context} expects "${val}" to be a number between 0 and ${range}`
  );
  return true;
}

/**
 * test if the given value is an uint8 value
 * @param {Number} val the given uint8 value as number
 * @param {String} context the string for the error message
 * @return {Boolean} const true or an exception
 */
export function isUInt8(val, context) {
  return isUIntRange(val, context, 0xff);
}

/**
 * test if the given value is an uint16 value
 * @param {Number} val the given uint16 value as number
 * @param {String} context the string for the error message
 * @return {Boolean} const true or an exception
 */
export function isUInt16(val, context) {
  return isUIntRange(val, context, 0xffff);
}

/**
 * test if the given value is an uint32 value
 * @param {Number} val the given uint32 value as number
 * @param {String} context the string for the error message
 * @return {Boolean} const true or an exception
 */
export function isUInt32(val, context) {
  return isUIntRange(val, context, 0xffffffff);
}

/**
 * Formats error message and throws a TypeError
 * @param {String} message Error message
 * @param {String} context Validation context
 * @param {String} [parameter] Validated parameter name
 */
function throwTypeError(message) {
  throw new TypeError(message);
}

/**
 * Formats the error message and throws a RangeError
 * @param {String} message Error message
 * @param {String} context Validation context
 * @param {String} [parameter] Validated parameter name
 */
function throwRangeError(message) {
  throw new RangeError(message);
}

function generateErrorMessages() {
  const {
    HSBK_MINIMUM_HUE,
    HSBK_MAXIMUM_HUE,
    HSBK_MINIMUM_SATURATION,
    HSBK_MAXIMUM_SATURATION,
    HSBK_MINIMUM_BRIGHTNESS,
    HSBK_MAXIMUM_BRIGHTNESS,
    RGB_MINIMUM_VALUE,
    RGB_MAXIMUM_VALUE,
    IR_MINIMUM_BRIGHTNESS,
    IR_MAXIMUM_BRIGHTNESS,
    HSBK_MINIMUM_KELVIN,
    HSBK_MAXIMUM_KELVIN,
    ZONE_INDEX_MINIMUM_VALUE,
    ZONE_INDEX_MAXIMUM_VALUE,
  } = constants;

  return {
    hue: (context) => `LIFX ${context} expects hue to be a number between ${HSBK_MINIMUM_HUE} and ${HSBK_MAXIMUM_HUE}`,
    saturation: (context) => `LIFX ${context} expects saturation to be a number between ${HSBK_MINIMUM_SATURATION} and ${HSBK_MAXIMUM_SATURATION}`,
    brightness: (context) => `LIFX ${context} expects brightness to be a number between ${HSBK_MINIMUM_BRIGHTNESS} and ${HSBK_MAXIMUM_BRIGHTNESS}`,

    red: (context) => `LIFX ${context} expects first parameter red to be a number between ${RGB_MINIMUM_VALUE} and ${RGB_MAXIMUM_VALUE}`,
    green: (context) => `LIFX ${context} expects second parameter green to be a number between ${RGB_MINIMUM_VALUE} and ${RGB_MAXIMUM_VALUE}`,
    blue: (context) => `LIFX ${context} expects third parameter blue to be a number between ${RGB_MINIMUM_VALUE} and ${RGB_MAXIMUM_VALUE}`,

    irBrightness: (context) => `LIFX ${context} expects IR brightness to be a number between ${IR_MINIMUM_BRIGHTNESS} and ${IR_MAXIMUM_BRIGHTNESS}`,
    kelvin: (context) => `LIFX ${context} expects kelvin to be a number between ${HSBK_MINIMUM_KELVIN} and ${HSBK_MAXIMUM_KELVIN}`,

    zone: (context) => `LIFX ${context} expects zone to be a number between ${ZONE_INDEX_MINIMUM_VALUE} and ${ZONE_INDEX_MAXIMUM_VALUE}`,
  };
}
