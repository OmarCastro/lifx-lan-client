'use strict';

const packetSizeInBytes = 2

interface StatePowerObject {
  level: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
 * Converts packet specific data from a buffer to an object
 * @param  {Uint8Array} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
  toObject(buf: Uint8Array) {
    const obj = {} as StatePowerObject;
    let offset = 0;

    if (buf.length !== this.size) {
      throw new Error('Invalid length given for statePower LIFX packet');
    }

    obj.level = new DataView(buf.buffer).getUint16(offset, true)
    offset += 2;

    return obj;
  },

  toBuffer(obj: StatePowerObject) {
    const buf = new Uint8Array(packetSizeInBytes)

    buf.fill(0);
    let offset = 0;
  
    new DataView(buf.buffer).setUint16(offset, obj.level, true)
    offset += 2;
  
    return buf;
  }
};

export default Packet