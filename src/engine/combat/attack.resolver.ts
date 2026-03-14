import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';
import type { Weapon } from '@app-types/items.types.js';
import type {
  CoverType,
  DamageLevel,
  DamageType,
  Durability,
  ProtectionLevel,
  ProtectionType,
  ShellStatus,
  WeaponRange,
  BodyPartStatus,
} from '@app-types/constant.types.js';

// --- TIERS BASEADOS EM ESTADOS ---
export const DAMAGE_TIERS: Record<DamageLevel, number> = {
  LIGHT: 1,
  MEDIUM: 2,
  HEAVY: 3,
  ABSOLUTE: 4,
  DEVASTATING: 5,
} as const;

export const PROTECTION_TIERS: Record<ProtectionLevel | CoverType | 'NONE', number> = {
  NONE: 0,
  LIGHT: 1,
  MEDIUM: 2,
  HEAVY: 3,
  ABSOLUTE: 4,
} as const;

// Available body parts for fallback ricochet
export const BODY_PARTS: string[] = [
  'head',
  'torso',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
];

export interface AttackParams {
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
  tacticalScore: number; // Player's tactical score for hit chance calculation
  attackerO2Percentage?: number; // Optional O2 percentage for hit chance calculation
}

export interface AttackResult {
  hitChance: number;
  doesItHit: boolean;
  /** Which body part was ultimately hit (targeted or random fallback) */
  hitBodyPart: string;
  /** Was it a precision hit (true) or a fallback/ricochet hit (false) */
  isPrecisionHit: boolean;
  initialDamageTier: number;
  remainingDamageTier: number;
  newCoverDurability: Durability;
  newTargetArmorDurability: Durability;
  targetHealthAfter: ShellStatus;
  targetWasInCover: boolean;
  /** Detailed anatomy damage if target is a Shell */
  targetAnatomyDamage?: Record<string, BodyPartStatus> | undefined;
}

/**
 * Calculates hit chance based on tactical score and O2 levels.
 * Formula: hitChance = Math.ceil((tacticalScore + currentO2Percentage) / 2)
 * Hit chance derives entirely from player's tactical choices and physical state.
 *
 * @param tacticalScore - The player's tactical score (0-100)
 * @param o2Percentage - Current O2 percentage (0-100), defaults to 100 if not provided
 * @returns The final hit chance (0-100)
 */
export function calculateHitChance(tacticalScore: number, o2Percentage: number = 100): number {
  const hitChance = Math.ceil((tacticalScore + o2Percentage) / 2);
  return Math.max(0, Math.min(100, hitChance));
}

/**
 * Two-Step Hit Resolution:
 * 1. Global Hit Roll: Roll against hitChance to see if attack connects at all
 * 2. Precision Hit Roll: If Global Hit succeeds, roll against same hitChance to hit targeted body part
 * 3. Fallback: If Precision fails but Global succeeded, hit a random body part (ricochet/graze)
 *
 * @param hitChance - The calculated hit chance (0-100)
 * @param globalRoll - Random roll for global hit (0-1), defaults to Math.random()
 * @param precisionRoll - Random roll for precision hit (0-1), defaults to Math.random()
 * @param targetedBodyPart - The originally targeted body part
 * @returns Object with hit resolution details
 */
export function resolveTwoStepHit(
  hitChance: number,
  globalRoll: number = Math.random(),
  precisionRoll: number = Math.random(),
  targetedBodyPart: string,
): {
  doesItHit: boolean;
  isPrecisionHit: boolean;
  hitBodyPart: string;
} {
  const rollForGlobal = globalRoll * 100;
  const rollForPrecision = precisionRoll * 100;

  // Step 1: Global Hit Check
  if (rollForGlobal >= hitChance) {
    // Total miss - attack fails completely
    return {
      doesItHit: false,
      isPrecisionHit: false,
      hitBodyPart: '',
    };
  }

  // Step 2: Precision Hit Check (only if Global Hit succeeded)
  if (rollForPrecision < hitChance) {
    // Perfect hit - hits the targeted body part
    return {
      doesItHit: true,
      isPrecisionHit: true,
      hitBodyPart: targetedBodyPart,
    };
  }

  // Step 3: Fallback (Ricochet/Graze) - hits a random body part
  const randomBodyPart = getRandomBodyPart(targetedBodyPart);
  return {
    doesItHit: true,
    isPrecisionHit: false,
    hitBodyPart: randomBodyPart,
  };
}

/**
 * Gets a random body part different from the excluded one.
 * Used for ricochet/graze fallback when precision hit fails.
 *
 * @param excludedPart - The body part to exclude (typically the targeted one)
 * @returns A random body part from the remaining options
 */
export function getRandomBodyPart(excludedPart: string): string {
  const availableParts = BODY_PARTS.filter(part => part !== excludedPart);
  const randomIndex = Math.floor(Math.random() * availableParts.length);
  return availableParts[randomIndex] ?? 'torso'; // Default fallback
}

export function doesAttackHit(hitChance: number, randomFactor: number = Math.random()): boolean {
  return randomFactor * 100 < hitChance;
}

export function calculateEffectiveDamageTier(
  baseDamageLevel: DamageLevel,
  damageType: DamageType,
  protectionType: ProtectionType | 'NONE',
  weaponRange: WeaponRange,
  roomIdealRanges: WeaponRange[],
): number {
  let tier = DAMAGE_TIERS[baseDamageLevel] || 0;

  if (roomIdealRanges.includes(weaponRange)) {
    tier = Math.min(5, tier + 1);
  }

  if (protectionType !== 'NONE' && damageType === (protectionType as unknown as DamageType)) {
    tier = Math.max(0, tier - 1);
  }

  return tier;
}

/**
 * Resolve o impacto contra qualquer barreira física (Cover ou Armadura).
 * Retorna quanta força (Tier) sobrou da bala e o novo estado da barreira.
 */
export function resolveBarrierImpact(
  incomingDamageTier: number,
  barrierTierLevel: number,
  barrierDurability: Durability,
): { remainingDamageTier: number; newDurability: Durability } {
  if (barrierTierLevel === 0 || barrierDurability === 'DESTROYED') {
    return { remainingDamageTier: incomingDamageTier, newDurability: barrierDurability };
  }

  if (incomingDamageTier > barrierTierLevel) {
    // Tiro ATRAVESSA a barreira. Destrói ela, mas perde força igual ao nível da barreira.
    return {
      remainingDamageTier: incomingDamageTier - barrierTierLevel,
      newDurability: 'DESTROYED',
    };
  } else if (incomingDamageTier === barrierTierLevel) {
    // Tiro FICA PRESO na barreira. A bala para, mas a barreira degrada.
    let newDur: Durability = barrierDurability;
    if (barrierDurability === 'INTACT') newDur = 'DAMAGED';
    else if (barrierDurability === 'DAMAGED') newDur = 'DESTROYED';

    return { remainingDamageTier: 0, newDurability: newDur };
  } else {
    // Tiro NEM ARRANHA a barreira.
    return { remainingDamageTier: 0, newDurability: barrierDurability };
  }
}

/**
 * Aplica o dano residual (em Tiers) direto na carne/lataria do alvo.
 */
export function applyDamageToTarget(
  currentHealth: ShellStatus,
  remainingDamageTier: number,
): ShellStatus {
  if (currentHealth === 'DESTROYED' || remainingDamageTier === 0) return currentHealth;

  // Se sobrou tier 2 ou mais passando de todas as defesas, é hit massivo.
  if (remainingDamageTier >= 2) return 'DESTROYED';

  // Tier 1 residual causa dano progressivo
  if (currentHealth === 'INTACT') return 'DAMAGED';
  return 'DESTROYED'; // Se já estava DAMAGED e tomou Tier 1, morre.
}

/**
 * Applies damage to a specific body part of a Shell target.
 * Returns updated anatomy with the damaged body part.
 */
export function applyDamageToAnatomy(
  anatomy: Record<string, BodyPartStatus>,
  bodyPart: string,
  damageTier: number,
): Record<string, BodyPartStatus> {
  const clonedAnatomy = { ...anatomy };
  const partKey = bodyPart.toLowerCase();

  if (!(partKey in clonedAnatomy)) {
    return clonedAnatomy;
  }

  const currentStatus = clonedAnatomy[partKey as keyof typeof clonedAnatomy];

  if (
    currentStatus === 'DESTROYED' ||
    currentStatus === 'SEVERED' ||
    currentStatus === 'DEACTIVATED'
  ) {
    return clonedAnatomy;
  }

  // Vital parts (head, torso) are destroyed on any significant hit
  if (partKey === 'head' || partKey === 'torso') {
    if (damageTier >= 1 && currentStatus === 'INTACT') {
      clonedAnatomy[partKey as keyof typeof clonedAnatomy] = 'DAMAGED';
    } else if (damageTier >= 1 && currentStatus === 'DAMAGED') {
      clonedAnatomy[partKey as keyof typeof clonedAnatomy] = 'DESTROYED';
    }
  } else {
    // Limbs can be severed
    if (damageTier >= 2) {
      clonedAnatomy[partKey as keyof typeof clonedAnatomy] = 'SEVERED';
    } else if (damageTier >= 1 && currentStatus === 'INTACT') {
      clonedAnatomy[partKey as keyof typeof clonedAnatomy] = 'DAMAGED';
    } else if (damageTier >= 1 && currentStatus === 'DAMAGED') {
      clonedAnatomy[partKey as keyof typeof clonedAnatomy] = 'SEVERED';
    }
  }

  return clonedAnatomy;
}

export function resolveAttack(params: AttackParams): AttackResult {
  const {
    attacker,
    target,
    weapon,
    targetProtectionLevel,
    targetProtectionType,
    targetProtectionDurability,
    targetCoverType,
    targetCoverDurability,
    roomIdealRanges,
    targetedBodyPart,
    tacticalScore,
    attackerO2Percentage,
  } = params;

  // Calculate hit chance with O2 influence
  // Formula: Math.ceil((tacticalScore + currentO2Percentage) / 2)
  const o2Level =
    attackerO2Percentage ??
    ('current_oxygen_percentage' in attacker ? attacker.current_oxygen_percentage : 100);
  const hitChance = calculateHitChance(tacticalScore, o2Level);

  // Two-Step Hit Resolution
  const hitResolution = resolveTwoStepHit(
    hitChance,
    Math.random(),
    Math.random(),
    targetedBodyPart,
  );

  const { doesItHit, isPrecisionHit, hitBodyPart } = hitResolution;

  let remainingTier = 0;
  let newCoverDur = targetCoverDurability;
  let newArmorDur = targetProtectionDurability;
  let targetHealthAfter = 'health_status' in target ? target.health_status : 'INTACT';
  let initialTier = 0;
  let targetAnatomyDamage: Record<string, BodyPartStatus> | undefined = undefined;

  if (doesItHit) {
    initialTier = calculateEffectiveDamageTier(
      weapon.damage_level,
      weapon.damage_type,
      targetProtectionType,
      weapon.attack_range,
      roomIdealRanges,
    );
    remainingTier = initialTier;

    // 1. IMPACTO NO COVER AMBIENTAL
    if (targetCoverType !== 'NONE') {
      const coverTier = PROTECTION_TIERS[targetCoverType] || 0;
      const coverResult = resolveBarrierImpact(remainingTier, coverTier, targetCoverDurability);
      remainingTier = coverResult.remainingDamageTier;
      newCoverDur = coverResult.newDurability;
    }

    // 2. IMPACTO NA ARMADURA PESSOAL (Se a bala passou pelo cover)
    if (remainingTier > 0) {
      const armorTier = PROTECTION_TIERS[targetProtectionLevel] || 0;
      const armorResult = resolveBarrierImpact(
        remainingTier,
        armorTier,
        targetProtectionDurability,
      );
      remainingTier = armorResult.remainingDamageTier;
      newArmorDur = armorResult.newDurability;
    }

    // 3. IMPACTO NA CARNE (Se a bala passou pela armadura)
    targetHealthAfter = applyDamageToTarget(targetHealthAfter, remainingTier);

    // 4. Apply anatomy-specific damage if target is a Shell
    if ('anatomy' in target && hitBodyPart) {
      targetAnatomyDamage = applyDamageToAnatomy(
        target.anatomy as Record<string, BodyPartStatus>,
        hitBodyPart,
        remainingTier,
      );
    }
  }

  return {
    hitChance,
    doesItHit,
    hitBodyPart,
    isPrecisionHit,
    initialDamageTier: initialTier,
    remainingDamageTier: remainingTier,
    newCoverDurability: newCoverDur,
    newTargetArmorDurability: newArmorDur,
    targetHealthAfter,
    targetWasInCover: targetCoverType !== 'NONE',
    targetAnatomyDamage,
  };
}
