import type {
  DamageLevel,
  DamageType,
  NPCTier,
  ProtectionLevel,
  ProtectionType,
  ShellStatus,
  WeaponRange,
} from '@app-types/constant.types.js';
import type {
  Armor,
  Artifact,
  Consumable,
  Core,
  Gear,
  HackTool,
  Implant,
  Key,
  Mod,
  Weapon,
} from '@app-types/items.types.js';

// ==========================================
// NPC (Inimigos do Ambiente / Não-Runners)
// ==========================================
export type NPC = {
  id: string; // Ex: 'traxus_security_drone'
  name: string;
  description: string;
  appearance: string;

  tier: NPCTier;

  // --- STATUS DE COMBATE ---
  // Usa o same status de vida da Shell para a matemática bater
  health_status: ShellStatus;

  protection_level: ProtectionLevel | null;
  protection_type: ProtectionType | null;

  // O dano inato do NPC (uma garra, um laser embutido)
  base_damage_level: DamageLevel;
  base_damage_type: DamageType;
  optimal_attack_range: WeaponRange;
  hit_chance: number; // Equivalente ao 02 do Runner

  // --- RECOMPENSAS ---
  // O que cai no chão (Room) quando o Motor TS decreta 'DESTROYED'
  guaranteed_loot: (
    | Weapon
    | Armor
    | Consumable
    | Mod
    | Gear
    | Implant
    | Core
    | Artifact
    | HackTool
    | Key
  )[];
};

// ==========================================
// NOTA ARQUITETURAL PARA A ENGINE TS:
// ==========================================
// Runners Inimigos NÃO precisam de um tipo novo.
// A engine deve instanciar um Runner Inimigo utilizando o tipo `Shell` importado de `runner.types.ts`.
//
// No estado do jogo (GameState), a sala atual (CurrentRoom) terá algo como:
// active_enemies: (NPC | Shell)[];
