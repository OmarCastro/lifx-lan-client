const packetSizeInBytes = 5

interface StateServiceObject {
  service: number
  serviceName: string
  port: number
}

  
/*
  Map service to a value
  -------------
  UDP -> 1
  reserved -> 2
  reserved -> 3
  reserved -> 4
*/
function getServiceName(serviceNumber: number){
  switch(serviceNumber){
    case 1: return 'udp';
    case 2:
    case 3:
    case 4: return 'reserved';
    default: return 'unknown';
  }
}

export const Packet = {
  size: packetSizeInBytes,

  /**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
  toObject(buf: Uint8Array): StateServiceObject {
    let offset = 0;

    const dataview = new DataView(buf.buffer)
  
    if (buf.length !== this.size) {
      throw new Error('Invalid length given for stateService LIFX packet');
    }
  
    const service = dataview.getUint8(offset);
    offset += 1;
    const port = dataview.getUint32(offset, true);
    offset += 4;

    const serviceName = getServiceName(service)  
    return { service, port, serviceName };
  },


/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @return {Uint8Array}     packet
 */
  toBuffer (obj: StateServiceObject) {
    const buf = new Uint8Array(packetSizeInBytes)
    buf.fill(0);

    const dataview = new DataView(buf.buffer)

    let offset = 0;
  
    dataview.setUint8(obj.service, offset);
    offset += 1;
  
    dataview.setUint32(obj.port, offset, true);
    offset += 4;
  
    return buf;
  }
};

export default Packet