// --- TIPOS DE REFERÊNCIA ---
// --- DANO E COMBATE ---
export type DamageLevel = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'DEVASTATING' | 'ABSOLUTE';
export type DamageType = 'PHYSICAL' | 'ENERGY' | 'THERMAL' | 'HACK' | 'BEYOND';
export type WeaponRange = 'MELEE' | 'SHORT' | 'MEDIUM' | 'LONG';

// --- PROTEÇÃO ---
export type ProtectionLevel = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'ABSOLUTE';
export type ProtectionType = 'PHYSICAL' | 'ENERGY' | 'THERMAL' | 'HACK' | 'BEYOND';

// --- UTILIDADE & RECUPERAÇÃO ---
export type UtilityType =
  | 'VISION'
  | 'BLOCK_VISION'
  | 'STUN'
  | 'STEALTH'
  | 'MOBILITY_BUFF'
  | 'LOOT_DRONE'
  | 'HACK_SYSTEM';
export type VisionDetail = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecoveryType = 'HEALTH' | 'OXYGEN' | 'ENERGY';

// --- ESPACIALIDADE (Para Habilidades de Salas Lineares) ---
export type RoomTarget = 'CURRENT_ROOM' | 'NEXT_ROOM' | 'PREVIOUS_ROOM' | 'ANY';

// --- DURABILIDADE E STATUS ---
export type Durability = 'DESTROYED' | 'DAMAGED' | 'INTACT';
export type BodyPartStatus = 'INTACT' | 'DAMAGED' | 'SEVERED' | 'DESTROYED' | 'DEACTIVATED';

// --- TIPOS DE ITEM ---
export type Items =
  | 'WEAPON'
  | 'ARMOR'
  | 'CONSUMABLE'
  | 'MOD'
  | 'GEAR'
  | 'IMPLANT'
  | 'CORE'
  | 'ARTIFACT'
  | 'HACK_TOOL'
  | 'KEY'; // NOVO ITEM FÍSICO

// --- PARTES DE CORPO ---
export type BodyPart = 'HEAD' | 'TORSO' | 'LEFT-ARM' | 'RIGHT-ARM' | 'LEFT-LEG' | 'RIGHT-LEG';

// --- SHELL ---
export type ShellStatus = 'DAMAGED' | 'DESTROYED' | 'INTACT';
export type ShellArchetype =
  | 'DESTROYER'
  | 'ASSASSIN'
  | 'RECON'
  | 'VANDAL'
  | 'THIEF'
  | 'TRIAGE'
  | 'ROOK';

export type RoomCategory = 'OUTDOOR' | 'TRANSITION' | 'HALLWAY' | 'ROOM' | 'DEAD_END';
export type CoverType = 'NONE' | 'LIGHT' | 'HEAVY';
export type LockedStatus = 'UNLOCKED' | 'REQUIRES_KEY' | 'REQUIRES_HACK';
export type NPCTier = 'MINION' | 'ELITE' | 'BOSS';
