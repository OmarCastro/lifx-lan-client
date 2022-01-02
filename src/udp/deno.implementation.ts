import {provide, UdpSocketAddress, UdpSocket, UdpSocketMessage} from './provider.ts' 


const adaptFromDenoAddress = (addr : Deno.Addr): UdpSocketAddress => ({
    hostname: (addr as Deno.NetAddr).hostname,
    port: (addr as Deno.NetAddr).port,
})

const adaptFromDenoMessage = ([data, addr]: [Uint8Array, Deno.Addr]): UdpSocketMessage => ({
    ...adaptFromDenoAddress(addr),
    data,
})

export function listen(address: UdpSocketAddress): UdpSocket {
    const conn = Deno.listenDatagram({
        hostname: address.hostname,
        port: address.port,
        transport: "udp",
      });

    return Object.freeze({
        address: adaptFromDenoAddress(conn.addr),
        send(message: UdpSocketMessage){
            conn.send(message.data, {
                hostname: message.hostname,
                port: message.port,
                transport: "udp",
            })
        },
        receive: () => conn.receive().then(adaptFromDenoMessage),
        close: () => conn.close(),
        async *[Symbol.asyncIterator](){
            for await(const message of conn){
                yield adaptFromDenoMessage(message)
            }
        }
    })
}

provide({listen})