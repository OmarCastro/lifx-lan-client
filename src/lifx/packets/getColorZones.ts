const packetSizeInBytes = 2

interface GetColorZonesObject {
  startIndex: number
  endIndex: number
}


export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts the given packet specific object into a packet
   */
   toBuffer(obj: GetColorZonesObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)


    buf.fill(0);
    let offset = 0;

    if (typeof obj.startIndex !== 'number' && obj.startIndex < 0 || obj.startIndex > 255) {
      throw new RangeError('Invalid startIndex value given for setColorZones LIFX packet, must be a number between 0 and 255');
    }
    dataView.setUint8(offset, obj.startIndex)
    offset += 1;
  
    if (typeof obj.endIndex !== 'number' && obj.endIndex < 0 || obj.endIndex > 255) {
      throw new RangeError('Invalid endIndex value given for setColorZones LIFX packet, must be a number between 0 and 255');
    }
    dataView.setUint8(offset, obj.endIndex)
    offset += 1;

    return buf;
  }
};

export default Packet;
