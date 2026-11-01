// Pixel maximalist: every surface gets a ramp of five or more colors, skies are banded sunsets, and each aircraft
// system has its own color of light. 0xRRGGBB.

pub const NIGHT: u32 = 0x120826;

// a sunset that runs from violet through magenta to gold: the room the dioramas float in
pub const SKY: [u32; 11] = [0x150936, 0x22104f, 0x341667, 0x4d1c7c, 0x6c2189, 0x93298f, 0xbd358f, 0xe4498a, 0xff6c7a, 0xff9963, 0xffc65e];

// the airplane
pub const SKIN: [u32; 7] = [0x3d3e72, 0x5a5f94, 0x8088b8, 0xa9b2d8, 0xcfd7f0, 0xeef2ff, 0xffffff];
pub const METAL: [u32; 6] = [0x2a2440, 0x4a4466, 0x6e6a8c, 0x9a98b4, 0xc8c8dc, 0xf0f0fa];
pub const DARK: [u32; 4] = [0x0e0a1c, 0x1a1430, 0x2a2244, 0x3a3258];
pub const LIVERY: [u32; 7] = [0x1c1060, 0x3a1a9a, 0x6a26c8, 0xa92fc7, 0xe0409e, 0xff6b74, 0xffa94d];
pub const TIRE: [u32; 3] = [0x120c1c, 0x231a30, 0x382c48];
pub const COMPOSITE: [u32; 5] = [0x1a1a2a, 0x2a2a40, 0x3c3c58, 0x52526e, 0x6c6c88];

// systems, each in its own light
pub const FUEL: u32 = 0xffa63a;
pub const FUEL_CORE: u32 = 0xffd27a;
pub const HYD_L: u32 = 0x4dff7a;
pub const HYD_C: u32 = 0x3ad9ff;
pub const HYD_R: u32 = 0xc6ff3a;
pub const ELECTRIC: u32 = 0x5af2ff;
pub const ELECTRIC_CORE: u32 = 0xd2fcff;
pub const AIR: u32 = 0xaecbff;
pub const AIR_CORE: u32 = 0xeaf2ff;
pub const SIGNAL: u32 = 0xd36bff;
pub const SIGNAL_CORE: u32 = 0xf2d2ff;
pub const HOT: [u32; 6] = [0x6a1020, 0xc0242a, 0xff5a1f, 0xff9a2a, 0xffd86a, 0xfff8e0];
pub const COLD: [u32; 4] = [0x2a4a9a, 0x3a7ad8, 0x6ab4ff, 0xbfe4ff];

// screens on the flight deck
pub const SCREEN: u32 = 0x05060f;
pub const SYM_GREEN: u32 = 0x5dff8a;
pub const SYM_MAGENTA: u32 = 0xff5cf0;
pub const SYM_CYAN: u32 = 0x5ce8ff;
pub const SYM_WHITE: u32 = 0xf4f6ff;
pub const SYM_AMBER: u32 = 0xffb63a;
pub const ADI_SKY: [u32; 3] = [0x1c5bd8, 0x2f78ee, 0x4e95ff];
pub const ADI_GROUND: [u32; 3] = [0x7a3d16, 0x934c1d, 0xab5c24];

