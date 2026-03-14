import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';
import type { Weapon } from '@app-types/items.types.js';
import type {
  CoverType,
  Durability,
  ProtectionLevel,
  ProtectionType,
  ShellStatus,
  WeaponRange,
  BodyPartStatus,
} from '@app-types/constant.types.js';

export type AttackParams = {
  attacker: Shell | NPC;
  target: Shell | NPC;
  weapon: Weapon;
  targetProtectionLevel: ProtectionLevel | 'NONE';
  targetProtectionType: ProtectionType | 'NONE';
  targetProtectionDurability: Durability;
  targetCoverType: CoverType | 'NONE';
  targetCoverDurability: Durability;
  roomIdealRanges: WeaponRange[];
  targetedBodyPart: string;
  tacticalScore: number;
  attackerO2Percentage?: number;
};

export type AttackResult = {
  hitChance: number;
  doesItHit: boolean;
  hitBodyPart: string;
  isPrecisionHit: boolean;
  initialDamageTier: number;
  remainingDamageTier: number;
  newCoverDurability: Durability;
  newTargetArmorDurability: Durability;
  targetHealthAfter: ShellStatus;
  targetWasInCover: boolean;
  targetAnatomyDamage?: Record<string, BodyPartStatus> | undefined;
};

export type TwoStepHitResolution = {
  doesItHit: boolean;
  isPrecisionHit: boolean;
  hitBodyPart: string;
};

export type BarrierImpactResult = {
  remainingDamageTier: number;
  newDurability: Durability;
};
