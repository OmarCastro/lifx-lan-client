  // Ports used by LIFX
export const LIFX_DEFAULT_PORT = 56700
export const LIFX_ANY_PORT = 56800

// Masks for packet description in packet header
export const ADDRESSABLE_BIT = 0x1000
export const TAGGED_BIT = 0x2000
export const ORIGIN_BITS = 0xC000
export const PROTOCOL_VERSION_BITS = 0xFFF

// Masks for response types in packet header
export const RESPONSE_REQUIRED_BIT = 0x1
export const ACK_REQUIRED_BIT = 0x2

// Protocol version mappings
export const PROTOCOL_VERSION_CURRENT = 1024
export const PROTOCOL_VERSION_1 = 1024

// Packet headers
export const PACKET_HEADER_SIZE = 36
export const PACKET_HEADER_SEQUENCE_MAX = 255 // 8 bit

// HSBK value calculation
export const HSBK_MINIMUM_KELVIN = 1500
export const HSBK_DEFAULT_KELVIN = 3500
export const HSBK_MAXIMUM_KELVIN = 9000
export const HSBK_MINIMUM_BRIGHTNESS = 0
export const HSBK_MAXIMUM_BRIGHTNESS = 100
export const HSBK_MINIMUM_SATURATION = 0
export const HSBK_MAXIMUM_SATURATION = 100
export const HSBK_MINIMUM_HUE = 0
export const HSBK_MAXIMUM_HUE = 360

// RGB value
export const RGB_MAXIMUM_VALUE = 255
export const RGB_MINIMUM_VALUE = 0

// Infrared values
export const IR_MINIMUM_BRIGHTNESS = 0
export const IR_MAXIMUM_BRIGHTNESS = 100

// MultiZone device zone index value
export const ZONE_INDEX_MINIMUM_VALUE = 0
export const ZONE_INDEX_MAXIMUM_VALUE = 255

// Waveform values, order is important here
export const LIGHT_WAVEFORMS = ['SAW', 'SINE', 'HALF_SINE', 'TRIANGLE', 'PULSE']

// Packet types used by internal sending process
export const PACKET_TRANSACTION_TYPES = Object.freeze({
  ONE_WAY: 0 as const,
  REQUEST_RESPONSE: 1 as const
})

// Maps color names to hue and saturation mapping
// Kelvin and brightness are kept the same
export const COLOR_NAME_HS_VALUES = {
  white: { hue: 0, saturation: 0 },
  red: { hue: 0, saturation: 100 },
  orange: { hue: 35, saturation: 100 },
  yellow: { hue: 59, saturation: 100 },
  cyan: { hue: 179, saturation: 100 },
  green: { hue: 120, saturation: 100 },
  blue: { hue: 249, saturation: 100 },
  purple: { hue: 279, saturation: 100 },
  pink: { hue: 324, saturation: 100 }
}

export const APPLICATION_REQUEST_VALUES = {
  NO_APPLY: 0,
  APPLY: 1,
  APPLY_ONLY: 2
}

export interface messageQueueRecord {
  timeCreated: number
  data: Uint8Array
  address?: string
  transactionType: typeof PACKET_TRANSACTION_TYPES[keyof typeof PACKET_TRANSACTION_TYPES]
  timesSent: number
  timeLastSent: number
  sequence: number
}