const packetSizeInBytes = 2

type StateAmbientObject = {
  brightness: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateAmbientObject;
    let offset = 0;
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateInfrared LIFX packet');
    }
  
    obj.brightness = dataView.getUint16(offset, true);
    offset += 2;
    
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateAmbientObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;
  
    dataView.setUint16(offset, obj.brightness, true);
    offset += 2;
    
    return buf;
  }

};

export default Packet