import acknowledgement from './acknowledgement.ts'
import echoRequest from './echoRequest.ts'
import echoResponse from './echoResponse.ts'
import getAmbientLight from './getAmbientLight.ts'
import getColorZones from './getColorZones.ts'
import getGroup from './getGroup.ts'
import getHostFirmware from './getHostFirmware.ts'
import getHostInfo from './getHostInfo.ts'
import getInfo from './getInfo.ts'
import getInfrared from './getInfrared.ts'
import getLabel from './getLabel.ts'
import getLight from './getLight.ts'
import getLocation from './getLocation.ts'
import getOwner from './getOwner.ts'
import getPower from './getPower.ts'
import getService from './getService.ts'
import getTemperature from './getTemperature.ts'
import getVersion from './getVersion.ts'
import getWifiFirmware from './getWifiFirmware.ts'
import getWifiInfo from './getWifiInfo.ts'
import rebootRequest from './rebootRequest.ts'
import rebootResponse from './rebootResponse.ts'
import setColor from './setColor.ts'
import setColorZones from './setColorZones.ts'
import setInfrared from './setInfrared.ts'
import setLabel from './setLabel.ts'
import setPower from './setPower.ts'
import setWaveform from './setWaveform.ts'
import stateAmbientLight from './stateAmbientLight.ts'
//import stateGroup from './stateGroup.ts'
import stateHostFirmware from './stateHostFirmware.ts'
import stateHostInfo from './stateHostInfo.ts'
import stateInfo from './stateInfo.ts'
import stateInfrared from './stateInfrared.ts'
import stateLabel from './stateLabel.ts'
import stateLight from './stateLight.ts'
import stateLocation from './stateLocation.ts'
import stateMultiZone from './stateMultiZone.ts'
import stateOwner from './stateOwner.ts'
import statePower from './statePower.ts'
import stateService from './stateService.ts'
import stateTemperature from './stateTemperature.ts'
import stateVersion from './stateVersion.ts'
import stateWifiFirmware from './stateWifiFirmware.ts'
import stateWifiInfo from './stateWifiInfo.ts'
import stateZone from './stateZone.ts'

export const packets = {
    /*
     * Device related packets
     */
    acknowledgement,

    getService,
    stateService,

    getHostInfo,
    stateHostInfo,

    getHostFirmware,
    stateHostFirmware,

    getWifiInfo,
    stateWifiInfo,

    getWifiFirmware,
    stateWifiFirmware,

    getLabel,
    setLabel,
    stateLabel,

    getPower,
    setPower,
    statePower,

    getVersion,
    stateVersion,

    getInfo,
    stateInfo,

    rebootRequest,
    rebootResponse,

    echoRequest,
    echoResponse,

    getLocation,
    stateLocation,

    getOwner,
    stateOwner,

    getGroup,
    //stateGroup,


    /*
     * Light device related packages
     */
    getLight,
    stateLight,

    setColor,
    setWaveform,

    getTemperature,
    stateTemperature,

    getInfrared,
    setInfrared,
    stateInfrared,

    /*
     * Sensor related packages
     */
    getAmbientLight,
    stateAmbientLight,

    /*
     * MultiZone device related packages
     */
    getColorZones,
    setColorZones,
    stateZone,
    stateMultiZone,
} 

interface PacketInfo {
    size: number,
    tagged ?: boolean
    // deno-lint-ignore ban-types
    toObject ?: (buf:Uint8Array) => object
    toBuffer ?: (obj: unknown) => Uint8Array
}

type PacketsCatalog = typeof packets
export type PacketType = keyof PacketsCatalog
export type PacketCreateCustomData<K extends PacketType> = PacketsCatalog[K] extends {toBuffer: (obj: never) => Uint8Array} ? Parameters<PacketsCatalog[K]["toBuffer"]>[0] : Record<never, never>
export type PacketHandleCustomData<K extends PacketType> = PacketsCatalog[K] extends {toObject: (obj: Uint8Array) => unknown} ? ReturnType<PacketsCatalog[K]["toObject"]> : Record<never, never>

export const packetMap = packets as Record<string, PacketInfo>
