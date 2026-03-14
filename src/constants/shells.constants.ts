import type { Shell, ShellAnatomy } from '@app-types/runner.types.js';
import type { ActiveAbility } from '@app-types/items.types.js';
import {
  STARTER_ARMOR,
  STARTER_KNIFE,
  STARTER_MEDPATCH,
  STARTER_O2_CYLINDER,
  STARTER_PISTOL,
} from '@constants/starter_items.constants.js';

// ==========================================
// BASES E HELPERS (Para evitar repetição de código)
// ==========================================

export const DEFAULT_ANATOMY: ShellAnatomy = {
  head: 'INTACT',
  torso: 'INTACT',
  left_arm: 'INTACT',
  right_arm: 'INTACT',
  left_leg: 'INTACT',
  right_leg: 'INTACT',
};

// Tipagem rigorosa: É uma ActiveAbility, mas sem os campos obrigatórios que vamos preencher depois
type NullAbilityBase = Omit<
  ActiveAbility,
  'name' | 'description' | 'target_room' | 'turns_cooldown' | 'available_uses_in_a_run'
>;

// Agora o TS sabe exatamente que esses "nulls" pertencem aos tipos corretos (DamageType | null, etc)
const NULL_ABILITY_FIELDS: NullAbilityBase = {
  recovery_amount: null,
  recovery_type: null,
  damage_level: null,
  damage_type: null,
  can_bypass_protections: null,
  protection_level: null,
  protection_type: null,
  turns_protection_duration: null,
  utility_type: null,
  vision_detail: null,
  turns_block_vision_duration: null,
  turns_stun_duration: null,
};

// ==========================================
// HABILIDADES DAS SHELLS
// ==========================================

const DESTROYER_PRIME: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Search and Destroy',
  description: 'Lança mísseis de ombro guiados em todos os inimigos da sala.',
  target_room: 'CURRENT_ROOM',
  damage_level: 'HEAVY',
  damage_type: 'PHYSICAL',
  can_bypass_protections: false,
  turns_cooldown: 4,
  available_uses_in_a_run: 3,
};

const DESTROYER_TACTICAL: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Riot Barricade',
  description: 'Ergue um escudo de energia frontal pesado.',
  target_room: 'CURRENT_ROOM',
  protection_level: 'HEAVY',
  protection_type: 'ENERGY',
  turns_protection_duration: 1,
  turns_cooldown: 2,
  available_uses_in_a_run: 99,
};

const ASSASSIN_PRIME: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Smoke Screen',
  description: 'Cortina de fumaça que cega inimigos na sala atual.',
  target_room: 'CURRENT_ROOM',
  utility_type: 'BLOCK_VISION',
  turns_block_vision_duration: 1,
  turns_cooldown: 3,
  available_uses_in_a_run: 4,
};

const ASSASSIN_TACTICAL: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Active Camo',
  description: 'Fica invisível para se esgueirar por salas sem iniciar combate.',
  target_room: 'CURRENT_ROOM',
  utility_type: 'STEALTH',
  turns_cooldown: 3,
  available_uses_in_a_run: 99,
};

const RECON_PRIME: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Echo Pulse',
  description: 'Emite um pulso de sonar revelando loot e inimigos na próxima sala.',
  target_room: 'NEXT_ROOM',
  utility_type: 'VISION',
  vision_detail: 'HIGH',
  turns_cooldown: 2,
  available_uses_in_a_run: 5,
};

const VANDAL_PRIME: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Amplify',
  description: 'Overclock nos sistemas motores. Permite pular uma sala no mesmo turno.',
  target_room: 'CURRENT_ROOM',
  utility_type: 'MOBILITY_BUFF',
  turns_cooldown: 4,
  available_uses_in_a_run: 3,
};

const THIEF_TACTICAL: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Pickpocket Drone',
  description: 'Envia um drone rápido para lootear a próxima sala em segurança.',
  target_room: 'NEXT_ROOM',
  utility_type: 'LOOT_DRONE',
  turns_cooldown: 1,
  available_uses_in_a_run: 99,
};

const TRIAGE_TACTICAL: ActiveAbility = {
  ...NULL_ABILITY_FIELDS,
  name: 'Stim Injector',
  description: 'Injeta O2 purificado diretamente na corrente da Shell.',
  target_room: 'CURRENT_ROOM',
  recovery_amount: 20,
  recovery_type: 'OXYGEN',
  turns_cooldown: 3,
  available_uses_in_a_run: 10,
};

// ==========================================
// OS ARQUÉTIPOS INICIAIS (TEMPLATES)
// ==========================================

export const DESTROYER_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_DESTROYER',
  shell_status: 'INTACT',
  shell: 'DESTROYER',
  prime_ability: DESTROYER_PRIME,
  tactical_ability: DESTROYER_TACTICAL,
  word_budget_per_turn: 25, // Lento, direto ao ponto
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: STARTER_PISTOL,
    secondary_weapon: STARTER_KNIFE,
    armor: STARTER_ARMOR,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 15,
  backpack: [STARTER_O2_CYLINDER, STARTER_MEDPATCH],
};

export const ASSASSIN_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_ASSASSIN',
  shell_status: 'INTACT',
  shell: 'ASSASSIN',
  prime_ability: ASSASSIN_PRIME,
  tactical_ability: ASSASSIN_TACTICAL,
  word_budget_per_turn: 50, // Ágil
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: STARTER_PISTOL,
    secondary_weapon: STARTER_KNIFE,
    armor: STARTER_ARMOR,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 10,
  backpack: [STARTER_O2_CYLINDER, STARTER_MEDPATCH],
};

export const RECON_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_RECON',
  shell_status: 'INTACT',
  shell: 'RECON',
  prime_ability: RECON_PRIME,
  tactical_ability: null, // Sem táctica base no template, precisa instalar
  word_budget_per_turn: 40,
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: STARTER_PISTOL,
    secondary_weapon: STARTER_KNIFE,
    armor: STARTER_ARMOR,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 12,
  backpack: [STARTER_O2_CYLINDER, STARTER_MEDPATCH],
};

export const VANDAL_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_VANDAL',
  shell_status: 'INTACT',
  shell: 'VANDAL',
  prime_ability: VANDAL_PRIME,
  tactical_ability: null,
  word_budget_per_turn: 60, // Extrema agilidade narrativa
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: STARTER_PISTOL,
    secondary_weapon: STARTER_KNIFE,
    armor: null, // Vandal sacrifica armadura por velocidade base
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 10,
  backpack: [STARTER_O2_CYLINDER, STARTER_MEDPATCH],
};

export const THIEF_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_THIEF',
  shell_status: 'INTACT',
  shell: 'THIEF',
  prime_ability: null,
  tactical_ability: THIEF_TACTICAL,
  word_budget_per_turn: 50,
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: STARTER_PISTOL,
    secondary_weapon: STARTER_KNIFE,
    armor: STARTER_ARMOR,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 20, // Maior inventário do jogo
  backpack: [STARTER_O2_CYLINDER, STARTER_MEDPATCH],
};

export const TRIAGE_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_TRIAGE',
  shell_status: 'INTACT',
  shell: 'TRIAGE',
  prime_ability: null,
  tactical_ability: TRIAGE_TACTICAL,
  word_budget_per_turn: 40,
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: STARTER_PISTOL,
    secondary_weapon: STARTER_KNIFE,
    armor: STARTER_ARMOR,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 15,
  backpack: [STARTER_O2_CYLINDER, STARTER_MEDPATCH, STARTER_MEDPATCH], // Bônus médico inicial
};

export const ROOK_TEMPLATE: Shell = {
  callsign: 'UNASSIGNED_ROOK',
  shell_status: 'INTACT',
  shell: 'ROOK',
  prime_ability: null, // Sem mágica, apenas você e o vácuo
  tactical_ability: null,
  word_budget_per_turn: 30, // Padrão
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: { ...DEFAULT_ANATOMY },
  equipped: {
    primary_weapon: null, // Entra desarmado (apenas faca)
    secondary_weapon: STARTER_KNIFE,
    armor: null, // Entra sem proteção
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 10,
  backpack: [STARTER_O2_CYLINDER], // Sobrevivência nua e crua
};
