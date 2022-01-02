export type UdpSocketAddress = {
    hostname: string;
    port: number;
}

export type UdpSocketMessage = UdpSocketAddress & { data: Uint8Array }

export type UdpSocket = {
    send(message: UdpSocketMessage): void
    receive(): Promise<UdpSocketMessage>
    close(): void;
    readonly address: UdpSocketAddress;
    [Symbol.asyncIterator](): AsyncIterableIterator<UdpSocketMessage>;
}

type Instance = {
    listen(address:UdpSocketAddress): UdpSocket
}

const currentImpl: Instance = {
    listen: () => {throw new Error("socket listen implementation not provided")}
}

const keys = Object.keys(currentImpl) as (keyof Instance)[]

export const instance = keys.reduce((obj, key) => {
    return Object.defineProperty(obj, key, {
        get: () => currentImpl[key] 
      });
},{} as Instance);



export function provide(instance: Partial<Instance>){
    keys.forEach(key => { currentImpl[key] = instance[key] ?? currentImpl[key] })
}