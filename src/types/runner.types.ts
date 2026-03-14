import type {
  ActiveAbility,
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
import type { BodyPartStatus, ShellArchetype, ShellStatus } from '@app-types/constant.types.js';

export type Runner = {
  name: string;
  story: string;
  original_appearance: string;

  credits: number;
  stash: (Weapon | Armor | Consumable | Mod | Gear | Implant | Core | Artifact)[];

  shells: Shell[];
};

export type ShellAnatomy = {
  head: BodyPartStatus; // VITAL
  torso: BodyPartStatus; // VITAL
  left_arm: BodyPartStatus;
  right_arm: BodyPartStatus;
  left_leg: BodyPartStatus;
  right_leg: BodyPartStatus;
};

export type Shell = {
  callsign: string;

  shell_status: ShellStatus;
  shell: ShellArchetype;

  prime_ability: ActiveAbility | null;
  tactical_ability: ActiveAbility | null;

  word_budget_per_turn: number;

  current_oxygen_percentage: number; // 0 a 100
  max_oxygen_capacity: number;
  is_oxygen_leaking: boolean; // Torna o jogo passível de DoT (Damage over Time) no O2

  anatomy: ShellAnatomy;

  equipped: {
    primary_weapon: Weapon | null;
    secondary_weapon: Weapon | null;
    armor: Armor | null;
    implants: Implant[];
    core: Core | null;
    gear: Gear | null;
  };

  max_backpack_slots: number;
  backpack: (
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
