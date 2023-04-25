const packetSizeInBytes = 9

type StateCountZoneObject = {
  time: bigint
  count: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateCountZoneObject;
    let offset = 0;
  
    if (buf.length !== packetSizeInBytes) {
      throw new Error('Invalid length given for stateCountZone LIFX packet');
    }

    obj.time = dataView.getBigUint64( offset);
    offset += 8;
  
    obj.count = dataView.getUint8(offset);
    offset += 1;
    
    return obj;
  },

};

export default Packet

