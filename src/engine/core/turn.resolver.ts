import type { GameState, TurnState, ToolCall, ToolResult } from '@app-types/game_state.types.js';
import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';

// Import extracted modules (SOLID: Dependency Inversion - depend on abstractions)
import { resolveAttack, type AttackResult } from '../combat/attack.resolver.js';
import { lootContainer } from '../interaction/loot.resolver.js';
import { hackSystem } from '../interaction/hack.resolver.js';
import { goToRoom } from '../movement/room.resolver.js';

// ==========================================
// TASK 1: STATE MANAGER & O2 DEPLETION SYSTEM
// ==========================================

/**
 * Constants for O2 depletion calculation.
 * Base depletion happens every turn regardless of actions.
 * Action depletion is added per action taken.
 */
export const O2_DEPLETION_CONSTANTS = {
  BASE_DEPLETION_PER_TURN: 2,
  ACTION_DEPLETION: 1,
} as const;

/**
 * Creates a deep clone of the game state snapshot using structuredClone.
 * This ensures immutability - the original state is never mutated.
 * Single Responsibility: Pure cloning function.
 */
export function cloneStateSnapshot<T>(state: T): T {
  return structuredClone(state);
}

/**
 * Calculates O2 depletion based on the number of actions taken.
 * Formula: Final O2 = Current O2 - (BASE_DEPLETION + (actions * ACTION_DEPLETION))
 * Single Responsibility: Pure calculation function.
 */
export function calculateO2Depletion(currentO2: number, actionsCount: number): number {
  const totalDepletion =
    O2_DEPLETION_CONSTANTS.BASE_DEPLETION_PER_TURN +
    actionsCount * O2_DEPLETION_CONSTANTS.ACTION_DEPLETION;
  return Math.max(0, currentO2 - totalDepletion);
}

/**
 * Applies O2 depletion to a shell and returns a new cloned shell.
 * Single Responsibility: Handles O2 state mutation on clone.
 */
export function applyO2Depletion(shell: Shell, actionsCount: number): Shell {
  const clonedShell = cloneStateSnapshot(shell);
  clonedShell.current_oxygen_percentage = calculateO2Depletion(
    clonedShell.current_oxygen_percentage,
    actionsCount,
  );

  // Handle oxygen leak damage over time
  if (clonedShell.is_oxygen_leaking) {
    clonedShell.current_oxygen_percentage = Math.max(0, clonedShell.current_oxygen_percentage - 1);
  }

  return clonedShell;
}

// ==========================================
// TASK 2: PRIORITY ENGINE
// ==========================================

/**
 * Priority Engine - Calculates initiative order.
 * Formula: Priority = Tactical_Score + O2_Level
 * Single Responsibility: Pure initiative calculation.
 * Open/Closed: Can be extended with new priority factors.
 */
export function calculateInitiative(tacticalScore: number, o2Level: number): number {
  return tacticalScore + o2Level;
}

// ==========================================
// TOOL EXECUTION ENGINE
// ==========================================

/**
 * Executes a single tool call and returns the result.
 * Single Responsibility: Tool execution orchestration.
 * Dependency Inversion: Delegates to extracted modules.
 */
function executeTool(
  state: GameState['current_snapshot'],
  toolCall: ToolCall,
  activeShell: Shell,
  tacticalScore: number,
): {
  updatedState: GameState['current_snapshot'];
  toolResult: ToolResult;
  hitResult?: TurnState['turn_metrics']['hit_results'][number];
} {
  const clonedState = cloneStateSnapshot(state);
  const clonedRoom = clonedState.current_room;
  const clonedShell = cloneStateSnapshot(activeShell);

  switch (toolCall.name) {
    case 'attackTarget': {
      const targetId = toolCall.arguments['target_id'] as string;
      const bodyPart = (toolCall.arguments['body_part'] as string) ?? 'torso'; // Default to torso if not specified

      const targetIndex = clonedRoom.active_enemies.findIndex(e => 'id' in e && e.id === targetId);
      if (targetIndex === -1) {
        return {
          updatedState: clonedState,
          toolResult: {
            tool_name: 'attackTarget',
            success: false,
            message: `Target ${targetId} not found in room.`,
          },
        };
      }

      const target = clonedRoom.active_enemies[targetIndex] as NPC;
      const weapon = clonedShell.equipped.primary_weapon;

      if (!weapon) {
        return {
          updatedState: clonedState,
          toolResult: {
            tool_name: 'attackTarget',
            success: false,
            message: 'No primary weapon equipped.',
          },
        };
      }

      // Delegate to extracted attack resolver module (SOLID: Single Responsibility)
      const attackResult: AttackResult = resolveAttack({
        attacker: clonedShell,
        target,
        weapon,
        targetCoverType: clonedRoom.available_cover,
        targetCoverDurability: clonedRoom.cover_durability,
        targetProtectionLevel: target.protection_level ?? 'NONE',
        targetProtectionType: target.protection_type ?? 'NONE',
        targetProtectionDurability: 'INTACT', // NPCs don't have durability tracking yet
        roomIdealRanges: clonedRoom.ideal_weapon_ranges,
        targetedBodyPart: bodyPart,
        tacticalScore,
        attackerO2Percentage: clonedShell.current_oxygen_percentage,
      });

      // Update target health
      target.health_status = attackResult.targetHealthAfter;

      // Update target anatomy if it's a Shell (for player vs player combat)
      if ('anatomy' in target && attackResult.targetAnatomyDamage) {
        target.anatomy = attackResult.targetAnatomyDamage as typeof target.anatomy;
      }

      // Update cover durability
      clonedRoom.cover_durability = attackResult.newCoverDurability;

      // Remove destroyed enemies
      if (attackResult.targetHealthAfter === 'DESTROYED') {
        clonedRoom.active_enemies.splice(targetIndex, 1);
      }

      // Create hit result for metrics - now includes body part hit
      const hitResult: TurnState['turn_metrics']['hit_results'][number] = {
        attacker_id: clonedShell.callsign,
        target_id: targetId,
        hit_chance: attackResult.hitChance,
        does_it_hit: attackResult.doesItHit,
        target_was_in_cover: attackResult.targetWasInCover,
        hit_body_part: attackResult.hitBodyPart,
        is_precision_hit: attackResult.isPrecisionHit,
      };

      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: 'attackTarget',
          success: true,
          message: `Attacked ${target.name} at ${bodyPart}. Hit: ${attackResult.doesItHit}${attackResult.hitBodyPart ? ` (hit ${attackResult.hitBodyPart})` : ''}. Precision: ${attackResult.isPrecisionHit}. Target status: ${attackResult.targetHealthAfter}.`,
        },
        hitResult,
      };
    }

    case 'takeCover': {
      // Player takes cover - add to entities_in_cover
      if (!clonedState.entities_in_cover.includes(clonedShell.callsign)) {
        clonedState.entities_in_cover.push(clonedShell.callsign);
      }

      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: 'takeCover',
          success: true,
          message: `Player is now in ${clonedRoom.available_cover} cover.`,
        },
      };
    }

    case 'lootContainer': {
      const containerId = toolCall.arguments['container_id'] as string;

      // Delegate to extracted loot resolver module (SOLID: Single Responsibility)
      const lootResult = lootContainer({
        room: clonedRoom,
        shell: clonedShell,
        containerId,
      });

      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: 'lootContainer',
          success: lootResult.success,
          message: lootResult.message,
        },
      };
    }

    case 'goToRoom': {
      const direction = toolCall.arguments['direction'] as string;

      // Delegate to extracted room resolver module (SOLID: Single Responsibility)
      const movementResult = goToRoom({
        currentRoom: clonedRoom,
        shell: clonedShell,
        direction,
      });

      // Note: In a full implementation, this would update current_room
      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: 'goToRoom',
          success: movementResult.success,
          message: movementResult.message,
        },
      };
    }

    case 'useItem': {
      const itemName = toolCall.arguments['item_name'] as string;
      // In a full implementation, this would use an item from inventory
      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: 'useItem',
          success: true,
          message: `Used ${itemName}.`,
        },
      };
    }

    case 'hackSystem': {
      const targetId = toolCall.arguments['target_id'] as string;

      // Delegate to extracted hack resolver module (SOLID: Single Responsibility)
      const hackResult = hackSystem({
        room: clonedRoom,
        shell: clonedShell,
        targetId,
      });

      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: 'hackSystem',
          success: hackResult.success,
          message: hackResult.message,
        },
      };
    }

    default: {
      return {
        updatedState: clonedState,
        toolResult: {
          tool_name: toolCall.name,
          success: false,
          message: `Unknown tool: ${toolCall.name}`,
        },
      };
    }
  }
}

// ==========================================
// MAIN TURN RESOLVER
// ==========================================

/**
 * TASK 0, 1, 2: Main turn resolution function.
 * Takes the current game state and maestro intent,
 * resolves all actions, and returns the new TurnState.
 *
 * Single Responsibility: Orchestrates turn resolution flow.
 * Dependency Inversion: Uses extracted modules for specific operations.
 *
 * @param gameState - The current global game state (never mutated)
 * @param maestroIntent - The parsed intent from the Maestro AI
 * @returns A new TurnState with state_before, state_after, and turn_metrics
 */
export function resolveTurn(
  gameState: GameState,
  maestroIntent: { tactical_score: number; tool_calls: ToolCall[] },
): TurnState {
  // TASK 1: Create deep clone of state before any mutations (SOLID: Immutability)
  const stateBefore = cloneStateSnapshot(gameState.current_snapshot);

  // Initialize state after as a clone (will be modified)
  let stateAfter = cloneStateSnapshot(gameState.current_snapshot);

  // Track hit results for turn metrics
  const hitResults: TurnState['turn_metrics']['hit_results'] = [];

  // Execute each tool call and collect results
  const timeline: TurnState['timeline'] = [];
  const toolResults: ToolResult[] = [];

  for (const toolCall of maestroIntent.tool_calls) {
    // Execute the tool
    const { updatedState, toolResult, hitResult } = executeTool(
      stateAfter,
      toolCall,
      stateAfter.active_shell,
      maestroIntent.tactical_score,
    );

    stateAfter = updatedState;
    toolResults.push(toolResult);

    // If this was an attack, record hit result for metrics
    if (hitResult) {
      hitResults.push(hitResult);
    }
  }

  // Add player action to timeline
  timeline.push({
    role: 'PLAYER',
    content: `Executed ${maestroIntent.tool_calls.length} action(s).`,
    tool_calls: cloneStateSnapshot(maestroIntent.tool_calls),
    tool_results: toolResults.length > 0 ? cloneStateSnapshot(toolResults) : null,
  });

  // TASK 1: Apply O2 depletion based on number of actions
  const actionsCount = maestroIntent.tool_calls.length;
  stateAfter.active_shell = applyO2Depletion(stateAfter.active_shell, actionsCount);

  // TASK 2: Calculate turn metrics
  const turnMetrics: TurnState['turn_metrics'] = {
    words_used: 0, // Would be calculated from player input
    tactical_score: maestroIntent.tactical_score,
    hit_results: hitResults,
  };

  // Create and return the TurnState
  const turnState: TurnState = {
    id: `turn_${gameState.turn_history.length}`,
    run_id: gameState.run_id,
    turn_number: gameState.turn_history.length,
    state_before: stateBefore,
    state_after: stateAfter,
    turn_metrics: turnMetrics,
    timeline: timeline,
  };

  return turnState;
}

/**
 * Helper function to format room state for AI consumption.
 * Single Responsibility: Formats state for AI prompts.
 */
export function formatRoomState(gameState: GameState): string {
  const room = gameState.current_snapshot.current_room;
  const shell = gameState.current_snapshot.active_shell;

  return `Room Category: ${room.category}
Available Cover: ${room.available_cover}
Active Enemies: ${JSON.stringify(room.active_enemies.map(e => ({ id: (e as NPC).id, type: 'NPC' })))}
Containers: ${JSON.stringify(room.containers.map(c => ({ name: c.name, locked_status: c.locked_status })))}
Player O2: ${shell.current_oxygen_percentage}%`;
}
