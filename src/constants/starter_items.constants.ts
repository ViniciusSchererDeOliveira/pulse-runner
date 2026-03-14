import type { Armor, Consumable, Weapon } from '@app-types/items.types.js';

// ==========================================
// ARMAS INICIAIS
// ==========================================

export const STARTER_PISTOL: Weapon = {
  name: 'Traxus M-Series Sidearm',
  description:
    'Pistola balística padrão de fabricação corporativa. Confiável, mas fraca contra armaduras pesadas.',
  appearance: 'Pistola cinza fosca com o logo da Traxus desgastado na lateral.',
  type: 'WEAPON',

  buy_price: 500,
  sell_price: 100,
  slots_taken: 1, // Arma secundária/pequena ocupa 1 slot

  attack_range: 'SHORT',
  damage_level: 'LIGHT',
  damage_type: 'PHYSICAL',
  can_bypass_protections: false,

  durability_level: 'INTACT',
  current_durability_level: 'INTACT',

  mods: [],
};

export const STARTER_KNIFE: Weapon = {
  name: 'Runner Utility Knife',
  description:
    'Faca tática de sobrevivência. Boa para abrir caixas ou como último recurso no corpo a corpo.',
  appearance: 'Lâmina de aço de carbono simples com cabo emborrachado.',
  type: 'WEAPON',

  buy_price: 150,
  sell_price: 25,
  slots_taken: 1,

  attack_range: 'MELEE',
  damage_level: 'LIGHT',
  damage_type: 'PHYSICAL',
  can_bypass_protections: false,

  durability_level: 'INTACT',
  current_durability_level: 'INTACT',

  mods: [],
};

// ==========================================
// ARMADURA INICIAL
// ==========================================

export const STARTER_ARMOR: Armor = {
  name: 'Standard Security Rig',
  description:
    'Colete balístico leve de fibra sintética. Oferece proteção mínima contra armas de fogo convencionais.',
  appearance: 'Colete tático verde-oliva sem placas extras, apenas tecido Kevlar básico.',
  type: 'ARMOR',

  buy_price: 800,
  sell_price: 150,
  slots_taken: 4, // Armaduras ocupam mais espaço na mochila se não estiverem equipadas

  compatible_with_body_parts: ['TORSO'], // Cobre apenas o centro de massa
  protection_level: 'LIGHT',
  protection_type: 'PHYSICAL',

  durability_level: 'INTACT',
  current_durability_level: 'INTACT',

  mod: null,
};

// ==========================================
// CONSUMÍVEIS INICIAIS (Obrigatórios para sobreviver)
// ==========================================

export const STARTER_O2_CYLINDER: Consumable = {
  name: 'Emergency O2 Canister',
  description:
    'Um cilindro de oxigênio de uso único para manter a Shell respirando por mais algum tempo.',
  appearance: 'Pequeno cilindro de alumínio com uma válvula de engate rápido.',
  type: 'CONSUMABLE',

  buy_price: 200,
  sell_price: 50,
  slots_taken: 1,
  uses: 1,
  quantity_in_stack: 1,

  ability: {
    name: 'O2 Flush',
    description: 'Restaura uma quantidade básica de oxigênio nos sistemas da Shell.',
    target_room: 'CURRENT_ROOM', // Ocorre onde o Runner está

    recovery_amount: 30, // Ex: Restaura 30% do oxigênio
    recovery_type: 'OXYGEN',

    // Nenhuma função de dano, proteção ou utilidade extra
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

    turns_cooldown: 0,
    available_uses_in_a_run: 1,
  },
};

export const STARTER_MEDPATCH: Consumable = {
  name: 'Synthetic Med-Patch',
  description: 'Adesivo médico que repara danos leves à anatomia da Shell.',
  appearance: 'Pacote plástico contendo um gel reparador biossintético.',
  type: 'CONSUMABLE',

  buy_price: 300,
  sell_price: 75,
  slots_taken: 1,
  uses: 1,
  quantity_in_stack: 1,

  ability: {
    name: 'Apply Patch',
    description: 'Cura danos superficiais da Shell.',
    target_room: 'CURRENT_ROOM',

    recovery_amount: 25, // Ex: Restaura 25 de integridade do núcleo
    recovery_type: 'HEALTH',

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

    turns_cooldown: 0,
    available_uses_in_a_run: 1,
  },
};
