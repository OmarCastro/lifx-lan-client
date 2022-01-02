import {HSBK_DEFAULT_KELVIN} from '../constants.ts'

const packetSizeInBytes = 13


interface Color {
  hue: number
  saturation: number
  brightness: number
  kelvin: number
}

interface SetColorObject {
  stream?: number
  duration?: number
}

type SetColorToBuffer = SetColorObject & Omit<Color, "kelvin"> & {
  kelvin?: number
}

interface SetColorFromObject extends SetColorObject{
  color?: Color
}

export const Packet = {
  size: packetSizeInBytes,


 /**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
  toObject(buf: Uint8Array) {
    const dataView = new DataView(buf.buffer)

    const obj = {} as SetColorFromObject;
    let offset = 0;
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for setColor LIFX packet');
    }
  
    obj.stream = dataView.getUint8(offset);
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
  
    return obj;
  },


/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {Object} obj.color an objects with colors to set
 * @param  {Number} obj.color.hue between 0 and 65535
 * @param  {Number} obj.color.saturation between 0 and 65535
 * @param  {Number} obj.color.brightness between 0 and 65535
 * @param  {Number} obj.color.kelvin between 2500 and 9000
 * @param  {Number} [obj.duration] transition time in milliseconds
 * @return {Buffer} packet
 */
toBuffer(obj: SetColorToBuffer) {
  const buf = new Uint8Array(packetSizeInBytes)
  const dataView = new DataView(buf.buffer)

  buf.fill(0);
  let offset = 0;

  // obj.stream field has unknown function so leave it as 0
  offset += 1;

  if (typeof obj.hue !== 'number' && obj.hue < 0 || obj.hue > 65535) {
    throw new RangeError('Invalid color hue given for setColor LIFX packet, must be a number between 0 and 65535');
  }

  dataView.setUint16(offset, obj.hue, true)
  offset += 2;

  if (typeof obj.saturation !== 'number' && obj.saturation < 0 || obj.saturation > 65535) {
    throw new RangeError('Invalid color saturation given for setColor LIFX packet, must be a number between 0 and 65535');
  }
  dataView.setUint16(offset, obj.saturation, true)
  offset += 2;

  if (typeof obj.brightness !== 'number' && obj.brightness < 0 || obj.brightness > 65535) {
    throw new RangeError('Invalid color brightness given for setColor LIFX packet, must be a number between 0 and 65535');
  }
  dataView.setUint16(offset, obj.brightness, true)
  offset += 2;

  if (obj.kelvin === undefined) {
    obj.kelvin = HSBK_DEFAULT_KELVIN;
  }
  if (typeof obj.kelvin !== 'number' && obj.kelvin < 2500 || obj.kelvin > 9000) {
    throw new RangeError('Invalid color kelvin given for setColor LIFX packet, must be a number between 2500 and 9000');
  }
  dataView.setUint16(offset, obj.kelvin, true)
  offset += 2;

  // Duration is 0 by default
  if (obj.duration !== undefined) {
    dataView.setUint32(offset, obj.duration, true)
  }
  offset += 4;

  return buf;
}

};


export default Packet