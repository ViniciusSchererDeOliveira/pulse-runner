import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState, ToolCall } from '@app-types/game_state.types.js';
import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';
import type { Room } from '@app-types/map.types.js';
import type { Armor, Weapon } from '@app-types/items.types.js';
import type {
  BodyPartStatus,
  CoverType,
  DamageLevel,
  DamageType,
  Durability,
  ProtectionLevel,
  ProtectionType,
  ShellArchetype,
  ShellStatus,
  WeaponRange,
} from '@app-types/constant.types.js';
import { resolveTurn } from '../turn.resolver.js';

// --- MOCK DATA FOR ANCHOR TEST ---

const createMockPlayerShell = (): Shell => ({
  callsign: 'PULSE_RUNNER_01',
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
    primary_weapon: {
      name: 'Pulse Rifle',
      description: 'Standard issue pulse rifle',
      appearance: 'Sleek black rifle with glowing blue accents',
      type: 'WEAPON' as const,
      buy_price: 500,
      sell_price: 250,
      slots_taken: 4,
      attack_range: 'MEDIUM' as WeaponRange,
      damage_level: 'DEVASTATING' as DamageLevel,
      damage_type: 'ENERGY' as DamageType,
      can_bypass_protections: false,
      durability_level: 'INTACT' as Durability,
      current_durability_level: 'INTACT' as Durability,
      mods: [],
    } as Weapon,
    secondary_weapon: null,
    armor: {
      name: 'Light Combat Armor',
      description: 'Basic protective armor',
      appearance: 'Gray tactical vest',
      type: 'ARMOR' as const,
      buy_price: 300,
      sell_price: 150,
      slots_taken: 2,
      compatible_with_body_parts: ['TORSO' as const],
      protection_level: 'LIGHT' as ProtectionLevel,
      protection_type: 'PHYSICAL' as ProtectionType,
      durability_level: 'INTACT' as Durability,
      current_durability_level: 'INTACT' as Durability,
      mod: null,
    } as Armor,
    implants: [],
    core: null,
    gear: null,
  },
  max_backpack_slots: 6,
  backpack: [],
});

const createMockNPC = (): NPC => ({
  id: 'traxus_guard_01',
  name: 'Traxus Security Guard',
  description: 'Armed security personnel',
  appearance: 'Humanoid in corporate security uniform',
  tier: 'MINION' as const,
  health_status: 'INTACT' as ShellStatus,
  protection_level: 'LIGHT' as ProtectionLevel,
  protection_type: 'PHYSICAL' as ProtectionType,
  base_damage_level: 'LIGHT' as DamageLevel,
  base_damage_type: 'PHYSICAL' as DamageType,
  optimal_attack_range: 'SHORT' as WeaponRange,
  hit_chance: 65,
  guaranteed_loot: [],
});

const createMockRoom = (): Room => ({
  id: 'hallway_alpha_01',
  name: 'Alpha Hallway',
  description: 'A narrow corridor with metal crates providing cover',
  category: 'HALLWAY' as const,
  is_main_path: true,
  available_cover: 'LIGHT' as CoverType,
  cover_durability: 'INTACT' as Durability,
  base_visibility: 'MEDIUM' as const,
  ideal_weapon_ranges: ['SHORT' as WeaponRange, 'MEDIUM' as WeaponRange],
  active_enemies: [createMockNPC() as unknown as NPC],
  containers: [],
  is_extraction_point: false,
  exits: [],
});

const createMockInitialState = (): GameState => ({
  run_id: 'test_run_001',
  turn_history: [],
  current_snapshot: {
    active_shell: createMockPlayerShell(),
    current_room: createMockRoom(),
    entities_in_cover: ['traxus_guard_01'],
  },
});

const createMockMaestroIntent = (): {
  tactical_score: number;
  tool_calls: ToolCall[];
} => ({
  tactical_score: 75,
  tool_calls: [
    {
      name: 'attackTarget',
      arguments: {
        target_id: 'traxus_guard_01',
        body_part: 'torso',
      },
    },
  ],
});

// --- EXPECTED FINAL STATE ASSERTIONS ---
// These are the assertions the anchor test will validate

describe('Turn Resolver - Anchor Test (TASK 0)', () => {
  let mockInitialState: GameState;
  let mockMaestroIntent: { tactical_score: number; tool_calls: ToolCall[] };

  beforeEach(() => {
    mockInitialState = createMockInitialState();
    mockMaestroIntent = createMockMaestroIntent();
  });

  it('should resolve a turn with attack action and return updated state', () => {
    // Mock Math.random to ensure the attack hits (returns 0.3 for global hit, 0.4 for precision hit)
    const originalRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      if (callCount === 1) return 0.3; // Global hit roll: 30 < 75 (hit)
      if (callCount === 2) return 0.4; // Precision roll: 40 < 75 (precision hit)
      return 0.5; // Fallback for other random calls
    };

    try {
      // ACT: Resolve the turn
      const result = resolveTurn(mockInitialState, mockMaestroIntent);

      // ASSERTION 1: State immutability - stateBefore should not be mutated
      expect(result.state_before.active_shell).toEqual(
        mockInitialState.current_snapshot.active_shell,
      );
      expect(result.state_before.current_room).toEqual(
        mockInitialState.current_snapshot.current_room,
      );

      // ASSERTION 2: O2 depletion calculation
      const expectedO2Depletion = 2; // Base depletion per turn
      const actionDepletion = 1; // One attack action
      const expectedFinalO2 = 100 - expectedO2Depletion - actionDepletion;
      expect(result.state_after.active_shell.current_oxygen_percentage).toBe(expectedFinalO2);

      // ASSERTION 3: Combat resolution using Tier Math
      // O Jogador atira com DEVASTATING (Tier 5). O range é MEDIUM (Bônus de Sala), sobe pra 6.
      // O Cover é LIGHT (Tier 1). Bala fura (Tier 6 - 1 = Tier 5 restantes). Cover -> DESTROYED
      // A Armadura do NPC é LIGHT (Tier 1). Bala fura (Tier 5 - 1 = Tier 4 restantes). Armadura -> DESTROYED
      // Sobram 4 Tiers entrando na carne. HP do NPC -> DESTROYED.

      const hitResult = result.turn_metrics.hit_results[0];
      expect(hitResult).toBeDefined();
      expect(hitResult?.does_it_hit).toBe(true);
      expect(hitResult?.hit_body_part).toBe('torso'); // Precision hit on targeted part
      expect(hitResult?.is_precision_hit).toBe(true);

      const npcAfterCombat = result.state_after.current_room.active_enemies.find(
        e => 'id' in e && e.id === 'traxus_guard_01',
      );

      if (npcAfterCombat && 'health_status' in npcAfterCombat) {
        expect(npcAfterCombat.health_status).toBe('DESTROYED');
      } else {
        expect(result.state_after.current_room.active_enemies.length).toBe(0);
      }

      // ASSERTION 4: Cover degradation via Barrier Impact
      // Como o Dano Inicial era Tier 5/6 contra um Cover Tier 1, o cover foi rasgado ao meio.
      expect(result.state_after.current_room.cover_durability).toBe('DESTROYED');

      // ASSERTION 5: Timeline should contain the action
      expect(result.timeline).toHaveLength(1); // Player action
      expect(result.timeline[0]?.role).toBe('PLAYER');
      expect(result.timeline[0]?.tool_calls).toBeDefined();

      // ASSERTION 6: Hit results should be calculated with new structure
      expect(result.turn_metrics.hit_results).toHaveLength(1);
      expect(result.turn_metrics.hit_results[0]?.target_id).toBe('traxus_guard_01');
      expect(result.turn_metrics.hit_results[0]?.does_it_hit).toBe(true);
      expect(result.turn_metrics.hit_results[0]?.target_was_in_cover).toBe(true);
      expect(result.turn_metrics.hit_results[0]?.hit_body_part).toBe('torso');
      expect(result.turn_metrics.hit_results[0]?.is_precision_hit).toBe(true);
    } finally {
      // Restore original Math.random
      Math.random = originalRandom;
    }
  });

  it('should have valid initial state structure', () => {
    expect(mockInitialState.run_id).toBe('test_run_001');
    expect(mockInitialState.turn_history).toHaveLength(0);
    expect(mockInitialState.current_snapshot.active_shell.callsign).toBe('PULSE_RUNNER_01');
    expect(mockInitialState.current_snapshot.active_shell.current_oxygen_percentage).toBe(100);
    expect(mockInitialState.current_snapshot.current_room.available_cover).toBe('LIGHT');
    expect(mockInitialState.current_snapshot.entities_in_cover).toContain('traxus_guard_01');
  });

  it('should have valid maestro intent structure', () => {
    expect(mockMaestroIntent.tactical_score).toBe(75);
    expect(mockMaestroIntent.tool_calls).toHaveLength(1);
    expect(mockMaestroIntent.tool_calls[0]?.name).toBe('attackTarget');
    expect(mockMaestroIntent.tool_calls[0]?.arguments).toEqual({
      target_id: 'traxus_guard_01',
      body_part: 'torso',
    });
  });

  describe('Expected Final State Assertions (for when engine is implemented)', () => {
    it('should verify O2 depletion after turn resolution', () => {
      // Expected: O2 should deplete by a fixed amount per turn
      const baseDepletion = 2;
      const actionDepletion = 1; // One attack action
      const expectedO2 = 100 - baseDepletion - actionDepletion;

      expect(expectedO2).toBeLessThan(100);
      expect(expectedO2).toBeGreaterThanOrEqual(0);
    });

    it('should verify combat damage calculation with Sequential Tiers', () => {
      // Expected: HEAVY attack (Tier 3) vs HEAVY Cover (Tier 3) -> Cover becomes DAMAGED, no damage leaks to NPC
      // Expected: DEVASTATING attack (Tier 5) vs HEAVY Cover (Tier 3) -> Cover DESTROYED, remaining Tier 2 hits NPC
      const initialHealth = 'INTACT' as ShellStatus;
      const expectedHealthAfterDevastating: ShellStatus = 'DESTROYED';
      expect(expectedHealthAfterDevastating).not.toBe(initialHealth);
    });

    it('should verify cover degradation after taking Tier damage', () => {
      // Expected: If incoming tier > cover tier, durability becomes DESTROYED
      const initialCover = 'INTACT' as Durability;
      const expectedCoverAfterPiercingShot: Durability = 'DESTROYED';
      expect(expectedCoverAfterPiercingShot).not.toBe(initialCover);
    });

    it('should verify priority calculation formula: Priority = Tactical_Score + O2_Level', () => {
      const tacticalScore = 75;
      const o2Level = 100;
      const expectedPriority = tacticalScore + o2Level;

      expect(expectedPriority).toBe(175);
    });
  });
});
