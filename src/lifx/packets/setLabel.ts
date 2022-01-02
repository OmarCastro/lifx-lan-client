const packetSizeInBytes = 32

type SetLabelObject = {
  label: string
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {
    const obj = {} as SetLabelObject;
    let offset = 0;
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for setLabel LIFX packet');
    }

    obj.label = new TextDecoder().decode(buf.slice(offset, offset + 32))
    obj.label = obj.label.replace(/\0/g, '');
    offset += 32;
    
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: SetLabelObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const encoder = new TextEncoder()

    buf.fill(0);
    let offset = 0;

    const encodedText = encoder.encode(obj.label)
    buf.set(encodedText.slice(0, 32), offset)
    offset += 32;

    
    return buf;
  }

};

export default Packet