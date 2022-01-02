const packetSizeInBytes = 64

interface EchoRequestObject {
  payload?: string
}


export const Packet = {
  size: packetSizeInBytes,

 /**
  * Converts packet specific data from a buffer to an object
  */
  toObject (buf: Uint8Array) {
    const obj = {} as EchoRequestObject;
    let offset = 0;
  
    // Check length
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for echoRequest LIFX packet');
    }

    obj.payload = new TextDecoder().decode(buf.slice(offset, offset + packetSizeInBytes))
    offset += packetSizeInBytes;
  
    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   * This packet expects payload field of max. length 64 utf8
   */
  toBuffer(obj: EchoRequestObject) {
    const buf = new Uint8Array(packetSizeInBytes)

    buf.fill(0);
    let offset = 0;

    buf.set(new TextEncoder().encode(obj.payload), offset)
    offset += 64;
    return buf;
  }

};

export default Packet