const packetSizeInBytes = 52

interface Color {
  hue: number
  saturation: number
  brightness: number
  kelvin: number
}


export type StateLightObject = {
  color: Color
  dim: number
  power: number
  label: string
  tags: bigint
}

export const Packet = {
  size: packetSizeInBytes,

  /**
   * Converts packet specific data from a buffer to an object
   */
  toObject (buf: Uint8Array) {    
    const dataView = new DataView(buf.buffer)
    const obj = {} as StateLightObject;
    let offset = 0;

    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateLight LIFX packet');
    }
  
    obj.color = {} as Color;
    obj.color.hue = dataView.getUint16(offset, true)
    offset += 2;
    obj.color.saturation = dataView.getUint16(offset, true)
    offset += 2;
    obj.color.brightness = dataView.getUint16(offset, true)
    offset += 2;
    obj.color.kelvin = dataView.getUint16(offset, true)
    offset += 2;
  
    obj.dim = dataView.getUint16(offset, true)
    offset += 2;
  
    obj.power = dataView.getUint16(offset, true)
    offset += 2;
  
    obj.label = new TextDecoder().decode(buf.slice(offset, offset + 32))
    obj.label = obj.label.replace(/\0/g, '');
    offset += 32;
  
    obj.tags = dataView.getBigUint64(offset, true);
    offset += 8;

    return obj;
  },

  /**
   * Converts the given packet specific object into a packet
   */
  toBuffer(obj: StateLightObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    const dataView = new DataView(buf.buffer)
    const encoder = new TextEncoder()

    buf.fill(0);
    let offset = 0;

    dataView.setUint16(offset, obj.color.hue, true);
    offset += 2;
    dataView.setUint16(offset, obj.color.saturation, true);
    offset += 2;
    dataView.setUint16(offset, obj.color.brightness, true);
    offset += 2;
    dataView.setUint16(offset, obj.color.kelvin, true);
    offset += 2;
  
    dataView.setUint16(offset, obj.dim, true);
    offset += 2;
  
    dataView.setUint16(offset, obj.power, true);
    offset += 2;
  
    const encodedText = encoder.encode(obj.label)
    buf.set(encodedText.slice(0, 32), offset)
    offset += 32;
  
    dataView.setBigUint64(offset, obj.tags, true);
    offset += 8;      
    return buf;
  }

};

export default Packet