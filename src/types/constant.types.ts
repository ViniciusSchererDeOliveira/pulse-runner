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
  | 'LOOT_DRONE';
export type VisionDetail = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecoveryType = 'HEALTH' | 'OXYGEN' | 'ENERGY';

// --- ESPACIALIDADE (Para Habilidades de Salas Lineares) ---
export type RoomTarget = 'CURRENT_ROOM' | 'NEXT_ROOM' | 'PREVIOUS_ROOM' | 'ANY';

// --- DURABILIDADE E STATUS ---
export type Durability = 'DESTROYED' | 'DAMAGED' | 'INTACT';
// Adicionado 'DESTROYED' para Torso/Head (Fatais)
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
  | 'ARTIFACT';

// --- PARTES DE CORPO ---
export type BodyPart = 'HEAD' | 'TORSO' | 'LEFT-ARM' | 'RIGHT-ARM' | 'LEFT-LEG' | 'RIGHT-LEG';

// --- SHELL ---
export type ShellStatus = 'DAMAGED' | 'DESTROYED' | 'INTACT'; // 50% HP, 0% HP, 100% HP
export type ShellArchetype =
  | 'DESTROYER'
  | 'ASSASSIN'
  | 'RECON'
  | 'VANDAL'
  | 'THIEF'
  | 'TRIAGE'
  | 'ROOK';
