const packetSizeInBytes = 4

type StateAmbientObject = {
  flux: number
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
      throw new Error('Invalid length given for stateAmbientLight LIFX packet');
    }
  
    obj.flux = dataView.getFloat32(offset, true);
    offset += 4;
    
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
  
    dataView.setFloat32(offset, obj.flux, true);
    offset += 4;
    
    return buf;
  }

};

export default Packet

