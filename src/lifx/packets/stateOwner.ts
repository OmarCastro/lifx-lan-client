import {uint8ArrayToHexString, hexStringToUint8Array} from '../utils/hex-string.util.ts'

const packetSizeInBytes = 56

type StateOwnerObject = {
  owner: string
  label: string
  updatedAt: bigint
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateOwnerObject;
    let offset = 0;
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateLocation LIFX packet');
    }

    obj.owner = uint8ArrayToHexString(buf.slice(offset, offset + 16))
    offset += 16;
  
    obj.label = new TextDecoder().decode(buf.slice(offset, offset + 32))
    obj.label = obj.label.replace(/\0/g, '');
    offset += 32;

    obj.updatedAt = dataView.getBigUint64(offset, true);
    offset += 8;
      
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateOwnerObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)
    const encoder = new TextEncoder()

    buf.fill(0);
    let offset = 0;

    buf.set(hexStringToUint8Array(obj.owner).slice(0, 16), offset)
    offset += 16;

    const encodedText = encoder.encode(obj.label)
    buf.set(encodedText.slice(0, 32), offset)
    offset += 32;
      
    dataView.setBigUint64(offset, obj.updatedAt, true);
    offset += 8;

    return buf;
  }

};

export default Packet