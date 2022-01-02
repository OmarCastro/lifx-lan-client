const packetTypeMap = {
    2:{ name: 'getService' },
    3:{ name: 'stateService' },
    12:{ name: 'getHostInfo' },
    13:{ name: 'stateHostInfo' },
    14:{ name: 'getHostFirmware' },
    15:{ name: 'stateHostFirmware' },
    16:{ name: 'getWifiInfo' },
    17:{ name: 'stateWifiInfo' },
    18:{ name: 'getWifiFirmware' },
    19:{ name: 'stateWifiFirmware' },
    //{id: 20, name: 'getPower'}, // These are for device level
    //{id: 21, name: 'setPower'}, // and do not support duration value
    //{id: 22, name: 'statePower'}, // since that we don't use them
    23: { name: 'getLabel' },
    24: { name: 'setLabel' },
    25: { name: 'stateLabel' },
    32: { name: 'getVersion' },
    33: { name: 'stateVersion' },
    35: { name: 'stateInfo' },
    38: { name: 'rebootRequest' },
    43: { name: 'rebootResponse' },
    45: { name: 'acknowledgement' },
    48: { name: 'getLocation' },
    50: { name: 'stateLocation' }, 
    51: { name: 'getGroup' },
    53: { name: 'stateGroup' },
    54: { name: 'getOwner' },
    56: { name: 'stateOwner' },
    58: { name: 'echoRequest' },
    59: { name: 'echoResponse' },
    // {id: 60, name: 'getStatistic'},
    // {id: 61, name: 'stateStatistic'},
    101: { name: 'getLight' },
    102: { name: 'setColor' },
    103: { name: 'setWaveform' },
    107: { name: 'stateLight' },
    110: { name: 'getTemperature' },
    111: { name: 'stateTemperature' },
    // {id: 113, name: 'setSimpleEvent'},
    // {id: 114, name: 'getSimpleEvent'},
    // {id: 115, name: 'stateSimpleEvent'},
    116: { name: 'getPower' },
    117: { name: 'setPower' },
    118: { name: 'statePower' },
    // {id: 119, name: 'setWaveformOptional'},
    120: { name: 'getInfrared' },
    121: { name: 'stateInfrared' },
    122: { name: 'setInfrared' },
    401: { name: 'getAmbientLight' },
    402: { name: 'stateAmbientLight' },
    // {id: 403, name: 'getDimmerVoltage'},
    // {id: 404, name: 'stateDimmerVoltage'},
    501: { name: 'setColorZones' },
    502: { name: 'getColorZones' },
    503: { name: 'stateZone' },
    504: { name: 'getCountZone' },
    505: { name: 'stateCountZone' },
    506: { name: 'stateMultiZone' },
    // {id: 507, name: 'getEffectZone'},
    // {id: 508, name: 'setEffectZone'},
    // {id: 509, name: 'stateEffectZone'}
} as const

type PacketId = keyof typeof packetTypeMap
export type PacketName = typeof packetTypeMap[PacketId]["name"]

const idIndexMap = Object.fromEntries(Object.entries(packetTypeMap).map(([id, entry]) => [id, {...entry, id: parseInt(id)}])) as {[index in PacketId]: {name: typeof packetTypeMap[index]["name"], id: index}}
const nameIndexMap = Object.fromEntries(Object.entries(packetTypeMap).map(([id, entry]) => [entry.name, {...entry, id: parseInt(id)}])) as {[index in PacketName]:  {
    [K in PacketId]:  typeof packetTypeMap[K]["name"] extends index ? {name: typeof packetTypeMap[K]["name"], id: K}:never
}[PacketId]}

type Entry = typeof nameIndexMap[keyof typeof nameIndexMap]

 
export function findNameFromId<T extends PacketId>(id: T): typeof idIndexMap[T]["name"]
export function findNameFromId(id: number): string | undefined
export function findNameFromId(id: number): string | undefined {
    return idIndexMap[id as PacketId]?.name
}

export function findIdfromName<T extends PacketName>(id: T): number
export function findIdfromName(name: string): number | undefined
export function findIdfromName(name: string): number | undefined {
        return nameIndexMap[name as PacketName]?.id
}

export function findfromName<T extends PacketName>(name: T): typeof nameIndexMap[T]
export function findfromName(name: string): Entry | undefined
export function findfromName(name: string): Entry | undefined {
    return nameIndexMap[name as PacketName]
}

export function findfromId<T extends PacketId>(id: T): typeof idIndexMap[T]
export function findfromId(id: number): Entry | undefined
export function findfromId(id: number): Entry | undefined {
    return idIndexMap[id as PacketId]
}


export function findfromNameOrId<T extends PacketName>(nameOrId: T): typeof nameIndexMap[T]
export function findfromNameOrId<T extends PacketId>(nameOrId: T): typeof idIndexMap[T]
export function findfromNameOrId(nameOrId: string | number): Entry | undefined
export function findfromNameOrId(nameOrId: string | number): Entry | undefined {
    return typeof nameOrId === 'string' ? findfromName(nameOrId):
    typeof nameOrId === 'number' ? findfromId(nameOrId):
    undefined

}