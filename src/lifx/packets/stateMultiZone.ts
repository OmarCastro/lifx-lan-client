import {HSBK_DEFAULT_KELVIN} from '../constants.ts'

const packetSizeInBytes = 50


interface Color {
  hue: number
  saturation: number
  brightness: number
  kelvin: number
}

export type StateMultiZoneObject = {
  count: number
  index: number
  colors: Color[]
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateMultiZoneObject;
    let offset = 0;

    // Check length
    if (buf.length < 10) {
      throw new Error('Invalid length for stateMultiZone LIFX packet, expected minimum 10 but received ' + buf.length);
    }

    obj.count = dataView.getUint8(offset);
    offset += 1;
  
    obj.index = dataView.getUint8(offset);
    offset += 1;
  
    obj.colors = [];
    while (buf.length - offset >= 8) {
      const colorObj = {} as Color;
      colorObj.hue = dataView.getUint16(offset, true);
      offset += 2;
      colorObj.saturation = dataView.getUint16(offset, true);
      offset += 2;
      colorObj.brightness = dataView.getUint16(offset, true);
      offset += 2;
      colorObj.kelvin = dataView.getUint16(offset, true);
      offset += 2;
      obj.colors.push(colorObj);
    }
  
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateMultiZoneObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;

    const {count, index, colors} = obj


    if (typeof count !== 'number' && count < 0 || count > 255) {
      throw new RangeError('Invalid count value given for stateZone LIFX packet, must be a number between 0 and 255');
    }

    dataView.setUint8(offset, count);
    offset += 1;
  
    if (typeof index !== 'number' && index < 0 || index > 255) {
      throw new RangeError('Invalid index value given for stateZone LIFX packet, must be a number between 0 and 255');
    }
    dataView.setUint8(offset, index);
    offset += 1;


    if (!Array.isArray(colors)) {
      throw new TypeError('Invalid color value given for stateMultiZone LIFX packet, must be an array');
    }
    if (colors.length < 1 || colors.length > 8) {
      throw new RangeError('Invalid color value given for stateMultiZone LIFX packet, must be an array of 1 to 8 objects');
    }
  

    colors.forEach(function (colorObj, index) {
      if (colorObj === null || typeof colorObj !== 'object') {
        throw new TypeError('Invalid HSBK color value at index ' + index + ', must be a HSBK color object');
      }

      const {hue, saturation, brightness} = colorObj

      if (typeof hue !== 'number' && hue < 0 || hue > 65535) {
        throw new RangeError('Invalid color hue given at index ' + index + ', must be a number between 0 and 65535');
      }


      dataView.setUint16(offset, hue, true);
      offset += 2;
  
      if (typeof saturation !== 'number' && saturation < 0 || saturation > 65535) {
        throw new RangeError('Invalid color saturation given at index ' + index + ', must be a number between 0 and 65535');
      }
      dataView.setUint16(offset, saturation, true);
      offset += 2;
  
      if (typeof brightness !== 'number' && brightness < 0 || brightness > 65535) {
        throw new RangeError('Invalid color brightness given at index ' + index + ', must be a number between 0 and 65535');
      }
      dataView.setUint16(offset, brightness, true);
      offset += 2;
  
      const kelvin = colorObj.kelvin ?? HSBK_DEFAULT_KELVIN
      if (typeof kelvin !== 'number' && kelvin < 2500 || kelvin > 9000) {
        throw new RangeError('Invalid color kelvin given at index ' + index + ', must be a number between 2500 and 9000');
      }
      dataView.setUint16(offset, kelvin, true);
      offset += 2;
    });

    return buf;
  }

};

export default Packet