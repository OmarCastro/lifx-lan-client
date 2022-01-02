const packetSizeInBytes = 24


export type StateInfoObject = {
  time: bigint
  uptime: bigint
  downtime: bigint
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateInfoObject;
    let offset = 0;

    // Check length
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateInfo LIFX packet');
    }

    obj.time = dataView.getBigUint64(offset, true);
    offset += 8;
  
    obj.uptime = dataView.getBigUint64(offset, true);
    offset += 8;
  
    obj.downtime = dataView.getBigUint64(offset, true);
    offset += 8;

    return obj;
  }
}

export default Packet