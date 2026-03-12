// --- ESTRUTURA BASE DE HABILIDADE ATIVA ---
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

  // NOVO: Define onde a habilidade atua (Essencial para o TS Engine gerenciar as salas)
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

// --- ARMAS (Sem Habilidade Ativa, apenas Status e Mods) ---
export type Weapon = {
  name: string;
  description: string;
  appearance: string;
  type: 'WEAPON';

  // Economia e Inventário
  buy_price: number | null; // Null se for impossível comprar (só achado)
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

// --- MODIFICADORES (Apenas Status Passivo extra para a Arma/Armadura) ---
export type Mod = {
  name: string;
  description: string;
  appearance: string;
  type: 'MOD';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  // Em vez de habilidade ativa, o Mod apenas altera o comportamento do equipamento
  gives_bonus_damage: boolean | null;
  gives_bonus_protection: boolean | null;
  changes_damage_type_to: DamageType | null; // Ex: Conversor Térmico

  compatible_with: 'WEAPON' | 'ARMOR';
  compatible_with_body_parts_protection: BodyPart[] | null;

  durability_level: Durability;
  current_durability_level: Durability;
};

// --- IMPLANTES (Focado em Habilidades Cibernéticas) ---
export type Implant = {
  name: string;
  description: string;
  appearance: string;
  type: 'IMPLANT';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number; // Peso na mochila antes de instalar

  compatible_with_body_parts: BodyPart[];
  ability: ActiveAbility;
};

// --- EQUIPAMENTOS TÁTICOS (Gear - Ex: Drones, Granadas) ---
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

// --- CONSUMÍVEIS (Ex: Injetor de Vida, Cilindro de O2) ---
export type Consumable = {
  name: string;
  description: string;
  appearance: string;
  type: 'CONSUMABLE';

  buy_price: number | null;
  sell_price: number;

  // slots_taken reflete O QUANTO CADA UNIDADE PESARÁ no manager de inventário
  slots_taken: number;
  uses: number;
  quantity_in_stack: number;

  ability: ActiveAbility;
};

// --- ARTEFATOS (O Loot Principal) ---
export type Artifact = {
  name: string;
  description: string;
  appearance: string;
  type: 'ARTIFACT';

  buy_price: null; // Artefatos nunca são comprados, apenas vendidos
  sell_price: number; // Equivalente ao extraction_value
  slots_taken: number;

  is_prime_artifact: boolean;
};

// --- NÚCLEOS (Cores - Modificadores diretos da Habilidade da Classe) ---
export type Core = {
  name: string;
  description: string;
  appearance: string;
  type: 'CORE';

  buy_price: number | null;
  sell_price: number;
  slots_taken: number;

  compatible_with_archetype: ShellArchetype; // Cores SÓ funcionam na classe certa

  // Em um motor TS, o Core pode injetar novos níveis de dano na Habilidade Ativa
  modifies_damage_level_to: DamageLevel | null;
  modifies_utility_type_to: UtilityType | null;
};
