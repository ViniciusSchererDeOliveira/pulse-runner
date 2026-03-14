import { describe, expect, it, vi } from 'vitest';
import {
  calculateHitChance,
  resolveTwoStepHit,
  getRandomBodyPart,
  doesAttackHit,
  calculateEffectiveDamageTier,
  resolveBarrierImpact,
  applyDamageToTarget,
  applyDamageToAnatomy,
  resolveAttack,
  DAMAGE_TIERS,
  BODY_PARTS,
} from '../attack.resolver.js';
import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';
import type { Weapon } from '@app-types/items.types.js';
import type {
  BodyPartStatus,
  DamageLevel,
  DamageType,
  Durability,
  ProtectionLevel,
  ProtectionType,
  ShellArchetype,
  ShellStatus,
  WeaponRange,
} from '@app-types/constant.types.js';

// ==========================================
// HELPER FUNCTIONS FOR TEST DATA
// ==========================================

const createMockShell = (overrides?: Partial<Shell>): Shell => ({
  callsign: 'TEST_SHELL',
  shell_status: 'INTACT' as ShellStatus,
  shell: 'RECON' as ShellArchetype,
  prime_ability: null,
  tactical_ability: null,
  word_budget_per_turn: 150,
  current_oxygen_percentage: 100,
  max_oxygen_capacity: 100,
  is_oxygen_leaking: false,
  anatomy: {
    head: 'INTACT' as BodyPartStatus,
    torso: 'INTACT' as BodyPartStatus,
    left_arm: 'INTACT' as BodyPartStatus,
    right_arm: 'INTACT' as BodyPartStatus,
    left_leg: 'INTACT' as BodyPartStatus,
    right_leg: 'INTACT' as BodyPartStatus,
  },
  equipped: {
    primary_weapon: null,
    secondary_weapon: null,
    armor: null,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 6,
  backpack: [],
  ...overrides,
});

const createMockNPC = (overrides?: Partial<NPC>): NPC => ({
  id: 'test_npc',
  name: 'Test NPC',
  description: 'Test NPC',
  appearance: 'Test',
  tier: 'MINION' as const,
  health_status: 'INTACT' as ShellStatus,
  protection_level: 'NONE' as ProtectionLevel,
  protection_type: 'NONE' as ProtectionType,
  base_damage_level: 'LIGHT' as DamageLevel,
  base_damage_type: 'PHYSICAL' as DamageType,
  optimal_attack_range: 'SHORT' as WeaponRange,
  hit_chance: 75,
  guaranteed_loot: [],
  ...overrides,
});

const createMockWeapon = (overrides?: Partial<Weapon>): Weapon => ({
  name: 'Test Weapon',
  description: 'Test',
  appearance: 'Test',
  type: 'WEAPON' as const,
  buy_price: 100,
  sell_price: 50,
  slots_taken: 2,
  attack_range: 'MEDIUM' as WeaponRange,
  damage_level: 'HEAVY' as DamageLevel,
  damage_type: 'PHYSICAL' as DamageType,
  can_bypass_protections: false,
  durability_level: 'INTACT' as Durability,
  current_durability_level: 'INTACT' as Durability,
  mods: [],
  ...overrides,
});

// ==========================================
// TESTS: calculateHitChance
// ==========================================

describe('calculateHitChance', () => {
  describe('O2 influence on accuracy', () => {
    it('should return base accuracy at 100% O2', () => {
      const result = calculateHitChance(80, 100);
      expect(result).toBe(80);
    });

    it('should reduce hit chance proportionally at 50% O2', () => {
      const result = calculateHitChance(80, 50);
      expect(result).toBe(40);
    });

    it('should severely reduce hit chance at low O2 (10%)', () => {
      const result = calculateHitChance(90, 10);
      expect(result).toBe(9);
    });

    it('should return 0 hit chance at 0% O2', () => {
      const result = calculateHitChance(100, 0);
      expect(result).toBe(0);
    });

    it('should default to 100% O2 when not provided', () => {
      const result = calculateHitChance(75);
      expect(result).toBe(75);
    });

    it('should clamp result to maximum 100', () => {
      const result = calculateHitChance(120, 100);
      expect(result).toBe(100);
    });

    it('should clamp result to minimum 0', () => {
      const result = calculateHitChance(-10, 100);
      expect(result).toBe(0);
    });
  });
});

// ==========================================
// TESTS: resolveTwoStepHit
// ==========================================

describe('resolveTwoStepHit', () => {
  const targetedBodyPart = 'torso';

  describe('Scenario A: Total Miss (fails Global Hit)', () => {
    it('should return doesItHit: false when global roll fails', () => {
      // Global roll of 0.8 (80) vs hitChance of 70 -> Miss
      const result = resolveTwoStepHit(70, 0.8, 0.3, targetedBodyPart);
      expect(result.doesItHit).toBe(false);
      expect(result.isPrecisionHit).toBe(false);
      expect(result.hitBodyPart).toBe('');
    });

    it('should miss when global roll equals hit chance (edge case)', () => {
      const result = resolveTwoStepHit(70, 0.7, 0.3, targetedBodyPart);
      expect(result.doesItHit).toBe(false);
    });

    it('should miss when global roll is just above hit chance', () => {
      const result = resolveTwoStepHit(70, 0.7001, 0.3, targetedBodyPart);
      expect(result.doesItHit).toBe(false);
    });
  });

  describe('Scenario B: Perfect Hit (passes Global and Precision)', () => {
    it('should return precision hit when both rolls succeed', () => {
      // Global roll 0.3 (30) vs 70 -> Hit, Precision roll 0.4 (40) vs 70 -> Hit
      const result = resolveTwoStepHit(70, 0.3, 0.4, targetedBodyPart);
      expect(result.doesItHit).toBe(true);
      expect(result.isPrecisionHit).toBe(true);
      expect(result.hitBodyPart).toBe('torso');
    });

    it('should hit when both rolls are exactly at threshold', () => {
      const result = resolveTwoStepHit(70, 0.69, 0.69, targetedBodyPart);
      expect(result.doesItHit).toBe(true);
      expect(result.isPrecisionHit).toBe(true);
      expect(result.hitBodyPart).toBe('torso');
    });

    it('should hit targeted body part with low hit chance', () => {
      const result = resolveTwoStepHit(30, 0.1, 0.2, 'head');
      expect(result.doesItHit).toBe(true);
      expect(result.isPrecisionHit).toBe(true);
      expect(result.hitBodyPart).toBe('head');
    });
  });

  describe('Scenario C: Scuffed Hit / Fallback (passes Global, fails Precision)', () => {
    it('should return fallback hit when global succeeds but precision fails', () => {
      // Global roll 0.3 (30) vs 70 -> Hit, Precision roll 0.8 (80) vs 70 -> Fail
      const result = resolveTwoStepHit(70, 0.3, 0.8, targetedBodyPart);
      expect(result.doesItHit).toBe(true);
      expect(result.isPrecisionHit).toBe(false);
      expect(result.hitBodyPart).not.toBe('');
      expect(result.hitBodyPart).not.toBe('torso'); // Should be a different random part
    });

    it('should fallback to random body part excluding targeted one', () => {
      // Test multiple times to ensure randomness excludes target
      for (let i = 0; i < 10; i++) {
        const result = resolveTwoStepHit(70, 0.3, 0.9, 'head');
        expect(result.doesItHit).toBe(true);
        expect(result.isPrecisionHit).toBe(false);
        expect(result.hitBodyPart).not.toBe('head');
      }
    });

    it('should handle edge case where precision roll equals hit chance', () => {
      const result = resolveTwoStepHit(70, 0.3, 0.7, targetedBodyPart);
      expect(result.doesItHit).toBe(true);
      expect(result.isPrecisionHit).toBe(false);
    });
  });
});

// ==========================================
// TESTS: getRandomBodyPart
// ==========================================

describe('getRandomBodyPart', () => {
  it('should return a body part from the available list', () => {
    const result = getRandomBodyPart('head');
    expect(BODY_PARTS).toContain(result);
  });

  it('should exclude the specified body part', () => {
    for (let i = 0; i < 20; i++) {
      const result = getRandomBodyPart('torso');
      expect(result).not.toBe('torso');
    }
  });

  it('should handle excluding different body parts', () => {
    const excludedPart = 'left_arm';
    for (let i = 0; i < 10; i++) {
      const result = getRandomBodyPart(excludedPart);
      expect(result).not.toBe(excludedPart);
    }
  });

  it('should default to torso if somehow no parts available (edge case)', () => {
    // This tests the fallback in the function
    const result = getRandomBodyPart('nonexistent');
    expect(BODY_PARTS).toContain(result);
  });
});

// ==========================================
// TESTS: doesAttackHit
// ==========================================

describe('doesAttackHit', () => {
  it('should return true when roll is below hit chance', () => {
    expect(doesAttackHit(70, 0.5)).toBe(true);
  });

  it('should return false when roll is above hit chance', () => {
    expect(doesAttackHit(70, 0.8)).toBe(false);
  });

  it('should use Math.random when no roll provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    expect(doesAttackHit(70)).toBe(true);
    vi.restoreAllMocks();
  });
});

// ==========================================
// TESTS: calculateEffectiveDamageTier
// ==========================================

describe('calculateEffectiveDamageTier', () => {
  it('should return base damage tier without modifiers', () => {
    const tier = calculateEffectiveDamageTier(
      'HEAVY',
      'PHYSICAL',
      'NONE',
      'MEDIUM',
      ['LONG'],
    );
    expect(tier).toBe(DAMAGE_TIERS.HEAVY); // 3
  });

  it('should add +1 tier when weapon range matches room ideal range', () => {
    const tier = calculateEffectiveDamageTier(
      'HEAVY',
      'PHYSICAL',
      'NONE',
      'MEDIUM',
      ['MEDIUM', 'LONG'],
    );
    expect(tier).toBe(4); // 3 + 1
  });

  it('should subtract -1 tier when damage type matches protection type', () => {
    const tier = calculateEffectiveDamageTier(
      'HEAVY',
      'PHYSICAL',
      'PHYSICAL',
      'MEDIUM',
      ['LONG'],
    );
    expect(tier).toBe(2); // 3 - 1
  });

  it('should apply both range bonus and protection penalty', () => {
    const tier = calculateEffectiveDamageTier(
      'HEAVY',
      'PHYSICAL',
      'PHYSICAL',
      'MEDIUM',
      ['MEDIUM'],
    );
    // 3 (base) + 1 (range) - 1 (protection) = 3
    expect(tier).toBe(3);
  });

  it('should not exceed maximum tier of 5', () => {
    const tier = calculateEffectiveDamageTier(
      'DEVASTATING',
      'PHYSICAL',
      'NONE',
      'MEDIUM',
      ['MEDIUM'],
    );
    // 5 (base) + 1 (range) = 6, but capped at 5
    expect(tier).toBe(5);
  });

  it('should not go below minimum tier of 0', () => {
    const tier = calculateEffectiveDamageTier(
      'LIGHT',
      'PHYSICAL',
      'PHYSICAL',
      'MELEE',
      ['LONG'],
    );
    // 1 (base) - 1 (protection) = 0
    expect(tier).toBe(0);
  });
});

// ==========================================
// TESTS: resolveBarrierImpact
// ==========================================

describe('resolveBarrierImpact', () => {
  describe('when barrier tier is 0 or destroyed', () => {
    it('should return full damage when barrier tier is 0', () => {
      const result = resolveBarrierImpact(3, 0, 'INTACT');
      expect(result.remainingDamageTier).toBe(3);
      expect(result.newDurability).toBe('INTACT');
    });

    it('should return full damage when barrier is already destroyed', () => {
      const result = resolveBarrierImpact(3, 2, 'DESTROYED');
      expect(result.remainingDamageTier).toBe(3);
      expect(result.newDurability).toBe('DESTROYED');
    });
  });

  describe('when incoming damage > barrier tier (pierces)', () => {
    it('should destroy barrier and reduce damage by barrier tier', () => {
      const result = resolveBarrierImpact(4, 2, 'INTACT');
      expect(result.remainingDamageTier).toBe(2); // 4 - 2
      expect(result.newDurability).toBe('DESTROYED');
    });

    it('should handle damage just above barrier tier', () => {
      const result = resolveBarrierImpact(3, 2, 'INTACT');
      expect(result.remainingDamageTier).toBe(1);
      expect(result.newDurability).toBe('DESTROYED');
    });
  });

  describe('when incoming damage === barrier tier (stopped)', () => {
    it('should degrade INTACT barrier to DAMAGED with no remaining damage', () => {
      const result = resolveBarrierImpact(2, 2, 'INTACT');
      expect(result.remainingDamageTier).toBe(0);
      expect(result.newDurability).toBe('DAMAGED');
    });

    it('should destroy DAMAGED barrier with no remaining damage', () => {
      const result = resolveBarrierImpact(2, 2, 'DAMAGED');
      expect(result.remainingDamageTier).toBe(0);
      expect(result.newDurability).toBe('DESTROYED');
    });
  });

  describe('when incoming damage < barrier tier (no scratch)', () => {
    it('should not damage INTACT barrier', () => {
      const result = resolveBarrierImpact(1, 3, 'INTACT');
      expect(result.remainingDamageTier).toBe(0);
      expect(result.newDurability).toBe('INTACT');
    });

    it('should not damage DAMAGED barrier', () => {
      const result = resolveBarrierImpact(1, 3, 'DAMAGED');
      expect(result.remainingDamageTier).toBe(0);
      expect(result.newDurability).toBe('DAMAGED');
    });
  });
});

// ==========================================
// TESTS: applyDamageToTarget
// ==========================================

describe('applyDamageToTarget', () => {
  it('should return same status if already destroyed', () => {
    expect(applyDamageToTarget('DESTROYED', 3)).toBe('DESTROYED');
  });

  it('should return same status if no remaining damage', () => {
    expect(applyDamageToTarget('INTACT', 0)).toBe('INTACT');
  });

  it('should damage INTACT target to DAMAGED with tier 1', () => {
    expect(applyDamageToTarget('INTACT', 1)).toBe('DAMAGED');
  });

  it('should destroy INTACT target with tier 2+', () => {
    expect(applyDamageToTarget('INTACT', 2)).toBe('DESTROYED');
  });

  it('should destroy DAMAGED target with tier 1', () => {
    expect(applyDamageToTarget('DAMAGED', 1)).toBe('DESTROYED');
  });
});

// ==========================================
// TESTS: applyDamageToAnatomy
// ==========================================

describe('applyDamageToAnatomy', () => {
  const baseAnatomy = {
    head: 'INTACT' as BodyPartStatus,
    torso: 'INTACT' as BodyPartStatus,
    left_arm: 'INTACT' as BodyPartStatus,
    right_arm: 'INTACT' as BodyPartStatus,
    left_leg: 'INTACT' as BodyPartStatus,
    right_leg: 'INTACT' as BodyPartStatus,
  };

  it('should damage head from INTACT to DAMAGED with tier 1', () => {
    const result = applyDamageToAnatomy(baseAnatomy, 'head', 1);
    expect(result.head).toBe('DAMAGED');
  });

  it('should destroy head from DAMAGED with tier 1', () => {
    const damagedAnatomy = { ...baseAnatomy, head: 'DAMAGED' as BodyPartStatus };
    const result = applyDamageToAnatomy(damagedAnatomy, 'head', 1);
    expect(result.head).toBe('DESTROYED');
  });

  it('should sever limb with tier 2+ damage', () => {
    const result = applyDamageToAnatomy(baseAnatomy, 'left_arm', 2);
    expect(result.left_arm).toBe('SEVERED');
  });

  it('should damage limb from INTACT to DAMAGED with tier 1', () => {
    const result = applyDamageToAnatomy(baseAnatomy, 'right_leg', 1);
    expect(result.right_leg).toBe('DAMAGED');
  });

  it('should sever limb from DAMAGED with tier 1', () => {
    const damagedAnatomy = { ...baseAnatomy, left_leg: 'DAMAGED' as BodyPartStatus };
    const result = applyDamageToAnatomy(damagedAnatomy, 'left_leg', 1);
    expect(result.left_leg).toBe('SEVERED');
  });

  it('should not modify already destroyed parts', () => {
    const destroyedAnatomy = { ...baseAnatomy, torso: 'DESTROYED' as BodyPartStatus };
    const result = applyDamageToAnatomy(destroyedAnatomy, 'torso', 3);
    expect(result.torso).toBe('DESTROYED');
  });

  it('should handle nonexistent body parts gracefully', () => {
    const result = applyDamageToAnatomy(baseAnatomy, 'wing', 3);
    expect(result).toEqual(baseAnatomy);
  });

  it('should not mutate original anatomy object', () => {
    const original = { ...baseAnatomy };
    applyDamageToAnatomy(original, 'head', 1);
    expect(original.head).toBe('INTACT');
  });
});

// ==========================================
// TESTS: resolveAttack (Integration Tests)
// ==========================================

describe('resolveAttack', () => {
  const roomIdealRanges: WeaponRange[] = ['MEDIUM'];

  describe('Two-Step Hit Resolution Integration', () => {
    it('Scenario A: Total Miss - should not deal any damage', () => {
      const attacker = createMockShell({ current_oxygen_percentage: 100 });
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'DEVASTATING' });

      // Mock Math.random to ensure miss (global roll fails)
      const originalRandom = Math.random;
      Math.random = () => 0.9; // 90% roll vs 75% hit chance = miss

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'NONE',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
          attackerO2Percentage: 100,
        });

        expect(result.doesItHit).toBe(false);
        expect(result.hitBodyPart).toBe('');
        expect(result.isPrecisionHit).toBe(false);
        expect(result.remainingDamageTier).toBe(0);
        expect(result.targetHealthAfter).toBe('INTACT');
      } finally {
        Math.random = originalRandom;
      }
    });

    it('Scenario B: Perfect Hit - hits targeted body part with full damage', () => {
      const attacker = createMockShell({ current_oxygen_percentage: 100 });
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'DEVASTATING' });

      // Mock Math.random to ensure perfect hit
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        if (callCount === 1) return 0.3; // Global roll: hit
        if (callCount === 2) return 0.4; // Precision roll: hit
        if (callCount === 3) return 0.5; // For getRandomBodyPart (not used in perfect hit)
        return originalRandom();
      };

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'NONE',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'head',
          attackerO2Percentage: 100,
        });

        expect(result.doesItHit).toBe(true);
        expect(result.isPrecisionHit).toBe(true);
        expect(result.hitBodyPart).toBe('head');
        expect(result.initialDamageTier).toBeGreaterThan(0);
        expect(result.targetHealthAfter).toBe('DESTROYED');
      } finally {
        Math.random = originalRandom;
      }
    });

    it('Scenario C: Scuffed Hit - hits random body part (ricochet)', () => {
      const attacker = createMockShell({ current_oxygen_percentage: 100 });
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'HEAVY' });

      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        if (callCount === 1) return 0.3; // Global roll: hit (30 < 75)
        if (callCount === 2) return 0.9; // Precision roll: miss (90 > 75)
        if (callCount === 3) return 0.0; // For getRandomBodyPart: returns first available
        return originalRandom();
      };

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'NONE',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
          attackerO2Percentage: 100,
        });

        expect(result.doesItHit).toBe(true);
        expect(result.isPrecisionHit).toBe(false);
        expect(result.hitBodyPart).not.toBe('torso');
        expect(result.hitBodyPart).not.toBe('');
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('O2 Influence on Hit Chance', () => {
    it('should calculate lower hit chance at low O2', () => {
      const attacker = createMockShell({ current_oxygen_percentage: 30 });
      const target = createMockNPC();
      const weapon = createMockWeapon();

      const originalRandom = Math.random;
      Math.random = () => 0.5;

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'NONE',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
          attackerO2Percentage: 30,
        });

        // At 30% O2 with 75 base accuracy: 75 * 0.3 = 22.5% hit chance
        // Roll of 0.5 (50) > 22.5 = miss
        expect(result.hitChance).toBeLessThan(30);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should use attacker O2 from shell when not explicitly provided', () => {
      const attacker = createMockShell({ current_oxygen_percentage: 50 });
      const target = createMockNPC();
      const weapon = createMockWeapon();

      const result = resolveAttack({
        attacker,
        target,
        weapon,
        targetProtectionLevel: 'NONE',
        targetProtectionType: 'NONE',
        targetProtectionDurability: 'INTACT',
        targetCoverType: 'NONE',
        targetCoverDurability: 'INTACT',
        roomIdealRanges,
        targetedBodyPart: 'torso',
        // Not providing attackerO2Percentage - should use attacker.current_oxygen_percentage
      });

      expect(result.hitChance).toBe(37.5); // 75 * 0.5
    });
  });

  describe('Cover and Armor Interaction', () => {
    it('should destroy light cover with heavy damage and still hit target', () => {
      const attacker = createMockShell();
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'DEVASTATING' });

      const originalRandom = Math.random;
      Math.random = () => 0.3; // Hit

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'LIGHT',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
        });

        expect(result.doesItHit).toBe(true);
        expect(result.newCoverDurability).toBe('DESTROYED');
        expect(result.remainingDamageTier).toBeGreaterThan(0);
        expect(result.targetHealthAfter).toBe('DESTROYED');
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should have damage stopped by heavy cover with light weapon', () => {
      const attacker = createMockShell();
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'LIGHT' });

      const originalRandom = Math.random;
      Math.random = () => 0.3; // Hit

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'HEAVY',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
        });

        expect(result.doesItHit).toBe(true);
        // Heavy cover (Tier 3) vs Light damage (Tier 1): damage < barrier, so no scratch
        expect(result.newCoverDurability).toBe('INTACT');
        expect(result.remainingDamageTier).toBe(0);
        expect(result.targetHealthAfter).toBe('INTACT');
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should reduce damage with armor after penetrating cover', () => {
      const attacker = createMockShell();
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'MEDIUM' });

      const originalRandom = Math.random;
      Math.random = () => 0.3; // Hit

      try {
        const result = resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'LIGHT',
          targetProtectionType: 'PHYSICAL',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'NONE',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
        });

        expect(result.doesItHit).toBe(true);
        // Medium damage (Tier 2) vs Light armor (Tier 1): armor destroyed, 1 tier remains
        expect(result.newTargetArmorDurability).toBe('DESTROYED');
        expect(result.remainingDamageTier).toBe(1);
        // Tier 1 residual damages INTACT target to DAMAGED (not destroyed)
        expect(result.targetHealthAfter).toBe('DAMAGED');
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('State Immutability', () => {
    it('should not mutate the original target object', () => {
      const attacker = createMockShell();
      const target = createMockNPC();
      const weapon = createMockWeapon({ damage_level: 'DEVASTATING' });

      const originalTargetHealth = target.health_status;

      const originalRandom = Math.random;
      Math.random = () => 0.3;

      try {
        resolveAttack({
          attacker,
          target,
          weapon,
          targetProtectionLevel: 'NONE',
          targetProtectionType: 'NONE',
          targetProtectionDurability: 'INTACT',
          targetCoverType: 'NONE',
          targetCoverDurability: 'INTACT',
          roomIdealRanges,
          targetedBodyPart: 'torso',
        });

        // Original target should be unchanged
        expect(target.health_status).toBe(originalTargetHealth);
      } finally {
        Math.random = originalRandom;
      }
    });
  });
});
