// deno-lint-ignore-file no-var
import {findNameFromId, findfromId, findfromNameOrId} from './packet-type-list.constants.ts'
import * as constants from './constants.ts'
import {packetMap as packets} from './packets/mod.ts'
import {uint8ArrayToHexString as toHexString, hexStringToUint8Array as fromHexString} from './utils/hex-string.util.ts'
import {appendBuffer} from './utils/array-buffer.util.ts'
import type {PacketType, PacketCreateCustomData} from './packets/mod.ts'




/*
  Package headers 36 bit in total consisting of
  size - 2 bit
  frameDescription - 2 bit

  source - 4 bit
  target - 6 bit
  00 00 -
  site - 6 bit

  frameAddressDescription - 1 bit
  sequence - 1 bit
  time - 8 bit
  type - 2 bit
  00 00
 */


type PacketHeaderObject = {
  size: number
  addressable: boolean
  tagged?: boolean
  origin: boolean
  protocolVersion: number
  source: string
  target: string
  reserved1: Uint8Array
  site: string
  ackRequired: boolean
  resRequired: boolean
  sequence: number
  time: bigint
  type: number
  reserved2: Uint8Array
}

export type PacketObject = PacketHeaderObject & {
  typeName: string
  address?: string
}


/**
 * Parses a lifx packet header
 * @param {Buffer} buf Buffer containg lifx packet including header
 * @return {Object} parsed packet header
 */
export function headerToObject (buf: Uint8Array) {

  const dataview = new DataView(buf.buffer);
  

  var obj = {} as PacketHeaderObject;
  var offset = 0;

  // Frame
  obj.size = dataview.getUint16(offset, true);
  offset += 2;

  var frameDescription = dataview.getUint16(offset, true);
  obj.addressable = (frameDescription & constants.ADDRESSABLE_BIT) !== 0;
  obj.tagged = (frameDescription & constants.TAGGED_BIT) !== 0;
  obj.origin = (frameDescription & constants.ORIGIN_BITS) >> 14 !== 0;
  obj.protocolVersion = frameDescription & constants.PROTOCOL_VERSION_BITS;
  offset += 2;

  obj.source = toHexString(buf.slice(offset, offset + 4))
  offset += 4;

  // Frame address
  obj.target = toHexString(buf.slice(offset, offset + 6))
  offset += 6;

  obj.reserved1 = buf.slice(offset, offset + 2);
  offset += 2;

  
  obj.site = new TextDecoder().decode(buf.slice(offset, offset + 6))
  obj.site = obj.site.replace(/\0/g, '');
  offset += 6;

  var frameAddressDescription = dataview.getUint8(offset);
  obj.ackRequired = (frameAddressDescription & constants.ACK_REQUIRED_BIT) !== 0;
  obj.resRequired = (frameAddressDescription & constants.RESPONSE_REQUIRED_BIT) !== 0;
  offset += 1;

  obj.sequence = dataview.getUint8(offset);
  offset += 1;

  // Protocol header
  obj.time = dataview.getBigUint64(offset, true)
  offset += 8;

  obj.type = dataview.getUint16(offset, true);
  offset += 2;

  obj.reserved2 = buf.slice(offset, offset + 2);
  offset += 2;

  return obj;
}

/**
 * Parses a lifx packet
 * @param {Buffer} buf Buffer with lifx packet
 * @return {Object} parsed packet
 */
export function toObject(buf: Uint8Array) : PacketObject | Error {
  var obj: PacketObject;

  // Try to read header of packet
  try {
    obj = {
      ...headerToObject(buf),
      typeName: "unknown"
    };
  } catch (err) {
    // If this fails return with error
    return err;
  }

  if (obj.type !== undefined) {
    const typeName = findNameFromId(obj.type);
    const packet = typeName ? packets[typeName] : null;
    
    
    if (packet != null && typeof packet.toObject === 'function') {
      const specificObj = packet.toObject(buf.slice(constants.PACKET_HEADER_SIZE));
      return {...obj, ...specificObj, typeName: typeName ?? obj.typeName};
    }
  }

  return obj

}

/**
 * Creates a lifx packet header from a given object
 * @param {Object} obj Object containg header configuration for packet
 * @return {Buffer} packet header buffer
 */
export function headerToBuffer (obj: PacketObject) {
  


  var buf = new ArrayBuffer(36);
  var uint8Buf = new Uint8Array(buf);
  uint8Buf.fill(0)
  var dataview = new DataView(buf)
  var offset = 0;

  // Frame
  dataview.setUint16(offset, obj.size, true);
  offset += 2;

  if (obj.protocolVersion === undefined) {
    obj.protocolVersion = constants.PROTOCOL_VERSION_CURRENT;
  }
  var frameDescription = obj.protocolVersion;

  if (obj.addressable !== undefined && obj.addressable === true) {
    frameDescription |= constants.ADDRESSABLE_BIT;
  } else if (obj.source !== undefined && obj.source.length > 0 && obj.source !== '00000000') {
    frameDescription |= constants.ADDRESSABLE_BIT;
  }

  if (obj.tagged !== undefined && obj.tagged === true) {
    frameDescription |= constants.TAGGED_BIT;
  }

  if (obj.origin !== undefined && obj.origin === true) {
    // 0 or 1 to the 14 bit
    frameDescription |= 1 << 14;
  }

  dataview.setUint16(offset, frameDescription, true)
  offset += 2;

  if (obj.source !== undefined && obj.source.length > 0) {
    if (obj.source.length === 8) {
      fromHexString(obj.source).forEach((byte, index) => dataview.setUint8(offset + index, byte))
    } else {
      throw new RangeError('LIFX source must be given in 8 characters');
    }
  }
  offset += 4;

  // Frame address
  if (obj.target !== undefined && obj.target !== null) {
    fromHexString(obj.target).slice(0, 6).forEach((byte, index) => dataview.setUint8(offset + index, byte))
  }
  offset += 6;

  // reserved1
  offset += 2;

  if (obj.site !== undefined && obj.site !== null) {
    fromHexString(obj.site).slice(0, 6).forEach((byte, index) => dataview.setUint8(offset + index, byte))
  }
  offset += 6;

  var frameAddressDescription = 0;
  if (obj.ackRequired !== undefined && obj.ackRequired === true) {
    frameAddressDescription |= constants.ACK_REQUIRED_BIT;
  }

  if (obj.resRequired !== undefined && obj.resRequired === true) {
    frameAddressDescription |= constants.RESPONSE_REQUIRED_BIT;
  }
  dataview.setUint8(offset, frameAddressDescription);
  offset += 1;

  if (typeof obj.sequence === 'number') {
    dataview.setUint8(offset, obj.sequence);
  }
  offset += 1;

  // Protocol header
  if (obj.time !== undefined) {
    dataview.setBigUint64(offset, obj.time, true)
  }
  offset += 8;

  if (!findfromId(obj.type)) {
    throw new Error('Unknown lifx packet of type: ' + obj.type);
  }                  
  dataview.setUint16(offset, obj.type, true);

  offset += 2;

  // reserved2
  offset += 2;

  return uint8Buf;
}


/**
 * Creates a packet from a configuration object
 * @param {Object} obj Object with configuration for packet
 * @return {Buffer|Boolean} the packet or false in case of error
 */
export function toBuffer (obj: PacketObject) {
  if (obj.type !== undefined) {
    const typeMatch = findfromId(obj.type)
    if(typeMatch){
      const packet = packets[typeMatch.name]
      if (typeof packet.toBuffer === 'function') {
        const packetTypeData = packet.toBuffer(obj);
        return new Uint8Array(appendBuffer(headerToBuffer(obj).buffer, packetTypeData))
      }
      return headerToBuffer(obj);

    }
  }

  return new Uint8Array(0);
}


/**
 * Creates a new packet by the given type
 * Note: This does not validate the given params
 * @param  {String|Number} type the type of packet to create as number or string
 * @param  {Object} params further settings to pass
 * @param  {String} [source] the source of the packet, length 8
 * @param  {String} [target] the target of the packet, length 12
 * @return {Object} The prepared packet object including header
 */

export function create <T extends PacketType>(typeEntry: T, params: PacketCreateCustomData<T>, source?: string, target?: string): PacketObject 
export function create (typeEntry: number | string, params: unknown, source?: string, target?: string) {
  const obj = {} as PacketObject;
  if (typeEntry !== undefined) {
    const typeMatch = findfromNameOrId(typeEntry)
    if(typeMatch){
      obj.type = typeMatch.id
      obj.typeName = typeMatch.name
    }
  } 
  if(!obj.type || !obj.typeName){
    return false
  }
  obj.size = constants.PACKET_HEADER_SIZE + packets[obj.typeName].size;

  if (source !== undefined) {
    obj.source = source;
  }
  if (target !== undefined) {
    obj.target = target;
  }

  if (packets[obj.typeName].tagged !== undefined) {
    obj.tagged = packets[obj.typeName].tagged;
  }

  return Object.assign(obj, params);
}
