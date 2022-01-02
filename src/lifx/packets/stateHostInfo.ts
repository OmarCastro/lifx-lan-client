const packetSizeInBytes = 14


export type StateHostInfoObject = {
  signal: number
  tx: number
  rx: number
  mcuTemperature: number
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateHostInfoObject;
    let offset = 0;

    // Check length
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateWifiInfo LIFX packet');
    }

    obj.signal = dataView.getFloat32(offset, true);
    offset += 4;
  
    obj.tx = dataView.getUint32(offset, true);
    offset += 4;
  
    obj.rx = dataView.getUint32(offset, true);
    offset += 4;
  
    obj.mcuTemperature = dataView.getUint16(offset, true);
    offset += 2;
  



    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateHostInfoObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)

    buf.fill(0);
    let offset = 0;

    dataView.setFloat32(offset, obj.signal, true);
    offset += 4;
  
    dataView.setUint32(offset, obj.tx, true);
    offset += 4;
  
    dataView.setUint32(offset, obj.rx, true);
    offset += 4;
  
    dataView.setUint16(offset, obj.mcuTemperature, true);
    offset += 2;
  

    return buf;
  }

};

export default Packet