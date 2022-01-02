const packetSizeInBytes = 6

type SetPowerObject = {
  level?: number
  duration?: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {
    const dataView = new DataView(buf.buffer)
    const obj = {} as SetPowerObject;
    let offset = 0;
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for setPower LIFX packet');
    }
  
    obj.level = dataView.getUint16(offset, true);
    offset += 2;
  
    obj.duration = dataView.getUint32(offset, true);
    offset += 4;
  
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: SetPowerObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;
  
    if (obj.level !== 0 && obj.level !== 65535) {
      throw new RangeError('Invalid level given for setPower LIFX packet, only 0 and 65535 are supported');
    }

    dataView.setUint16(offset, obj.level, true)
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
