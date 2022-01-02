import {instance} from './provider.ts'
export type {UdpSocket, UdpSocketMessage} from './provider.ts'

/**
 * Creates an UDP socket and binds it to a local address
 * @param hostname - hostname of local address to bind 
 * @param port - port number of local address to bind 
 * @returns a udp connection object
 */
export const listen: typeof instance.listen = ({hostname = "0.0.0.0", port}) => instance.listen({hostname, port})