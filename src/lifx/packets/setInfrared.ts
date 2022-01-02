const packetSizeInBytes = 2

type SetInfraredObject = {
  brightness?: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {
    const dataView = new DataView(buf.buffer)
    const obj = {} as SetInfraredObject;
    let offset = 0;
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for setInfrared LIFX packet');
    }
  
    obj.brightness = dataView.getUint16(offset, true);
    offset += 2;
    
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: SetInfraredObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;
  
    if (obj.brightness !== 0 && obj.brightness !== 65535) {
      throw new RangeError('Invalid brightness given for setInfrared LIFX packet, must be a number between 0 and 65535');
    }

    dataView.setUint16(offset, obj.brightness, true)
    offset += 2;
    
    return buf;
  }

};

export default Packet