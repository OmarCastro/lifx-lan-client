import {getHardwareDetails} from '../utils/hardwareDetails.ts'
import type {HardwareDetails} from '../utils/hardwareDetails.ts'

const packetSizeInBytes = 12


export type StateVersionObject = HardwareDetails & {
  vendorId: number
  productId: number
  version: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateVersionObject;
    let offset = 0;

    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateHostFirmware LIFX packet');
    }

    obj.vendorId = dataView.getUint32(offset, true);

    offset += 4;
  
    obj.productId = dataView.getUint32(offset, true);
    offset += 4;
  
    obj.version = dataView.getUint32(offset, true);
    offset += 4;
  
    const details = getHardwareDetails(obj.vendorId, obj.vendorId)
    if (details) {
      return {...obj, ...details};
    }

    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateVersionObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;

    dataView.setFloat32(offset, obj.vendorId, true);
    offset += 4;

    dataView.setFloat32(offset, obj.productId, true);
    offset += 4;
  
    dataView.setFloat32(offset, obj.version, true);
    offset += 4;

    return buf;
  }

};

export default Packet
