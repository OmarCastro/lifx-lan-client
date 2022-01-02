import {HSBK_DEFAULT_KELVIN, LIGHT_WAVEFORMS} from '../constants.ts'

const packetSizeInBytes = 21


interface Color {
  hue: number
  saturation: number
  brightness: number
  kelvin: number
}

export type StateMultiZoneObject = {
  stream?: number
  isTransient: boolean
  color: Color
  period: number
  cycles: number
  skewRatio: number
  waveform: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as Required<StateMultiZoneObject>;
    let offset = 0;

    // Check length
    
  if (buf.length !== this.size) {
    throw new Error('Invalid length given for setWaveform LIFX packet');
  }

    obj.stream = dataView.getUint8(offset);
    offset += 1;
  
    obj.isTransient = dataView.getUint8(offset) !== 0;
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
  
    obj.period = dataView.getUint32(offset, true);
    offset += 4;
  
    obj.cycles = dataView.getFloat32(offset, true);
    offset += 4;
  
    obj.skewRatio = dataView.getInt16(offset, true);
    offset += 2;
  
    obj.waveform = dataView.getUint8(offset);
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

    const {isTransient, color, period, cycles, skewRatio, waveform} = obj

    
    // obj.stream field has unknown function so leave it as 0
    offset += 1;

    if (isTransient === undefined) {
      throw new TypeError('obj.isTransient value must be given for setWaveform LIFX packet');
    }
    if (typeof isTransient !== 'boolean') {
      throw new TypeError('Invalid isTransient value given for setWaveform LIFX packet, must be boolean');
    }
    dataView.setUint8(offset, isTransient ? 1 : 0);
    offset += 1;

    if (typeof color !== 'object') {
      throw new TypeError('Invalid object for color given for setWaveform LIFX packet');
    }

    const {hue, saturation, brightness} = color


    if (typeof hue !== 'number' && hue < 0 || hue > 65535) {
      throw new RangeError('Invalid color hue given for setWaveform LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, hue, true);
    offset += 2;

    if (typeof saturation !== 'number' && saturation < 0 || saturation > 65535) {
      throw new RangeError('Invalid color saturation given for setWaveform LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, saturation, true);
    offset += 2;

    if (typeof brightness !== 'number' && brightness < 0 || brightness > 65535) {
      throw new RangeError('Invalid color brightness given for setWaveform LIFX packet, must be a number between 0 and 65535');
    }
    dataView.setUint16(offset, brightness, true);
    offset += 2;

    const kelvin = obj.color.kelvin ?? HSBK_DEFAULT_KELVIN
    if (typeof kelvin !== 'number' && kelvin < 2500 || kelvin > 9000) {
      throw new RangeError('Invalid color kelvin given for setWaveform LIFX packet, must be a number between 2500 and 9000');
    }
    dataView.setUint16(offset, kelvin, true);
    offset += 2;

    if (period === undefined) {
      throw new TypeError('obj.period value must be given for setWaveform LIFX packet');
    }
    if (typeof period !== 'number') {
      throw new TypeError('Invalid period type given for setWaveform LIFX packet, must be a number');
    }
    dataView.setUint32(offset, period, true);
    offset += 4;

    if (cycles === undefined) {
      throw new TypeError('obj.cycles value must be given for setWaveform LIFX packet');
    }
    if (typeof cycles !== 'number') {
      throw new TypeError('Invalid cycles type given for setWaveform LIFX packet, must be a number');
    }
    dataView.setFloat32(offset, cycles, true);
    offset += 4;

    if (skewRatio === undefined) {
      throw new TypeError('obj.skewRatio value must be given for setWaveform LIFX packet');
    }
    if (typeof skewRatio !== 'number') {
      throw new TypeError('Invalid skewRatio type given for setWaveform LIFX packet, must be a number');
    }
    dataView.setInt16(offset, skewRatio, true);

    offset += 2;

    if (waveform === undefined) {
      throw new TypeError('obj.waveform value must be given for setWaveform LIFX packet');
    }
    if (typeof waveform !== 'number' && waveform < 0 || waveform > LIGHT_WAVEFORMS.length - 1) {
      throw new RangeError('Invalid waveform value given for setWaveform LIFX packet, must be a number between 0 and ' + (LIGHT_WAVEFORMS.length - 1));
    }

    dataView.setUint8(offset, waveform);
    offset += 1;

    return buf;
  }

};

export default Packet