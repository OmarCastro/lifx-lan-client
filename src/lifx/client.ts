import {LIFX_DEFAULT_PORT, PACKET_TRANSACTION_TYPES, PACKET_HEADER_SEQUENCE_MAX, messageQueueRecord} from './constants.ts'
import { getAllHostIps, isIpv4Format } from './utils/ipAddress.ts'
import { uint8ArrayToHexString, generateRandomHexString } from './utils/hex-string.util.ts'
import * as Packet from './packet.ts'
import {Light, LightData} from './light.ts'
import {findfromName} from './packet-type-list.constants.ts'
import {listen as openUdpSocket} from '../udp/udp.ts'
import {ClientLogger, LogMessage} from './client-logger.ts'
import type {UdpSocket} from '../udp/udp.ts'
import type {PacketObject} from './packet.ts'
import type {PacketType, PacketHandleCustomData} from './packets/mod.ts'
 
const findByParams = <T> (obj: Record<string, T>, params: {[K in keyof T]?:T[K]}) => {
  const paramsEntries = Object.entries(params) as [keyof T, unknown][]
  return Object.values(obj).find(value => paramsEntries.every(([key, val]) => value[key] === val))
}



type InitOptions = {
  /** The IPv4 address to bind to */
  address: string
  /** The port to bind to */
  port: number
  /** Show debug output */
  debug: boolean
  /** If light hasn't answered for amount of discoveries it is set offline */
  lightOfflineTolerance: number
  /** Message handlers not called will be removed after this delay in ms */
  messageHandlerTimeout: number
  /** The source to send to light, must be 8 chars lowercase or digit */
  source: string
  /** Flag to determine wether to start discovery after initialization or not */
  startDiscovery: boolean
  /** Pre set list of ip addresses of known addressable lights */
  lights: string[]
  /** Stop discovery after discovering known addressable lights defined with options.light */
  stopAfterDiscovery: boolean
  /** The broadcast address to use for light discovery */
  broadcast: string
  /** The port to send messages to */
  sendPort: number
  /** The minimum delay, in milliseconds, between sending any two packets to a single light */
  messageRateLimit: number
  /** Interval, in milliseconds, between discovery operations */
  discoveryInterval: number  

  /** resend packet delay, TODO: improve */
  resendPacketDelay: number

  resendMaxTimes: number

}


type MessageHandler = {
  type: PacketType
  callback: MessageHandlerCallback<PacketHandleCustomData<never>>
  sequenceNumber?: number
  timestamp?: number
}


type MessageHandlerCallbackParamOk<T> = {
  error?: null, 
  message: { [key in keyof (PacketObject & T)]:  (PacketObject & T)[key] }, 
  address: {hostname: string, port: number}
}

type MessageHandlerCallbackParamError = {
  error: Error, 
}

export type MessageHandlerCallbackParam<T = Record<never, never>> = MessageHandlerCallbackParamOk<T> | MessageHandlerCallbackParamError
export type MessageHandlerCallback<T = Record<never, never>> = (param: MessageHandlerCallbackParam<T>) => void;

export class Client {
    public devices = {} as Record<string, InstanceType<typeof LightData>>
    public logger: ClientLogger;
    private eventTarget = new EventTarget()
    private lightOfflineTolerance = 0;
    private socket: UdpSocket | undefined;
    private socketBindAddress: string
    public socketBindPort: number
    public source = ''
    private sequenceNumber = 0
    private messageHandlerTimeout: number
    private broadcastAddress: string
    private resendPacketDelay: number
    private resendMaxTimes: number
    private sendPort: number
    private messageRateLimit: number
    private discoveryInterval: number
    private lightAddresses: string[]
    private discoveryPacketSequence = 0
    private stopAfterDiscovery: boolean
    private startDiscoveryOnInit: boolean
    private discoveryTimer: number | undefined = undefined
    private messageQueues = {} as Record<string, messageQueueRecord[]>
    private messageHandlers: MessageHandler[]
    private sendTimers = {} as Record<string, number>
    private discoveryCompleted = false
    public isSocketBound = false;


    constructor(options: Partial<InitOptions>){

      this.isSocketBound = false;
      this.devices = {};
      this.messageQueues = {};
      this.sendTimers = {};
      this.messageRateLimit = 50; // ms
      this.discoveryInterval = 5000; // ms
      this.discoveryPacketSequence = 0;
      this.messageHandlers = [{
        type: 'stateService',
        callback: this.processDiscoveryPacket.bind(this)
      }, {
        type: 'stateLabel',
        callback: this.processLabelPacket.bind(this)
      }, {
        type: 'stateLight',
        callback: this.processLabelPacket.bind(this)
      }];
      this.sequenceNumber = 0;
      this.lightOfflineTolerance = 3;
      this.messageHandlerTimeout = 45000; // 45 sec
      this.resendPacketDelay = 150;
      this.resendMaxTimes = 5;
      this.source = generateRandomHexString(8);
      this.broadcastAddress = '255.255.255.255';
      this.lightAddresses = [];
      this.stopAfterDiscovery = false;
      this.discoveryCompleted = false;



      const defaultOpts = {
        address: '0.0.0.0',
        port: LIFX_DEFAULT_PORT,
        debug: false,
        lightOfflineTolerance: 3,
        messageHandlerTimeout: 45000,
        source: '',
        startDiscovery: true,
        lights: [],
        stopAfterDiscovery: false,
        broadcast: '255.255.255.255',
        sendPort: LIFX_DEFAULT_PORT,
        resendPacketDelay: 150,
        resendMaxTimes: 3,
        messageRateLimit: 50,
        discoveryInterval: 5000
      };
    
      options = options || {};
      const opts = {...defaultOpts, ...options} as InitOptions;
    
      if (typeof opts.port !== 'number') {
        throw new TypeError('LIFX Client port option must be a number');
      } else if (opts.port > 65535 || opts.port < 0) {
        throw new RangeError('LIFX Client port option must be between 0 and 65535');
      }
    
      if (typeof opts.debug !== 'boolean') {
        throw new TypeError('LIFX Client debug option must be a boolean');
      }
      this.logger = new ClientLogger(this.eventTarget, opts.debug ? 'DEBUG':'INFO');
    
      if (typeof opts.lightOfflineTolerance !== 'number') {
        throw new TypeError('LIFX Client lightOfflineTolerance option must be a number');
      }
      this.lightOfflineTolerance = opts.lightOfflineTolerance;
    
      if (typeof opts.messageHandlerTimeout !== 'number') {
        throw new TypeError('LIFX Client messageHandlerTimeout option must be a number');
      }
      this.messageHandlerTimeout = opts.messageHandlerTimeout;
    
      if (typeof opts.resendPacketDelay !== 'number') {
        throw new TypeError('LIFX Client resendPacketDelay option must be a number');
      }
      this.resendPacketDelay = opts.resendPacketDelay;
    
      if (typeof opts.resendMaxTimes !== 'number') {
        throw new TypeError('LIFX Client resendMaxTimes option must be a number');
      }
      this.resendMaxTimes = opts.resendMaxTimes;
    
      if (typeof opts.broadcast !== 'string') {
        throw new TypeError('LIFX Client broadcast option must be a string');
      } else if (!isIpv4Format(opts.broadcast)) {
        throw new TypeError('LIFX Client broadcast option does only allow IPv4 address format');
      }
      this.broadcastAddress = opts.broadcast;
    
      if (typeof opts.sendPort !== 'number') {
        throw new TypeError('LIFX Client sendPort option must be a number');
      } else if (opts.sendPort > 65535 || opts.sendPort < 1) {
        throw new RangeError('LIFX Client sendPort option must be between 1 and 65535');
      }
      this.sendPort = opts.sendPort;
    
      if (!Array.isArray(opts.lights)) {
        throw new TypeError('LIFX Client lights option must be an array');
      } else {
        opts.lights.forEach(function (light) {
          if (!isIpv4Format(light)) {
            throw new TypeError('LIFX Client lights option array element \'' + light + '\' is not expected IPv4 format');
          }
        });
        this.lightAddresses = opts.lights;
    
        if (typeof opts.stopAfterDiscovery !== "boolean") {
          throw new TypeError('LIFX Client stopAfterDiscovery must be a boolean');
        } else {
          this.stopAfterDiscovery = opts.stopAfterDiscovery;
        }
      }
    
      if (opts.source !== '') {
        if (typeof opts.source === 'string') {
          if (/^[0-9A-F]{8}$/.test(opts.source)) {
            this.source = opts.source;
          } else {
            throw new RangeError('LIFX Client source option must be 8 hex chars');
          }
        } else {
          throw new TypeError('LIFX Client source option must be given as string');
        }
      }
    
      if (typeof opts.messageRateLimit !== 'number') {
        throw new TypeError('LIFX Client messageRateLimit option must be a number');
      } else if (opts.messageRateLimit <= 0) {
        throw new RangeError('LIFX Client messageRateLimit option must greater than 0');
      }
      this.messageRateLimit = opts.messageRateLimit;
    
      if (typeof opts.discoveryInterval !== 'number') {
        throw new TypeError('LIFX Client discoveryInterval option must be a number');
      } else if (opts.discoveryInterval <= 0) {
        throw new RangeError('LIFX Client discoveryInterval option must greater than 0');
      }
      this.discoveryInterval = opts.discoveryInterval;

      this.socketBindAddress = opts.address
      this.socketBindPort = opts.port
      this.startDiscoveryOnInit = opts.startDiscovery
    }

    on(type: "log", callback: (message:LogMessage) => void): void
    on(type: "light-new", callback: (ligth:Light) => void): void
    on(type: string, callback: CallableFunction){
      this.eventTarget.addEventListener(type, (event: Event) => callback((event as CustomEvent).detail))
    }

  /**
   * Find a light by label, id or ip
   * @param {String} identifier label, id or ip to search for
   * @return {Object|Boolean} the light object or false if not found
   */
  light(identifier: string): Light | false {
    const identifierInbytes = new TextEncoder().encode(identifier)

    if (typeof identifier !== 'string') {
      throw new TypeError('LIFX Client light expects identifier for LIFX light to be a string');
    }
  
    // There is no ip or id longer than 45 chars, no label longer than 32 bit
    if (identifier.length > 45 && identifierInbytes.length > 32) {
      return false;
    }
  
    // Dots or colons is high likely an ip
    if (identifier.indexOf('.') >= 0 || identifier.indexOf(':') >= 0) {
      const result = findByParams(this.devices, { address: identifier })?.lightApi || false;
      if (result !== false) {
        return result;
      }
    }
  
    // Search id
    let result = findByParams(this.devices, { id: identifier })?.lightApi  || false;
    if (result !== false) {
      return result;
    }
  
    // Search label
    result = findByParams(this.devices, { label: identifier })?.lightApi  || false;
    return result;
  }

  init(callback?: () => void) {
  
    this.socket = openUdpSocket({
      hostname: this.socketBindAddress,
      port: this.socketBindPort
    });

  
     this.isSocketBound = true
     listenSocket(this.socket, this)
  
    // Start scanning
    if (this.startDiscoveryOnInit) {
      this.startDiscovery(this.lightAddresses);
    }
    if (typeof callback === 'function') {
      return callback();
    }
    
  }


  startDiscovery(lights: string[]) {
    lights = lights || [];
    const sendDiscoveryPacket = ()  => {
      // Sign flag on inactive lights
      
      Object.entries(this.devices).forEach(([deviceId, info]) => {
        if (this.devices[deviceId].status !== 'off') {
          const diff = this.discoveryPacketSequence - info.seenOnDiscovery;
          if (diff >= this.lightOfflineTolerance) {
            this.devices[deviceId].status = 'off';
            this.emit('bulb-offline', info); // deprecated
            this.emit('light-offline', info);
          }
        }
      })
   
  
      // Send a discovery packet broadcast
      this.send(Packet.create('getService', {}, this.source));
  
      // Send a discovery packet to each light given directly
      lights.forEach((lightAddress) => {
        const msg = Packet.create('getService', {}, this.source);
        msg.address = lightAddress;
        this.send(msg);
      });
  
      // Keep track of a sequent number to find not answering lights
      if (this.discoveryPacketSequence >= Number.MAX_VALUE) {
        this.discoveryPacketSequence = 0; 
      } else {
        this.discoveryPacketSequence += 1;
      }
    };
  
    this.discoveryTimer = setInterval(sendDiscoveryPacket, this.discoveryInterval);
  
    sendDiscoveryPacket();
  }

  
  send (msg: PacketObject, callback?: MessageHandlerCallback) {
    const packet = {} as messageQueueRecord
    packet.timeCreated = Date.now()
    packet.timeLastSent = 0
    packet.timesSent = 0
    packet.transactionType = PACKET_TRANSACTION_TYPES.ONE_WAY


    // Add the target ip address if target given
    if (msg.address !== undefined) {
      packet.address = msg.address;
    }
    if (msg.target !== undefined) {
      const targetBulb = this.light(msg.target);
      if (targetBulb) {
        packet.address = targetBulb.address;
        // If we would exceed the max value for the int8 field start over again
        if (this.sequenceNumber >= PACKET_HEADER_SEQUENCE_MAX) {
          this.sequenceNumber = 0;
        } else {
          this.sequenceNumber += 1;
        }
      }
    }
  
    msg.sequence = this.sequenceNumber;
    packet.sequence = this.sequenceNumber;
    if (typeof callback === 'function') {
      msg.ackRequired = true;
      this.addMessageHandler('acknowledgement', callback, msg.sequence);
      packet.transactionType = PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE;
    }
    packet.data = Packet.toBuffer(msg);
  
    const queueAddress = packet.address;
    const messageQueue = this.getMessageQueue(packet.address);
    messageQueue.unshift(packet);
  
    this.startSendingProcess(queueAddress);
  
    return this.sequenceNumber;
  }

  getMessageQueue(address?: string) {
    const queueAddress = address ?? this.broadcastAddress;
  
    if (this.messageQueues[queueAddress] == null) {
      this.messageQueues[queueAddress] = [];
    }
    return this.messageQueues[queueAddress];
  }

  addMessageHandler<T extends PacketType>(type: T, callback: MessageHandlerCallback<PacketHandleCustomData<T>>, sequenceNumber: number): void
  addMessageHandler(type: PacketType, callback: MessageHandlerCallback<unknown>, sequenceNumber: number) {
    if (typeof type !== 'string') {
      throw new TypeError('LIFX Client addMessageHandler expects type parameter to be string');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('LIFX Client addMessageHandler expects callback parameter to be a function');
    }
  
    const typeName = findfromName(type);
    if (typeName === undefined) {
      throw new RangeError('LIFX Client addMessageHandler unknown packet type: ' + type);
    }
  
    const handler = {
      type: type,
      callback: callback.bind(this),
      timestamp: Date.now(),
      sequenceNumber: 0
    };
  
    if (sequenceNumber !== undefined) {
      if (typeof sequenceNumber !== 'number') {
        throw new TypeError('LIFX Client addMessageHandler expects sequenceNumber to be a integer');
      } else {
        handler.sequenceNumber = sequenceNumber;
      }
    }
  
    this.messageHandlers.push(handler as MessageHandler);
  }

  startSendingProcess(address?: string) {
    const queueAddress = address ?? this.broadcastAddress;
  
    if (this.sendTimers[queueAddress] == null) {
      // Already running?
      const sendingProcess = this.sendingProcess(queueAddress);
      this.sendTimers[queueAddress] = setInterval(sendingProcess, this.messageRateLimit);
    }
  }

  stopSendingProcess(address?: string) {
    const queueAddress = address ?? this.broadcastAddress;
    if ( this.sendTimers[queueAddress] != null) {
      clearInterval(this.sendTimers[queueAddress]);
      delete this.sendTimers[queueAddress];
    }
  }

  sendingProcess(queueAddress: string) {
  
    const messageQueue = this.getMessageQueue(queueAddress);
    return () => {
      if (!this.isSocketBound) {
        this.stopSendingProcess(queueAddress);
        console.log('LIFX Client stopped sending due to unbound socket');
        return;
      }

      if(!this.socket){
        return
      }
  
      if (messageQueue.length > 0) {
        const msg = messageQueue[messageQueue.length - 1];
        messageQueue.pop()
        if (msg.address === undefined) {
          msg.address = this.broadcastAddress;
        }
        if (msg.transactionType === PACKET_TRANSACTION_TYPES.ONE_WAY) {
          this.socket.send({ data: msg.data, hostname: msg.address, port: this.sendPort})
          this.logger.logDebugMessageSend(msg)
          
        } else if (msg.transactionType === PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE) {
          if (msg.timesSent < this.resendMaxTimes) {
            if (Date.now() > msg.timeLastSent + this.resendPacketDelay) {
              this.socket.send({ data: msg.data, hostname: msg.address, port: this.sendPort})

              msg.timesSent += 1;
              msg.timeLastSent = Date.now();
              this.logger.logDebugMessageSend(msg)
            }
            // Add to the end of the queue again
            messageQueue.unshift(msg);
          } else {
            this.messageHandlers.forEach((handler, hdlrIndex) => {
              if (handler.type === 'acknowledgement' && handler.sequenceNumber === msg.sequence) {
                this.messageHandlers.splice(hdlrIndex, 1);
                const error = new Error('No LIFX response after max resend limit of ' + this.resendMaxTimes);
                return handler.callback({error});
              }
            });
          }
        }
      } else {
        this.stopSendingProcess(queueAddress);
      }
    };
  }

  processMessageHandlers(packet: PacketObject, address: {hostname: string, port: number}) {
    const messageQueue = this.getMessageQueue(address.hostname);
    // Process only packages for us
    if (packet.source.toLowerCase() !== this.source.toLowerCase()) {
      return;
    }

    // We check our message handler if the answer received is requested
    this.messageHandlers.forEach((handler, handlerIndex) => {
      if (packet.typeName === handler.type) {
        if (handler.sequenceNumber !== undefined) {
          if (handler.sequenceNumber === packet.sequence) {
            // Remove if specific packet was request, since it should only be called once
            this.messageHandlers.splice(handlerIndex, 1);
            messageQueue.forEach(function (packet, packetIndex) {
              if (packet.transactionType === PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE && packet.sequence === packet.sequence) {
                messageQueue.splice(packetIndex, 1);
              }
            });
  
            // Call the function requesting the packet
            return handler.callback({message: packet, address});
          }
        } else {
          // Call the function requesting the packet
          return handler.callback({message: packet, address});
        }
      }
  
      // We want to call expired request handlers for specific packages after the
      // messageHandlerTimeout set in options, to specify an error
      if (handler.sequenceNumber !== undefined) {
        if (handler.timestamp == null || Date.now() > handler.timestamp + this.messageHandlerTimeout) {
          this.messageHandlers.splice(handlerIndex, 1);
  
          const error = new Error('No LIFX response in time');
          return handler.callback({error});
        }
      }
    }, this);
  }

  processDiscoveryPacket(params: MessageHandlerCallbackParam<PacketHandleCustomData<"stateService">>) {
    if (params.error) {
      return;
    }

    const {message, address} = params

    if (message.serviceName === 'udp' && message.port === LIFX_DEFAULT_PORT) {
      // Add / update the found gateway
      if (!this.devices[message.target]) {
        const lightDeviceData = LightData({
          client: this,
          id: message.target,
          address: address.hostname,
          port: message.port,
          seenOnDiscovery: this.discoveryPacketSequence
        });
        this.devices[message.target] = lightDeviceData;
        const lightDevice = lightDeviceData.lightApi


        // Request label
        const labelRequest = Packet.create('getLabel', {}, this.source);
        labelRequest.target = message.target;
        this.send(labelRequest);
  
        this.emit('bulb-new', lightDevice); // deprecated
        this.emit('light-new', lightDevice);
      } else {
        if (this.devices[message.target].status === 'off') {
          this.devices[message.target].status = 'on';
          this.emit('bulb-online', this.devices[message.target]); // deprecated
          this.emit('light-online', this.devices[message.target]);
        }
        this.devices[message.target].address = address.hostname;
        this.devices[message.target].seenOnDiscovery = this.discoveryPacketSequence;
      }
  
      // Check if discovery should be stopped
      if (this.stopAfterDiscovery && !this.discoveryCompleted) {
        if (this.predefinedDiscoveredAndOnline()) {
          this.emit('discovery-completed');
          this.stopDiscovery();
          this.discoveryCompleted = true;
        }
      }
    }
  }

  processLabelPacket(params: MessageHandlerCallbackParam<{label: string}>) {
    if (params.error) {
      return;
    }

    const {message} = params

    if (this.devices[message.target] !== undefined) {
      this.devices[message.target].label = message.label;
    }
  }

  /**
   * This stops the discovery process
   * The client will be no longer updating the state of lights or find lights
   */
  stopDiscovery () {
    clearInterval(this.discoveryTimer);
    this.discoveryTimer = undefined;
  }

  predefinedDiscoveredAndOnline() {
  
    const {lightAddresses, devices} = this

    const predefinedDevices = Object.values(devices).filter((device) => {
      return lightAddresses.includes(device.address)
    });
  
    const numDiscovered = Object.keys(devices).length;
    const allDiscovered = numDiscovered >= lightAddresses.length;
    const allOnline = predefinedDevices.every((device) => device.status === 'on');
    const labelsReceived = predefinedDevices.every((device) => typeof device.label === "string");
    return allDiscovered && allOnline && labelsReceived;
  }


  emit(eventType: "light-new", data: Light): void
  emit<T>(eventType: string, data?: T): void
  emit<T>(eventType: string, data?: T){
      const event = new CustomEvent(eventType, { detail: data })
    this.eventTarget.dispatchEvent(event);

  }

}


async function listenSocket(socket: UdpSocket, client: Client){
  const localAddresses = await getAllHostIps()
  client.logger.logDebugListeningSockets(socket)

  try {
    for await(const packet of socket){
      const {hostname, port, data} = packet

      // Ignore own messages and false formats
      if (localAddresses.indexOf(hostname) >= 0 || !(data instanceof Uint8Array)) {
        continue;
      }

      client.logger.logDebugMessageReceive(packet)

      // Parse packet to object
      const parsedMsg = Packet.toObject(data);

      // Check if packet is read successfully
      if (parsedMsg instanceof Error) {
        console.error('LIFX Client invalid packet header error');
        console.error('Packet: ', uint8ArrayToHexString(data));
        console.trace(parsedMsg);
      } else {
        // Check for handlers of given message
        client.processMessageHandlers(parsedMsg,  {hostname, port});

        client.emit('message', {hostname, port, data, parsedMsg});
      }

    }
  } catch(err) {
    client.isSocketBound = false
    console.error('LIFX Client UDP error');
    console.trace(err);
    socket.close()
    return
  }
}
