import {HSBK_DEFAULT_KELVIN} from '../constants.ts'

const packetSizeInBytes = 15


interface Color {
  hue: number
  saturation: number
  brightness: number
  kelvin: number
}

export type StateMultiZoneObject = {
  startIndex: number
  endIndex: number
  color: Color
  duration?: number
  apply: number
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
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for setColorZones LIFX packet');
    }

    obj.startIndex = dataView.getUint8(offset);
    offset += 1;

    obj.endIndex = dataView.getUint8(offset);
    offset += 1;

    obj.color = {} as Color;
    obj.color.hue = dataView.getUint16(offset, true);
    offset += 2;
    obj.color.saturation = dataView.getUint16(offset, true);
    offset += 2;
    obj.color.brightness = dataView.getUint16(offset, true);
    offset += 2;
    obj.color.kelvin = dataView.getUint16(offset, true);
    offset += 2;

    obj.duration = dataView.getUint32(offset, true);
    offset += 4;

    obj.apply = dataView.getUint8(offset);
    offset += 1;
  
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

    const {startIndex, endIndex, color, duration, apply} = obj

    if (typeof startIndex !== 'number' && startIndex < 0 || startIndex > 255) {
      throw new RangeError('Invalid startIndex value given for setColorZones LIFX packet, must be a number between 0 and 255');
    }
    dataView.setUint8(offset, startIndex);
    offset += 1;
  
    if (typeof endIndex !== 'number' && endIndex < 0 || endIndex > 255) {
      throw new RangeError('Invalid endIndex value given for setColorZones LIFX packet, must be a number between 0 and 255');
    }
    dataView.setUint8(offset, endIndex);
    offset += 1;
  

    const {hue, saturation, brightness} = color


    if (typeof hue !== 'number' || hue < 0 || hue > 65535) {
      throw new RangeError('Invalid color hue given for setColorZones LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, hue, true);
    offset += 2;
  
    if (typeof saturation !== 'number' || saturation < 0 || saturation > 65535) {
      throw new RangeError('Invalid color saturation given for setColorZones LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, saturation, true);
    offset += 2;
  
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 65535) {
      throw new RangeError('Invalid color brightness given for setColorZones LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, brightness, true);
    offset += 2;
  

    const kelvin = color.kelvin ?? HSBK_DEFAULT_KELVIN

    if (typeof kelvin !== 'number' && kelvin < 2500 || kelvin > 9000) {
      throw new RangeError('Invalid color kelvin given for setColorZones LIFX packet, must be a number between 2500 and 9000');
    }
    dataView.setUint16(offset, kelvin, true);
    offset += 2;
  
    // Duration is 0 by default
    if (duration !== undefined) {
      dataView.setUint32(offset, duration, true);
    }
    offset += 4;
  
    if (obj.apply === undefined) {
      throw new TypeError('obj.apply value must be given for setColorZones LIFX packet');
    }
    if (typeof apply !== 'number' && apply < 0 || apply > 2) {
      throw new RangeError('Invalid apply value given for setColorZones LIFX packet, must be a number between 0 and 2');
    }
    dataView.setUint8(offset, apply);
    offset += 1;
  

    return buf;
  }

};

export default Packet
