import type {
  BodyPart,
  DamageLevel,
  DamageType,
  Durability,
  ProtectionLevel,
  ProtectionType,
  RecoveryType,
  RoomTarget,
  ShellArchetype,
  UtilityType,
  VisionDetail,
  WeaponRange,
} from './constant.types.js';

export type ActiveAbility = {
  name: string;
  description: string;

  target_room: RoomTarget | null;

  recovery_amount: number | null;
  recovery_type: RecoveryType | null;

  damage_level: DamageLevel | null;
  damage_type: DamageType | null;
  can_bypass_protections: boolean | null;

  protection_level: ProtectionLevel | null;
  protection_type: ProtectionType | null;
  turns_protection_duration: number | null;

  utility_type: UtilityType | null;
  vision_detail: VisionDetail | null;
  turns_block_vision_duration: number | null;
  turns_stun_duration: number | null;

  turns_cooldown: number;
  available_uses_in_a_run: number;
};

// --- ARMAS ---
export type Weapon = {
  name: string;
  description: string;
  appearance: string;
  type: 'WEAPON';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  attack_range: WeaponRange;
  damage_level: DamageLevel;
  damage_type: DamageType;
  can_bypass_protections: boolean;

  durability_level: Durability;
  current_durability_level: Durability;

  mods: Mod[];
};

// --- ARMADURAS ---
export type Armor = {
  name: string;
  description: string;
  appearance: string;
  type: 'ARMOR';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  compatible_with_body_parts: BodyPart[];
  protection_level: ProtectionLevel;
  protection_type: ProtectionType;

  durability_level: Durability;
  current_durability_level: Durability;

  mod: Mod | null;
};

// --- MODIFICADORES ---
export type Mod = {
  name: string;
  description: string;
  appearance: string;
  type: 'MOD';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  gives_bonus_damage: boolean | null;
  gives_bonus_protection: boolean | null;
  changes_damage_type_to: DamageType | null;

  compatible_with: 'WEAPON' | 'ARMOR';
  compatible_with_body_parts_protection: BodyPart[] | null;

  durability_level: Durability;
  current_durability_level: Durability;
};

// --- IMPLANTES ---
export type Implant = {
  name: string;
  description: string;
  appearance: string;
  type: 'IMPLANT';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  compatible_with_body_parts: BodyPart[];
  ability: ActiveAbility;
};

// --- EQUIPAMENTOS TÁTICOS ---
export type Gear = {
  name: string;
  description: string;
  appearance: string;
  type: 'GEAR';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  durability_level: Durability;
  current_durability_level: Durability;

  ability: ActiveAbility;
};

// --- FERRAMENTAS DE INVASÃO ---
export type HackTool = {
  name: string;
  description: string;
  appearance: string;
  type: 'HACK_TOOL';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  uses: number;
  quantity_in_stack: number;

  can_bypass_heavy_locks: boolean;
};

// --- CHAVES DE ACESSO (NOVO) ---
export type Key = {
  name: string;
  description: string;
  appearance: string;
  type: 'KEY';

  buy_price: null; // Chaves não se compram no lobby
  sell_price: number; // Podem ser vendidas se sobrar
  slots_taken: number;

  key_id: string; // Ex: 'traxus_sector_3_pass' - Tem que bater com a porta
};

// --- CONSUMÍVEIS ---
export type Consumable = {
  name: string;
  description: string;
  appearance: string;
  type: 'CONSUMABLE';

  buy_price: number | null;
  sell_price: number;

  slots_taken: number;
  uses: number;
  quantity_in_stack: number;

  ability: ActiveAbility;
};

// --- ARTEFATOS ---
export type Artifact = {
  name: string;
  description: string;
  appearance: string;
  type: 'ARTIFACT';

  buy_price: null;
  sell_price: number;
  slots_taken: number;

  is_prime_artifact: boolean;
};

// --- NÚCLEOS ---
export type Core = {
  name: string;
  description: string;
  appearance: string;
  type: 'CORE';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  compatible_with_archetype: ShellArchetype;

  modifies_damage_level_to: DamageLevel | null;
  modifies_utility_type_to: UtilityType | null;
};
