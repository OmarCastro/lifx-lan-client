const packetSizeInBytes = 20


export type StateHostFirmwareObject = {
  build: bigint
  //reserved: bigint
  majorVersion: number
  minorVersion: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateHostFirmwareObject;
    let offset = 0;

    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateLight LIFX packet');
    }

      // Check length
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateWifiFirmware LIFX packet');
    }

    obj.build = dataView.getBigUint64(offset, true)
    offset += 8;
    //obj.reserved = dataView.getBigUint64(offset, true)
    offset += 8;
    obj.majorVersion = dataView.getUint16(offset, true);
    offset += 2;
    obj.majorVersion = dataView.getUint16(offset, true);
    offset += 2;


    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateHostFirmwareObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;

    dataView.setBigUint64(offset, obj.build, true);
    offset += 8;
    //dataView.setBigUint64(offset, obj.reserved, true);
    offset += 8;
    dataView.setUint16(offset, obj.majorVersion, true);
    offset += 4;
    dataView.setUint16(offset, obj.minorVersion, true);
    offset += 4;

    return buf;
  }

};

export default Packet