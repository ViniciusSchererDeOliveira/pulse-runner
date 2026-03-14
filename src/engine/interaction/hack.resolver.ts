import type { Room } from '@app-types/map.types.js';
import type { Shell } from '@app-types/runner.types.js';
import type { HackTool } from '@app-types/items.types.js';

/**
 * Result of a hack operation.
 * Interface Segregation: Focused only on hack operation outcome.
 */
export interface HackResult {
  success: boolean;
  message: string;
  targetId: string;
  targetType: 'door' | 'container' | 'system';
  hackToolUsed?: string;
}

/**
 * Interface for hack operation parameters.
 * Interface Segregation: Only includes what's needed for hacking.
 */
export interface HackParams {
  room: Room;
  shell: Shell;
  targetId: string;
}

/**
 * Interface for hackable target.
 * Single Responsibility: Unified interface for hackable objects.
 */
export interface HackableTarget {
  id: string;
  name: string;
  locked_status: 'UNLOCKED' | 'REQUIRES_KEY' | 'REQUIRES_HACK';
  required_key_id: string | null;
  type: 'door' | 'container';
}

/**
 * Finds a hackable target by ID.
 * Single Responsibility: Pure function for target lookup.
 * Open/Closed: Can be extended with new hackable types.
 */
export function findHackableTarget(room: Room, targetId: string): HackableTarget | null {
  // Check room exits (doors)
  for (const exit of room.exits) {
    if (
      exit.target_room_id === targetId ||
      exit.direction.toLowerCase().includes(targetId.toLowerCase())
    ) {
      return {
        id: exit.target_room_id,
        name: `${exit.direction} Exit`,
        locked_status: exit.locked_status,
        required_key_id: exit.required_key_id,
        type: 'door',
      };
    }
  }

  // Check containers
  for (const container of room.containers) {
    if (
      container.name === targetId ||
      container.name.toLowerCase().includes(targetId.toLowerCase())
    ) {
      return {
        id: container.name,
        name: container.name,
        locked_status: container.locked_status,
        required_key_id: container.required_key_id,
        type: 'container',
      };
    }
  }

  return null;
}

/**
 * Checks if shell has a valid hack tool.
 * Single Responsibility: Pure function for tool validation.
 */
export function hasHackTool(shell: Shell): { hasTool: boolean; tool?: HackTool } {
  // HackTool is now in backpack union type
  const hackTools = shell.backpack.filter(
    (item): item is HackTool =>
      'uses' in item && 'quantity_in_stack' in item && item.type === 'HACK_TOOL',
  );

  // Find a tool with remaining uses
  const validTool = hackTools.find(tool => tool.uses > 0 && tool.quantity_in_stack > 0);

  if (validTool) {
    return { hasTool: true, tool: validTool };
  }

  return { hasTool: false };
}

/**
 * Checks if target requires and can be hacked.
 * Single Responsibility: Pure function for hack eligibility.
 */
export function canHackTarget(target: HackableTarget): { canHack: boolean; reason?: string } {
  if (target.locked_status === 'UNLOCKED') {
    return {
      canHack: false,
      reason: 'Target is already unlocked',
    };
  }

  if (target.locked_status === 'REQUIRES_KEY') {
    return {
      canHack: false,
      reason: 'Target requires a physical key, not hackable',
    };
  }

  if (target.locked_status === 'REQUIRES_HACK') {
    return { canHack: true };
  }

  return { canHack: false, reason: 'Unknown lock type' };
}

/**
 * Consumes a hack tool use.
 * Single Responsibility: Handles hack tool resource management.
 */
export function consumeHackTool(shell: Shell, tool: HackTool): boolean {
  const toolIndex = shell.backpack.findIndex(
    item => 'uses' in item && item.type === 'HACK_TOOL' && item.name === tool.name,
  );

  if (toolIndex === -1) {
    return false;
  }

  const backpackTool = shell.backpack[toolIndex] as HackTool;
  backpackTool.uses -= 1;

  // Remove tool if no uses left
  if (backpackTool.uses <= 0) {
    backpackTool.quantity_in_stack -= 1;
    if (backpackTool.quantity_in_stack <= 0) {
      shell.backpack.splice(toolIndex, 1);
    }
  }

  return true;
}

/**
 * Unlocks a target after successful hack.
 * Single Responsibility: Handles target state mutation.
 */
export function unlockTarget(room: Room, target: HackableTarget): void {
  if (target.type === 'door') {
    const exitIndex = room.exits.findIndex(
      e => e.target_room_id === target.id || e.direction === target.name.split(' ')[0],
    );
    if (exitIndex !== -1) {
      room.exits[exitIndex]!.locked_status = 'UNLOCKED';
      room.exits[exitIndex]!.required_key_id = null;
    }
  } else if (target.type === 'container') {
    const containerIndex = room.containers.findIndex(c => c.name === target.id);
    if (containerIndex !== -1) {
      room.containers[containerIndex]!.locked_status = 'UNLOCKED';
      room.containers[containerIndex]!.required_key_id = null;
    }
  }
}

/**
 * Executes a hack action.
 * Single Responsibility: Orchestrates the complete hack flow.
 * Dependency Inversion: Uses pure functions for testability.
 */
export function hackSystem(params: HackParams): HackResult {
  const { room, shell, targetId } = params;

  // Find the target
  const target = findHackableTarget(room, targetId);
  if (!target) {
    return {
      success: false,
      message: `Hack target "${targetId}" not found in room.`,
      targetId,
      targetType: 'system',
    };
  }

  // Check if target can be hacked
  const hackEligibility = canHackTarget(target);
  if (!hackEligibility.canHack) {
    return {
      success: false,
      message: `Cannot hack "${target.name}": ${hackEligibility.reason}`,
      targetId: target.id,
      targetType: target.type,
    };
  }

  // Check for hack tool
  const toolCheck = hasHackTool(shell);
  if (!toolCheck.hasTool || !toolCheck.tool) {
    return {
      success: false,
      message: `No hack tool available.`,
      targetId: target.id,
      targetType: target.type,
    };
  }

  // Consume hack tool use
  const consumed = consumeHackTool(shell, toolCheck.tool);
  if (!consumed) {
    return {
      success: false,
      message: `Failed to use hack tool.`,
      targetId: target.id,
      targetType: target.type,
    };
  }

  // Unlock the target
  unlockTarget(room, target);

  return {
    success: true,
    message: `Successfully hacked ${target.name}. Access granted.`,
    targetId: target.id,
    targetType: target.type,
    hackToolUsed: toolCheck.tool.name,
  };
}
