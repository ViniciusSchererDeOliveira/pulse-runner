import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';
import type { Room } from '@app-types/map.types.js';
import type { ToolCall } from '@app-types/game_state.types.js';
import type { WeaponRange } from '@app-types/constant.types.js';

/**
 * Interface for enemy AI context.
 * Interface Segregation: Only includes data needed for AI decisions.
 */
export interface EnemyAIContext {
  self: Shell | NPC;
  currentRoom: Room;
  playerShell: Shell;
  entitiesInCover: string[];
}

/**
 * Interface for enemy AI decision.
 * Single Responsibility: Represents a single AI action decision.
 */
export interface EnemyAIDecision {
  action: 'attack' | 'takeCover' | 'move' | 'idle';
  targetId?: string;
  bodyPart?: string;
  direction?: string;
  reason: string;
}

/**
 * Weapon range effectiveness for AI decision making.
 * Open/Closed: Can be extended with new ranges without modification.
 */
export const RANGE_EFFECTIVENESS: Record<WeaponRange, number> = {
  MELEE: 1.0,
  SHORT: 1.0,
  MEDIUM: 0.85,
  LONG: 0.7,
} as const;

/**
 * Evaluates if enemy should take cover.
 * Single Responsibility: Pure function for cover decision.
 */
export function shouldTakeCover(context: EnemyAIContext): boolean {
  const selfId = 'id' in context.self ? context.self.id : context.self.callsign;
  const isInCover = context.entitiesInCover.includes(selfId);
  const playerHasWeapon = context.playerShell.equipped.primary_weapon !== null;

  // Take cover if not already in cover and player is armed
  return !isInCover && playerHasWeapon;
}

/**
 * Selects the best target for the enemy.
 * Single Responsibility: Pure function for target selection.
 */
export function selectTarget(context: EnemyAIContext): Shell | NPC | null {
  // Priority: Player is always the primary target
  return context.playerShell;
}

/**
 * Selects the best body part to target.
 * Single Responsibility: Pure function for body part selection.
 * Liskov Substitution: Works with both Shell and NPC targets.
 */
export function selectBodyPart(_target: Shell | NPC): string {
  // Target torso for maximum hit chance and damage
  return 'torso';
}

/**
 * Calculates attack priority based on tactical situation.
 * Single Responsibility: Pure function for priority calculation.
 */
export function calculateAttackPriority(context: EnemyAIContext): number {
  const selfId = 'id' in context.self ? context.self.id : context.self.callsign;
  const isInCover = context.entitiesInCover.includes(selfId);
  const coverBonus = isInCover ? 20 : 0;

  // Base priority from O2 level (desperation factor)
  const o2Factor =
    'current_oxygen_percentage' in context.self ? context.self.current_oxygen_percentage / 10 : 5;

  return o2Factor + coverBonus;
}

/**
 * Determines the best action for the enemy.
 * Single Responsibility: Orchestrates AI decision-making flow.
 * Dependency Inversion: Uses pure functions for testability.
 */
export function decideEnemyAction(context: EnemyAIContext): EnemyAIDecision {
  // Check if should take cover first
  if (shouldTakeCover(context)) {
    return {
      action: 'takeCover',
      reason: 'Seeking cover from player fire',
    };
  }

  // Select target and decide attack
  const target = selectTarget(context);
  if (target) {
    const bodyPart = selectBodyPart(target);

    const targetId = 'id' in target ? target.id : target.callsign;
    return {
      action: 'attack',
      targetId: targetId,
      bodyPart,
      reason: 'Engaging primary target',
    };
  }

  // No valid action, idle
  return {
    action: 'idle',
    reason: 'No valid targets or actions available',
  };
}

/**
 * Converts AI decision to tool call format.
 * Single Responsibility: Transforms decision to executable format.
 */
export function decisionToToolCall(decision: EnemyAIDecision): ToolCall | null {
  switch (decision.action) {
    case 'attack':
      if (!decision.targetId || !decision.bodyPart) {
        return null;
      }
      return {
        name: 'attackTarget',
        arguments: {
          target_id: decision.targetId,
          body_part: decision.bodyPart,
        },
      };

    case 'takeCover':
      return {
        name: 'takeCover',
        arguments: {},
      };

    case 'move':
      if (!decision.direction) {
        return null;
      }
      return {
        name: 'goToRoom',
        arguments: {
          direction: decision.direction,
        },
      };

    case 'idle':
      return null;
  }
}

/**
 * Main entry point for enemy AI.
 * Single Responsibility: Facade for enemy AI functionality.
 */
export function inferEnemyRunnerIntent(
  self: Shell | NPC,
  currentRoom: Room,
  playerShell: Shell,
  entitiesInCover: string[],
): { tactical_score: number; tool_calls: ToolCall[] } {
  const context: EnemyAIContext = {
    self,
    currentRoom,
    playerShell,
    entitiesInCover,
  };

  const decision = decideEnemyAction(context);
  const toolCall = decisionToToolCall(decision);
  const priority = calculateAttackPriority(context);

  return {
    tactical_score: Math.min(100, Math.max(0, priority * 10)),
    tool_calls: toolCall ? [toolCall] : [],
  };
}
