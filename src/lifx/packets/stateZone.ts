import {HSBK_DEFAULT_KELVIN} from '../constants.ts'

const packetSizeInBytes = 10


interface Color {
  hue: number
  saturation: number
  brightness: number
  kelvin: number
}

export type StateZoneObject = {
  count: number
  index: number
  color: Color
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateZoneObject;
    let offset = 0;

    // Check length
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateZone LIFX packet');
    }

    obj.count = dataView.getUint8(offset);
    offset += 1;
  
    obj.index = dataView.getUint8(offset);
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


    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateZoneObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;

    const {count, index, color} = obj


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

    const {hue, saturation, brightness} = color
  
    if (typeof hue !== 'number' && hue < 0 || hue > 65535) {
      throw new RangeError('Invalid color hue given for stateZone LIFX packet, must be a number between 0 and 65535');
    }

    dataView.setUint16(offset, hue, true);
    offset += 2;
  
    if (typeof saturation !== 'number' && saturation < 0 || saturation > 65535) {
      throw new RangeError('Invalid color saturation given for stateZone LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, saturation, true);
    offset += 2;
  
    if (typeof brightness !== 'number' && brightness < 0 || brightness > 65535) {
      throw new RangeError('Invalid color brightness given for stateZone LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, brightness, true);
    offset += 2;
  
    const kelvin = color.kelvin ?? HSBK_DEFAULT_KELVIN
    if (typeof kelvin !== 'number' && kelvin < 2500 || kelvin > 9000) {
      throw new RangeError('Invalid color kelvin given for stateZone LIFX packet, must be a number between 2500 and 9000');
    }
    dataView.setUint16(offset, kelvin, true);
    offset += 2;
    

    return buf;
  }

};

export default Packet


'use strict';
