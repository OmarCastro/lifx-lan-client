import {HSBK_DEFAULT_KELVIN, RGB_MAXIMUM_VALUE} from '../constants.ts'

type RGBColor = {
    r: number;
    g: number;
    b: number;
}

type HSBColor = {
    hue: number;
    saturation: number;
    brightness: number;
}

type HSBKColor = HSBColor & {
    kelvin: number;
}

/**
 * set any val to a number by the given default
 * @param {any} val given value
 * @param {Number} def given default
 * @return {Number} the 16bit number
 */
 function to16Bitnumber(val: number, def: number) {
    if (typeof val !== 'number') {
      if (typeof def === 'number') {
        val = def;
      } else {
        val = 0;
      }
    }
    if (val < 0) {
      val = -1 * val + 0x10000;
    }
    return val & 0xffff;
  }
  


/**
 * Checks validity of color to be an HSBK Value
 * This updates HSBK to defaults
 * @param {Object} color value
 * @param {Number} color.hue value
 * @param {Number} color.saturation value
 * @param {Number} color.brightness value
 * @param {Number} color.kelvin value
 * @return {Object} HSBK value
 */
 export function toColorHsbk (color: HSBKColor) : HSBKColor {
    if (typeof color !== 'object') {
      throw new TypeError('LIFX util toColorHsbk expects colors to be an object');
    }
    return {
      hue: to16Bitnumber(color.hue, 0x8000),
      saturation: to16Bitnumber(color.saturation, 0x8000),
      brightness: to16Bitnumber(color.brightness, 0x8000),
      kelvin: to16Bitnumber(color.kelvin, HSBK_DEFAULT_KELVIN)
    };
  }
  
  /**
   * Checks validity of colors array containing HSBK
   * This updates HSBK values to defaults
   * @param {array} colors of HSBK values
   * @param {Number} size if set array has to have size
   * @return {array} colors array by the given size
   */
  export function buildColorsHsbk(colors: HSBKColor[], size?: number) {
  
    if (!Array.isArray(colors)) {
      throw new TypeError('LIFX util buildColorsHsbk expects colors to be an array');
    }
    if (typeof size !== 'number') {
      size = 0;
    }
    return new Array(size).fill(undefined).map(function (_, idx) {
      return toColorHsbk(colors[idx] || {});
    });
  }
  
  /**
   * Converts an RGB Hex string to an object with decimal representations
   * @example rgbHexStringToObject('#FF00FF')
   * @param {String} rgbHexString hex value to parse, with leading #
   * @return {Object}             object with decimal values for r, g, b
   */
   export function rgbHexStringToObject(rgbHexString: string): RGBColor {
    if (typeof rgbHexString !== 'string') {
      throw new TypeError('LIFX util rgbHexStringToObject expects first parameter to be a string');
    }
    const hashChar = rgbHexString.substring(0, 1);
    if (hashChar !== '#') {
      throw new RangeError('LIFX util rgbHexStringToObject expects hex parameter with leading \'#\' sign');
    }
    const pureHex = rgbHexString.substring(1);
    if (pureHex.length !== 6 && pureHex.length !== 3) {
      throw new RangeError('LIFX util rgbHexStringToObject expects hex value parameter to be 3 or 6 chars long');
    }
  
    let r = "";
    let g = "";
    let b = "";
  
    if (pureHex.length === 6) {
      r = pureHex.substring(0, 2);
      g = pureHex.substring(2, 4);
      b = pureHex.substring(4, 6);
    } else if (pureHex.length === 3) {
      r = pureHex.substring(0, 1);
      r += r;
      g = pureHex.substring(1, 2);
      g += g;
      b = pureHex.substring(2, 3);
      b += b;
    }
  
    return {
      r: parseInt(r, 16),
      g: parseInt(g, 16),
      b: parseInt(b, 16)
    };
  }


/**
 * Converts an object with r,g,b integer values to an
 * hsb integer object
 * @param {Object} rgbObj object with r,g,b keys and values
 * @return {Object} hsbObj object with h,s,b keys and converted values
 */
 export function rgbToHsb(rgbObj: RGBColor): HSBColor {
    const red = rgbObj.r / RGB_MAXIMUM_VALUE;
    const green = rgbObj.g / RGB_MAXIMUM_VALUE;
    const blue = rgbObj.b / RGB_MAXIMUM_VALUE;
    const rgb = [red, green, blue];
    const hsb = {} as HSBColor;
  
    const max = Math.max(...rgb)
    const min = Math.min(...rgb)
    const c = max - min;
  
    // https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma
    let hue: number;
    if (c === 0) {
      hue = 0;
    } else if (max === red) {
      hue = (green - blue) / c;
      if (hue < 0) {
        hue += 6;
      }
    } else if (max === green) {
      hue = 2 + (blue - red) / c;
    } else {
      // max === blue
      hue = 4 + (red - green) / c;
    }
    hsb.hue = Math.round(60 * hue);
  
    // https://en.wikipedia.org/wiki/HSL_and_HSV#Lightness
    const lightness = max;
    hsb.brightness = Math.round(lightness * 100);
  
    // https://en.wikipedia.org/wiki/HSL_and_HSV#Saturation
    let saturation: number;
    if (lightness === 0 || lightness === 1) {
      saturation = 0;
    } else {
      saturation = c / (1 - Math.abs(2*lightness - 1));
    }
    hsb.saturation = Math.round(saturation * 100);
  
    return hsb;
  }
  