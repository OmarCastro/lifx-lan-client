import { uint8ArrayToHexString } from './utils/hex-string.util.ts'
import type { UdpSocket, UdpSocketMessage} from '../../udp/udp.ts'
import { PACKET_TRANSACTION_TYPES, messageQueueRecord } from './constants.ts'

export interface LogMessage {
  message: string
  level: LogLevel
  timetstamp: number
  params: Record<string, unknown>
}

export interface LogMessageParams {
  message: string
  params: Record<string, unknown>
}

const logLevels = {
  'DEBUG': 400,
  'INFO' : 300,
  'WARN' : 200,
  'ERROR': 400,
}

export type LogLevel = keyof typeof logLevels


export class ClientLogger {

  private logLevel: number

  constructor(private eventTarget: EventTarget, logLevel?: LogLevel){
    this.logLevel = logLevel ? logLevels[logLevel] ?? logLevels.INFO : logLevels.INFO
  }

  get isDebugLevel(){return this.logLevel >= logLevels.DEBUG }
  get isInfoLevel(){return this.logLevel >= logLevels.INFO }
  get isWarnLevel(){return this.logLevel >= logLevels.WARN }
  get isErrorLevel(){return this.logLevel >= logLevels.ERROR }

  logDebugListeningSockets(socket: UdpSocket){
    if (!this.isDebugLevel){
      return
    }

    const {hostname, port} = socket.address
  
    logDebug({
      message: `DEBUG - listening sockets on  ${hostname}:${port}`,
      params: {socket}
    }, this.eventTarget)
  }

  logDebugMessageReceive(communicationData: UdpSocketMessage){
    if (!this.isDebugLevel){
      return
    }
    const {hostname, port, data} = communicationData
    const hexString = uint8ArrayToHexString(data)
    logDebug({
      message: `DEBUG - ${hexString} from ${hostname}:${port}`,
      params:  {hostname, port, data, hexString}
    }, this.eventTarget)

  }

  logDebugMessageSend(message: messageQueueRecord){
    if (!this.isDebugLevel){
      return
    }
    
    const hexString = uint8ArrayToHexString(message.data)
    const logMessage = message.transactionType === PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE ?
      `DEBUG - ${hexString} to ${message.address}, send ${message.timesSent} time(s)` :
      `DEBUG - ${hexString} to ${message.address}`
  
      logDebug({
        message: logMessage,
        params:  {message, hexString}
      }, this.eventTarget)
  }
}


function log(data: LogMessage, eventTarget: EventTarget){
  const event = new CustomEvent('log', { detail: data })
  eventTarget.dispatchEvent(event);
}

function logDebug(data: LogMessageParams, eventTarget: EventTarget){
  log({
    level: 'DEBUG',
    timetstamp: Date.now(),
    ...data
  }, eventTarget)
}


