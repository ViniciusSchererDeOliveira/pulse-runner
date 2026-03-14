import { describe, it, expect } from 'vitest';
import {
  sanitizeToolCalls,
  filterTurnHistory,
  formatContextWindow,
  validateMaestroResponse,
  buildNarratorPrompt,
  buildMaestroPrompt,
  VALID_TOOL_NAMES,
} from '../ai_orchestration.js';
import type { TurnState } from '@app-types/game_state.types.js';

// ==========================================
// TASK 3: AI ORCHESTRATION TESTS
// ==========================================

describe('AI Orchestration (TASK 3)', () => {
  describe('sanitizeToolCalls', () => {
    it('should accept valid tool calls', () => {
      const validTools = [
        { name: 'attackTarget', arguments: { target_id: 'enemy_01', body_part: 'torso' } },
        { name: 'takeCover', arguments: {} },
      ];

      const result = sanitizeToolCalls(validTools);

      expect(result.validTools).toHaveLength(2);
      expect(result.invalidTools).toHaveLength(0);
      expect(result.validTools[0]?.name).toBe('attackTarget');
      expect(result.validTools[1]?.name).toBe('takeCover');
    });

    it('should reject invalid tool names', () => {
      const toolsWithInvalid = [
        { name: 'attackTarget', arguments: { target_id: 'enemy_01', body_part: 'torso' } },
        { name: 'invalidTool', arguments: {} },
        { name: 'combat_analysis', arguments: {} }, // Hallucinated tool
      ];

      const result = sanitizeToolCalls(toolsWithInvalid);

      expect(result.validTools).toHaveLength(1);
      expect(result.invalidTools).toHaveLength(2);
      expect(result.invalidTools.some(t => t.reason.includes('Invalid tool name'))).toBe(true);
    });

    it('should reject tools with missing required arguments', () => {
      const toolsWithMissingArgs = [
        { name: 'attackTarget', arguments: { target_id: 'enemy_01' } }, // Missing body_part
        { name: 'lootContainer', arguments: {} }, // Missing container_id
      ];

      const result = sanitizeToolCalls(toolsWithMissingArgs);

      expect(result.validTools).toHaveLength(0);
      expect(result.invalidTools).toHaveLength(2);
      expect(result.invalidTools.every(t => t.reason.includes('Missing required arguments'))).toBe(
        true,
      );
    });

    it('should handle non-array input gracefully', () => {
      const result = sanitizeToolCalls('not an array' as unknown as unknown[]);

      expect(result.validTools).toHaveLength(0);
      expect(result.invalidTools).toHaveLength(1);
      expect(result.invalidTools[0]?.reason).toBe('Input is not an array');
    });

    it('should handle null/undefined tool calls', () => {
      const result = sanitizeToolCalls([null, undefined, { name: 'attackTarget', arguments: {} }]);

      expect(result.validTools).toHaveLength(0);
      expect(result.invalidTools).toHaveLength(3);
    });

    it('should accept all valid tool types', () => {
      const allValidTools = [
        { name: 'attackTarget', arguments: { target_id: 'enemy_01', body_part: 'head' } },
        { name: 'takeCover', arguments: {} },
        { name: 'lootContainer', arguments: { container_id: 'chest_01' } },
        { name: 'hackSystem', arguments: { target_id: 'security_system' } },
        { name: 'goToRoom', arguments: { direction: 'NORTH' } },
        { name: 'useItem', arguments: { item_name: 'medkit' } },
      ];

      const result = sanitizeToolCalls(allValidTools);

      expect(result.validTools).toHaveLength(6);
      expect(result.invalidTools).toHaveLength(0);
    });
  });

  describe('filterTurnHistory', () => {
    const createMockTurn = (turnNumber: number): TurnState => ({
      id: `turn_${turnNumber}`,
      run_id: 'test_run',
      turn_number: turnNumber,
      state_before: {
        active_shell: {
          callsign: 'PLAYER',
        } as unknown as TurnState['state_before']['active_shell'],
        current_room: {
          category: 'HALLWAY',
        } as unknown as TurnState['state_before']['current_room'],
        entities_in_cover: [],
      },
      state_after: {
        active_shell: { callsign: 'PLAYER' } as unknown as TurnState['state_after']['active_shell'],
        current_room: {
          category: 'HALLWAY',
        } as unknown as TurnState['state_after']['current_room'],
        entities_in_cover: [],
      },
      turn_metrics: {
        words_used: 0,
        tactical_score: 50,
        hit_results: [],
      },
      timeline: [],
    });

    it('should return last N turns', () => {
      const history = [
        createMockTurn(0),
        createMockTurn(1),
        createMockTurn(2),
        createMockTurn(3),
        createMockTurn(4),
      ];

      const result = filterTurnHistory(history, 3);

      expect(result).toHaveLength(3);
      expect(result[0]?.turn_number).toBe(2);
      expect(result[1]?.turn_number).toBe(3);
      expect(result[2]?.turn_number).toBe(4);
    });

    it('should return all turns if history is smaller than window', () => {
      const history = [createMockTurn(0), createMockTurn(1)];

      const result = filterTurnHistory(history, 5);

      expect(result).toHaveLength(2);
    });

    it('should handle empty history', () => {
      const result = filterTurnHistory([], 3);

      expect(result).toHaveLength(0);
    });

    it('should handle non-array input gracefully', () => {
      const result = filterTurnHistory('not an array' as unknown as TurnState[], 3);

      expect(result).toHaveLength(0);
    });

    it('should handle invalid window size', () => {
      const history = [createMockTurn(0), createMockTurn(1)];

      expect(filterTurnHistory(history, 0)).toHaveLength(0);
      expect(filterTurnHistory(history, -1)).toHaveLength(0);
    });
  });

  describe('formatContextWindow', () => {
    const createMockTurnWithCombat = (turnNumber: number, hit: boolean): TurnState => ({
      id: `turn_${turnNumber}`,
      run_id: 'test_run',
      turn_number: turnNumber,
      state_before: {
        active_shell: {
          callsign: 'PLAYER',
          current_oxygen_percentage: 100 - turnNumber * 3,
        } as unknown as TurnState['state_before']['active_shell'],
        current_room: {
          category: 'HALLWAY',
        } as unknown as TurnState['state_before']['current_room'],
        entities_in_cover: [],
      },
      state_after: {
        active_shell: {
          callsign: 'PLAYER',
          current_oxygen_percentage: 100 - (turnNumber + 1) * 3,
        } as unknown as TurnState['state_after']['active_shell'],
        current_room: {
          category: 'HALLWAY',
        } as unknown as TurnState['state_after']['current_room'],
        entities_in_cover: [],
      },
      turn_metrics: {
        words_used: 50,
        tactical_score: 75,
        hit_results: hit
          ? [
              {
                attacker_id: 'PLAYER',
                target_id: 'enemy_01',
                hit_chance: 85,
                does_it_hit: true,
                target_was_in_cover: false,
                hit_body_part: 'torso',
                is_precision_hit: true,
              },
            ]
          : [],
      },
      timeline: [
        {
          role: 'PLAYER',
          content: 'Attack enemy',
          tool_calls: [
            { name: 'attackTarget', arguments: { target_id: 'enemy_01', body_part: 'torso' } },
          ],
          tool_results: null,
        },
      ],
    });

    it('should format turn history into readable context', () => {
      const history = [createMockTurnWithCombat(0, true), createMockTurnWithCombat(1, false)];

      const context = formatContextWindow(history);

      expect(context).toContain('[Turn 0]');
      expect(context).toContain('[Turn 1]');
      expect(context).toContain('O2:');
      expect(context).toContain('Combat:');
      expect(context).toContain('Actions:');
    });

    it('should handle empty history', () => {
      const context = formatContextWindow([]);

      expect(context).toBe('[No previous turn history available]');
    });

    it('should handle non-array input gracefully', () => {
      const context = formatContextWindow('not an array' as unknown as TurnState[]);

      // Non-array input is treated as empty history
      expect(context).toBe('[No previous turn history available]');
    });
  });

  describe('validateMaestroResponse', () => {
    it('should accept valid Maestro response', () => {
      const validResponse = {
        chain_of_thought: 'Player wants to attack the enemy.',
        tactical_score: 75,
        tool_calls: [
          { name: 'attackTarget', arguments: { target_id: 'enemy_01', body_part: 'torso' } },
        ],
      };

      const result = validateMaestroResponse(validResponse);

      expect(result.isValid).toBe(true);
      expect(result.data?.chain_of_thought).toBe(validResponse.chain_of_thought);
      expect(result.data?.tactical_score).toBe(75);
      expect(result.data?.tool_calls).toHaveLength(1);
    });

    it('should reject response with invalid tactical_score', () => {
      const invalidResponse = {
        chain_of_thought: 'Player wants to attack.',
        tactical_score: 150, // Out of range
        tool_calls: [],
      };

      const result = validateMaestroResponse(invalidResponse);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('tactical_score must be between 0 and 100');
    });

    it('should reject response with missing fields', () => {
      const incompleteResponse = {
        chain_of_thought: 'Player wants to attack.',
        // Missing tactical_score and tool_calls
      };

      const result = validateMaestroResponse(incompleteResponse);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid');
    });

    it('should sanitize invalid tools in response', () => {
      const responseWithInvalidTools = {
        chain_of_thought: 'Player wants to attack and use a non-existent tool.',
        tactical_score: 60,
        tool_calls: [
          { name: 'attackTarget', arguments: { target_id: 'enemy_01', body_part: 'torso' } },
          { name: 'hallucinated_tool', arguments: {} },
        ],
      };

      const result = validateMaestroResponse(responseWithInvalidTools);

      expect(result.isValid).toBe(true);
      expect(result.data?.tool_calls).toHaveLength(1); // Only valid tool
    });

    it('should handle non-object input gracefully', () => {
      const result = validateMaestroResponse('not an object');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Response is not an object');
    });

    it('should reject response with all invalid tools', () => {
      const responseWithAllInvalidTools = {
        chain_of_thought: 'Player wants to use invalid tools.',
        tactical_score: 50,
        tool_calls: [
          { name: 'fake_tool_1', arguments: {} },
          { name: 'fake_tool_2', arguments: {} },
        ],
      };

      const result = validateMaestroResponse(responseWithAllInvalidTools);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('All tool calls were invalid');
    });
  });

  describe('buildNarratorPrompt', () => {
    it('should build complete narrator prompt with all sections', () => {
      const playerInput = 'I shoot the enemy';
      const engineLogs = '- Attack resolved: HIT';
      const contextWindow = '[Turn 0] O2: 100% -> 97%';

      const prompt = buildNarratorPrompt(playerInput, engineLogs, contextWindow);

      expect(prompt).toContain('[CONTEXT - Recent Turn History]');
      expect(prompt).toContain(contextWindow);
      expect(prompt).toContain('[PLAYER INPUT]');
      expect(prompt).toContain(playerInput);
      expect(prompt).toContain('[ENGINE LOGS]');
      expect(prompt).toContain(engineLogs);
    });
  });

  describe('buildMaestroPrompt', () => {
    it('should build complete maestro prompt with all sections', () => {
      const gameStateContext = 'Room: Hallway, Enemies: 1 NPC';
      const playerInput = 'I shoot the enemy';
      const contextWindow = '[Turn 0] O2: 100% -> 97%';

      const prompt = buildMaestroPrompt(gameStateContext, playerInput, contextWindow);

      expect(prompt).toContain('[CONTEXT - Recent Turn History]');
      expect(prompt).toContain(contextWindow);
      expect(prompt).toContain('[CURRENT GAME STATE]');
      expect(prompt).toContain(gameStateContext);
      expect(prompt).toContain('[PLAYER INPUT]');
      expect(prompt).toContain(playerInput);
    });
  });

  describe('VALID_TOOL_NAMES constant', () => {
    it('should contain all expected tool names', () => {
      expect(VALID_TOOL_NAMES).toContain('attackTarget');
      expect(VALID_TOOL_NAMES).toContain('takeCover');
      expect(VALID_TOOL_NAMES).toContain('lootContainer');
      expect(VALID_TOOL_NAMES).toContain('hackSystem');
      expect(VALID_TOOL_NAMES).toContain('goToRoom');
      expect(VALID_TOOL_NAMES).toContain('useItem');
    });
  });
});
