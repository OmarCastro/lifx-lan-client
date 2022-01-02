import * as validate from './validate.ts'
import * as packet from './packet.ts'
import {Client, MessageHandlerCallback} from './client.ts'
import { rgbToHsb, rgbHexStringToObject } from './utils/colors.ts'
import {HSBK_MAXIMUM_HUE, HSBK_MAXIMUM_SATURATION, HSBK_MAXIMUM_BRIGHTNESS, APPLICATION_REQUEST_VALUES, HSBK_DEFAULT_KELVIN, IR_MAXIMUM_BRIGHTNESS} from './constants.ts'
import type { StateWifiFirmwareObject } from './packets/stateWifiFirmware.ts'
import type { StateHostFirmwareObject } from './packets/stateHostFirmware.ts'
import type { StateWifiInfoObject } from './packets/stateWifiInfo.ts'
import type { StateMultiZoneObject } from './packets/stateMultiZone.ts'
import type { StateVersionObject } from './packets/stateVersion.ts'
import type { StateLightObject } from './packets/stateLight.ts'

interface LightData {
  client: Client
  id: string
  address: string
  port: number
  label: string | null
  status: 'on' | 'off'
  seenOnDiscovery: number
}

interface LightDataWithApi extends LightData {
  lightApi: Light
}

interface LightDataConstructor extends LightDataWithApi {
  new(data: LightDataConstrFields):LightDataWithApi
  (data: LightDataConstrFields):LightDataWithApi
}

type LightDataConstrFields = Partial<LightData> & Pick<LightData, 'address'|'client'|'id'|'seenOnDiscovery'|'port'> 

export const LightData = function(this: LightDataConstructor | void, constr: LightDataConstrFields) {
  if(!(this instanceof LightData)){
    return new LightData(constr)
  }
  this!.client = constr.client
  this!.id = constr.id
  this!.address = constr.address
  this!.seenOnDiscovery = constr.seenOnDiscovery
  this!.port = constr.port
  this!.label = constr.label ?? null
  this!.status = constr.status ?? "on"
  this!.lightApi = new Light(this)


} as LightDataConstructor

export class Light {

  #data: Readonly<LightData>;
  
  constructor(data: LightData){
    this.#data = new Proxy(data, { set(){return false} })
  }

  get client(){ return this.#data.client }
  get id(){ return this.#data.id }
  get address(){ return this.#data.address }
  get port(){ return this.#data.port }
  get status(){ return this.#data.status }


  /**
   * Turns the light off
   * @example light('192.168.2.130').off()
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  turnOff(duration?: number, callback?: MessageHandlerCallback) {
    validate.optionalDuration(duration, 'light off method');
    validate.optionalCallback(callback, 'light off method');
    const {client, id} = this;

    const packetObj = packet.create('setPower', { level: 0, duration: duration }, client.source);
    packetObj.target = id;
    client.send(packetObj, callback);
  }

  /**
   * Turns the light on
   * @example light('192.168.2.130').on()
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  turnOn(duration?: number, callback?: MessageHandlerCallback) {
    validate.optionalDuration(duration, 'light on method');
    validate.optionalCallback(callback, 'light on method');
    const {client, id} = this;

    const packetObj = packet.create('setPower', { level: 65535, duration: duration }, client.source);
    packetObj.target = id;
    client.send(packetObj, callback);
  }

  /**
   * Changes the color to the given HSBK value
   * @param {Number} hue        color hue from 0 - 360 (in °)
   * @param {Number} saturation color saturation from 0 - 100 (in %)
   * @param {Number} brightness color brightness from 0 - 100 (in %)
   * @param {Number} [kelvin=3500]   color kelvin between 2500 and 9000
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  color(hue: number, saturation: number, brightness: number, kelvin?: number, duration?: number, callback?: MessageHandlerCallback) {
    validate.colorHsb(hue, saturation, brightness, 'light color method');

    validate.optionalKelvin(kelvin, 'light color method');
    validate.optionalDuration(duration, 'light color method');
    validate.optionalCallback(callback, 'light color method');

    const {client, id} = this;

    // Convert HSB values to packet format
    hue = Math.round(hue / HSBK_MAXIMUM_HUE * 65535);
    saturation = Math.round(saturation / HSBK_MAXIMUM_SATURATION * 65535);
    brightness = Math.round(brightness / HSBK_MAXIMUM_BRIGHTNESS * 65535);

    const packetObj = packet.create('setColor', {
      hue: hue,
      saturation: saturation,
      brightness: brightness,
      kelvin: kelvin,
      duration: duration
    }, client.source);
    packetObj.target = id;
    client.send(packetObj, callback);
  }

  /**
 * Changes the color to the given rgb value
 * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
 * @example light.colorRgb(255, 0, 0)
 * @param {Integer} red value between 0 and 255 representing amount of red in color
 * @param {Integer} green value between 0 and 255 representing amount of green in color
 * @param {Integer} blue value between 0 and 255 representing amount of blue in color
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
colorRgb (red: number, green: number, blue: number, duration?: number, callback?: MessageHandlerCallback) {
  validate.colorRgb(red, green, blue, 'light colorRgb method');
  validate.optionalDuration(duration, 'light colorRgb method');
  validate.optionalCallback(callback, 'light colorRgb method');

  const hsbObj = rgbToHsb({ r: red, g: green, b: blue });
  this.color(hsbObj.hue, hsbObj.saturation, hsbObj.brightness, 3500, duration, callback);
}

/**
 * Changes the color to the given rgb value
 * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
 * @example light.colorRgb('#FF0000')
 * @param {String} hexString rgb hex string starting with # char
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
colorRgbHex(hexString: string, duration?: number, callback?: MessageHandlerCallback) {
  if (typeof hexString !== 'string') {
    throw new TypeError('LIFX light colorRgbHex method expects first parameter hexString to a string');
  }

  validate.optionalDuration(duration, 'light colorRgbHex method');
  validate.optionalCallback(callback, 'light colorRgbHex method');

  const rgbObj = rgbHexStringToObject(hexString);
  const hsbObj = rgbToHsb(rgbObj);
  this.color(hsbObj.hue, hsbObj.saturation, hsbObj.brightness, 3500, duration, callback);
}

  /**
   * Sets the Maximum Infrared brightness
   * @param {Number} brightness infrared brightness from 0 - 100 (in %)
   * @param {Function} [callback] called when light did receive message
   */
  maxIR (brightness: number, callback?: MessageHandlerCallback) {
    validate.irBrightness(brightness, 'light setMaxIR method');

    brightness = Math.round(brightness / IR_MAXIMUM_BRIGHTNESS * 65535);

    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError('LIFX light setMaxIR method expects callback to be a function');
    }
    const {client, id} = this;
    const packetObj = packet.create('setInfrared', {brightness}, client.source, id);
    client.send(packetObj, callback);
  }

  /**
   * Apply a waveform effect to the bulb.
   * @param {Number} hue        color hue from 0 - 360 (in °)
   * @param {Number} saturation color saturation from 0 - 100 (in %)
   * @param {Number} brightness color brightness from 0 - 100 (in %)
   * @param {Number} [kelvin=3500]   color kelvin between 2500 and 9000
   * @param {Boolean} [transient=false] color does not persist
   * @param {Number} [period=500] duration of a cycle in miliseconds
   * @param {Number} [cycles=10e30] number of cycles
   * @param {Number} [skewRatio=0.5] waveform skew, between 0 and 1
   * @param {Number} [waveform=0] waveform to use for transition
   * @param {Function} [callback] called when light did receive message
   */
  waveform (hue: number, saturation: number, brightness: number, kelvin: number, transient = false, period = 500, cycles = 10e30, skewRatio = 0.5, waveform = 0, callback?: MessageHandlerCallback) {

    validate.colorHsb(hue, saturation, brightness, 'light waveform method');

    validate.optionalKelvin(kelvin, 'light waveform method');
    validate.optionalBoolean(transient, 'transient', 'light waveform method');
    validate.optionalNumber(period, 'period', 'light waveform method');
    validate.optionalNumber(cycles, 'cycles', 'light waveform method');
    validate.optionalNumber(skewRatio, 'skewRatio', 'light waveform method');
    validate.optionalWaveform(waveform, 'light waveform method');
    validate.optionalCallback(callback, 'light waveform method');

    // Convert HSB values to packet format
    hue = Math.round(hue / HSBK_MAXIMUM_HUE * 65535);
    saturation = Math.round(saturation / HSBK_MAXIMUM_SATURATION * 65535);
    brightness = Math.round(brightness / HSBK_MAXIMUM_BRIGHTNESS * 65535);

    const {client, id} = this;

    const packetObj = packet.create('setWaveform', {
      color: {
        hue: hue,
        saturation: saturation,
        brightness: brightness,
        kelvin: kelvin
      },
      isTransient: transient,
      period,
      cycles,
      skewRatio: skewRatio * 65535 - 32768,
      waveform
    }, client.source, id);
    client.send(packetObj, callback);
  }

  /**
   * Requests the current state of the light
   */
  getState ()  : Promise<StateLightObject> {

    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getLight', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateLight', (params) => {
        if (params.error) {
          return reject(params.error);
        } 

        const {color, power, label, dim, tags} = params.message
        color.hue = Math.round(color.hue * (HSBK_MAXIMUM_HUE / 65535));
        color.saturation = Math.round(color.saturation * (HSBK_MAXIMUM_SATURATION / 65535));
        color.brightness = Math.round(color.brightness * (HSBK_MAXIMUM_BRIGHTNESS / 65535));
    
        return resolve({color, power, label, dim, tags});
      }, sqnNumber);
    })
  }

  /**
   * Requests the current maximum setting for the infrared channel
   */
  getMaxIR() : Promise<number>{

    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getInfrared', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateInfrared', (params) => params.error ? reject(params.error): resolve(
        Math.round(params.message.brightness * (HSBK_MAXIMUM_BRIGHTNESS / 65535))
      ), sqnNumber);
    })
  }

  /**
   * Requests hardware info from the light
   */
  getHardwareVersion() : Promise<StateVersionObject> {

    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getVersion', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateVersion', (params) => {
        if (params.error) {
          return reject(params.error);
        } 

        const {vendorId, productId, version, vendorName, productName, productFeatures} = params.message
        return resolve({vendorId, productId, version, vendorName, productName, productFeatures});
      }, sqnNumber);
    })
  }


  /**
   * Requests uptime from the light
   */
  getUptime() : Promise<bigint>{
    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getInfo', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateInfo', (params) => params.error ? reject(params.error): resolve(params.message.uptime), sqnNumber);
    })
  }

  /**
 * Reboots the light
  */
  reboot(): Promise<void> {
    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('rebootRequest', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('rebootResponse', (params) => params.error ? reject(params.error): resolve(), sqnNumber);
    })
  }

  /**
   * Requests used version from the microcontroller unit of the light
   */
   getFirmwareVersion() : Promise<StateHostFirmwareObject>{
    return new Promise((resolve, reject) => {

      const {client, id} = this;
      const packetObj = packet.create('getHostFirmware', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateHostFirmware', (params) => {
        if (params.error) {
          return reject(params.error);
        } 
        const {build, majorVersion, minorVersion} = params.message
        return resolve({build, majorVersion, minorVersion});
      }, sqnNumber);
    })
  }

  /**
   * Requests wifi info from for the light
   */
  getWifiInfo() : Promise<StateWifiInfoObject>{
    return new Promise((resolve, reject) => {

      const {client, id} = this;
      const packetObj = packet.create('getWifiInfo', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateWifiInfo', (params) => {
        if (params.error) {
          return reject(params.error);
        } 
        const {signal, tx, rx, mcuTemperature} = params.message
        return resolve({signal, tx, rx, mcuTemperature});
      }, sqnNumber);
    })
  }

  /**
   * Requests used version from the wifi controller unit of the light (wifi firmware version)
   */
  getWifiVersion() : Promise<StateWifiFirmwareObject> {

    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getWifiFirmware', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateWifiFirmware', (params) => {
        if (params.error) {
          return reject(params.error);
        } 
        const {build, majorVersion, minorVersion} = params.message
        return resolve({build, majorVersion, minorVersion});
      }, sqnNumber);
    })
  }

  /**
   * Requests the label of the light
   * @param {boolean} [cache=false] return cached result if existent
   * @return {Promise<string>} future result of light label
   */
  getLabel(cache?: boolean): Promise<string> {

    if (cache !== undefined && typeof cache !== 'boolean') {
      throw new TypeError('LIFX light getLabel method expects cache to be a boolean');
    }

    if (cache === true) {
      const {label} = this.#data
      if (typeof label === 'string' && label.length > 0) {
        return Promise.resolve(label)
      }
    }

    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getLabel', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateLabel', 
        (params) => params.error ? reject(params.error): resolve(params.message.label)
      ,sqnNumber);
    })

  }


  /**
   * Sets the label of light
   * @example light.setLabel('Kitchen')
   * @param {string} label new label to be set, maximum 32 bytes
   * @param {Function} [callback] called when light did receive message
   */
  setLabel(label: string, callback?: MessageHandlerCallback) {
    if (label === undefined || typeof label !== 'string') {
      throw new TypeError('LIFX light setLabel method expects label to be a string')
    }
    if (new TextEncoder().encode(label).byteLength > 32) {
      throw new RangeError('LIFX light setLabel method expects a maximum of 32 bytes as label')
    }
    if (label.length < 1) {
      throw new RangeError('LIFX light setLabel method expects a minimum of one char as label')
    }
    validate.optionalCallback(callback, 'light setLabel method');

    const packetObj = packet.create('setLabel', { label: label }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }

  /**
   * Requests ambient light value of the light
   */
  getAmbientLight() : Promise<number> {
    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getAmbientLight', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('stateAmbientLight', 
        (params) => params.error ? reject(params.error): resolve(params.message.flux)
      ,sqnNumber);
    })
  }


  /**
   * Requests the power level of the light
   */
  getPower() : Promise<number> {
    return new Promise((resolve, reject) => {
      const {client, id} = this;
      const packetObj = packet.create('getPower', {}, client.source, id);
      const sqnNumber = client.send(packetObj);
      client.addMessageHandler('statePower', function (params) {
        if (params.error) {
          return reject(params.error);
        } 
        const {message} = params
        if (message.level === 65535) {
          message.level = 1;
        }
        return resolve(message.level);
      }, sqnNumber);
    })
    
  }


  /**
   * Requests the current color zone states from a light
   * @param {Number} startIndex start color zone index
   * @param {Number} [endIndex] end color zone index
   */
  getColorZones(startIndex: number, endIndex?: number): Promise<StateMultiZoneObject> {
    validate.zoneIndex(startIndex, 'light getColorZones method');
    validate.optionalZoneIndex(endIndex, 'light getColorZones method');
    endIndex ??= startIndex

    return new Promise((resolve, reject) => {
      endIndex ??= startIndex
      const {client, id} = this;
      const packetObj = packet.create('getColorZones', { startIndex, endIndex }, client.source, id);
      const sqnNumber = client.send(packetObj);
    
      if (startIndex === endIndex) {
    
        this.client.addMessageHandler('stateZone', (params) => {
          if (params.error) {
            return reject(params.error);
          } 
          const {color, index, count} = params.message
          // Convert HSB to readable format
          color.hue = Math.round(color.hue * (HSBK_MAXIMUM_HUE / 65535));
          color.saturation = Math.round(color.saturation * (HSBK_MAXIMUM_SATURATION / 65535));
          color.brightness = Math.round(color.brightness * (HSBK_MAXIMUM_BRIGHTNESS / 65535));
          return resolve({colors: [color], index, count});
        }, sqnNumber);
      } else {
        this.client.addMessageHandler('stateMultiZone', (params) => {
          if (params.error) {
            return reject(params.error);
          } 
          const {colors, index, count} = params.message
          // Convert HSB values to readable format
          colors.forEach(function (color) {
            color.hue = Math.round(color.hue * (HSBK_MAXIMUM_HUE / 65535));
            color.saturation = Math.round(color.saturation * (HSBK_MAXIMUM_SATURATION / 65535));
            color.brightness = Math.round(color.brightness * (HSBK_MAXIMUM_BRIGHTNESS / 65535));
          });

          return resolve({colors, index, count});
        }, sqnNumber);
      }
    })
  }

  /**
   * Changes a color zone range to the given HSBK value
   * @param {Number} startIndex start zone index from 0 - 255
   * @param {Number} endIndex start zone index from 0 - 255
   * @param {Number} hue color hue from 0 - 360 (in °)
   * @param {Number} saturation color saturation from 0 - 100 (in %)
   * @param {Number} brightness color brightness from 0 - 100 (in %)
   * @param {Number} [kelvin=3500] color kelvin between 2500 and 9000
   * @param {Number} [duration] transition time in milliseconds
   * @param {Boolean} [apply=true] apply changes immediately or leave pending for next apply
   * @param {Function} [callback] called when light did receive message
   */
  colorZones(startIndex: number, endIndex: number, hue: number, saturation: number, brightness: number, kelvin?: number, duration?: number, apply?: boolean, callback?: MessageHandlerCallback) {
    validate.zoneIndex(startIndex, 'color zones method');
    validate.zoneIndex(endIndex, 'color zones method');
    validate.colorHsb(hue, saturation, brightness, 'color zones method');

    validate.optionalKelvin(kelvin, 'color zones method');
    validate.optionalDuration(duration, 'color zones method');
    validate.optionalBoolean(apply, 'apply', 'color zones method');
    validate.optionalCallback(callback, 'color zones method');

    // Convert HSB values to packet format
    hue = Math.round(hue / HSBK_MAXIMUM_HUE * 65535);
    saturation = Math.round(saturation / HSBK_MAXIMUM_SATURATION * 65535);
    brightness = Math.round(brightness / HSBK_MAXIMUM_BRIGHTNESS * 65535);

    const {client, id} = this;

    const appReq = apply === false ? APPLICATION_REQUEST_VALUES.NO_APPLY : APPLICATION_REQUEST_VALUES.APPLY;
    const packetObj = packet.create('setColorZones', {
      startIndex: startIndex,
      endIndex: endIndex,
      color: {
        hue: hue,
        saturation: saturation,
        brightness: brightness,
        kelvin: kelvin ?? HSBK_DEFAULT_KELVIN,
      },
      duration: duration,
      apply: appReq
    }, client.source, id);
    client.send(packetObj, callback);
  }

}