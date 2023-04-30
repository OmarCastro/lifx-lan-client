const packetSizeInBytes = 1

interface GetCountZonesObject {
  scan: boolean
}


export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts the given packet specific object into a packet
   */
   toBuffer(obj: GetCountZonesObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)


    buf.fill(0);
    let offset = 0;

    if (obj.scan === undefined) {
      throw new TypeError('obj.scan value must be given for getCountZones LIFX packet');
    }
    if (typeof obj.scan !== 'boolean') {
      throw new TypeError('Invalid scan value given for getCountZones LIFX packet, must be boolean');
    }

    dataView.setUint8(offset, (obj.scan as never) | 0)
    offset += 1
  

    return buf;
  }
};

export default Packet;
