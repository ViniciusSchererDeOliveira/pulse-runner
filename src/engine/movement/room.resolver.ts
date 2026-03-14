import type { Room, RoomExit, Direction } from '@app-types/map.types.js';
import type { Shell } from '@app-types/runner.types.js';
import type { MovementResult, MovementParams } from '@app-types/movement.types.js';

/**
 * Normalizes direction input to standard format.
 * Single Responsibility: Pure function for direction normalization.
 * Open/Closed: Can be extended with new direction aliases.
 */
export function normalizeDirection(direction: string): string {
  const normalized = direction.toUpperCase().trim();

  // Support aliases
  const aliases: Record<string, string> = {
    N: 'NORTH',
    S: 'SOUTH',
    E: 'EAST',
    W: 'WEST',
    L: 'LEFT',
    R: 'RIGHT',
    FORWARD: 'NORTH',
    BACK: 'SOUTH',
  };

  return aliases[normalized] ?? normalized;
}

/**
 * Finds an exit in the given direction.
 * Single Responsibility: Pure function for exit lookup.
 */
export function findExit(room: Room, direction: string): RoomExit | null {
  const normalizedDirection = normalizeDirection(direction);

  const exit = room.exits.find(
    e =>
      e.direction === normalizedDirection ||
      e.direction.toLowerCase() === normalizedDirection.toLowerCase(),
  );

  return exit ?? null;
}

/**
 * Checks if shell has the required key for an exit.
 * Single Responsibility: Pure function for key validation.
 * Liskov Substitution: Works with any Shell implementation.
 */
export function hasRequiredKey(shell: Shell, requiredKeyId: string): boolean {
  return shell.backpack.some(item => 'key_id' in item && item.key_id === requiredKeyId);
}

/**
 * Checks if an exit is passable.
 * Single Responsibility: Pure function for exit accessibility.
 */
export function canPassExit(exit: RoomExit, shell: Shell): { canPass: boolean; reason?: string } {
  if (exit.locked_status === 'UNLOCKED') {
    return { canPass: true };
  }

  if (exit.locked_status === 'REQUIRES_KEY') {
    if (!exit.required_key_id) {
      return {
        canPass: false,
        reason: 'Exit requires a key but no key ID is specified',
      };
    }

    if (hasRequiredKey(shell, exit.required_key_id)) {
      return { canPass: true };
    }

    return {
      canPass: false,
      reason: `Exit is locked. Requires key: ${exit.required_key_id}`,
    };
  }

  if (exit.locked_status === 'REQUIRES_HACK') {
    return {
      canPass: false,
      reason: 'Exit requires hacking to unlock',
    };
  }

  return { canPass: true };
}

/**
 * Executes movement to an adjacent room.
 * Single Responsibility: Orchestrates the complete movement flow.
 * Dependency Inversion: Uses pure functions for testability.
 */
export function goToRoom(params: MovementParams): MovementResult {
  const { currentRoom, shell, direction } = params;

  // Find the exit
  const exit = findExit(currentRoom, direction);
  if (!exit) {
    return {
      success: false,
      message: `No exit found to the ${normalizeDirection(direction)}.`,
      fromRoomId: currentRoom.id,
      direction: normalizeDirection(direction),
    };
  }

  // Check if exit is passable
  const passCheck = canPassExit(exit, shell);
  if (!passCheck.canPass) {
    return {
      success: false,
      message: `Cannot go ${normalizeDirection(direction)}: ${passCheck.reason}`,
      fromRoomId: currentRoom.id,
      direction: normalizeDirection(direction),
    };
  }

  // Movement successful
  return {
    success: true,
    message: `Moved ${normalizeDirection(direction)} to ${exit.target_room_id}.`,
    fromRoomId: currentRoom.id,
    toRoomId: exit.target_room_id,
    direction: normalizeDirection(direction),
  };
}

/**
 * Gets all available directions from current room.
 * Single Responsibility: Pure function for direction enumeration.
 */
export function getAvailableDirections(room: Room): string[] {
  return room.exits.map(exit => exit.direction);
}

/**
 * Gets a description of available exits for the player.
 * Single Responsibility: Formats exit information for display.
 */
export function getExitsDescription(room: Room): string {
  if (room.exits.length === 0) {
    return 'No visible exits.';
  }

  const lockedExits = room.exits.filter(e => e.locked_status !== 'UNLOCKED');
  const unlockedExits = room.exits.filter(e => e.locked_status === 'UNLOCKED');

  let description = 'Exits: ';

  if (unlockedExits.length > 0) {
    description += unlockedExits.map(e => e.direction).join(', ');
  }

  if (lockedExits.length > 0) {
    const lockedDesc = lockedExits
      .map(e => {
        if (e.locked_status === 'REQUIRES_KEY') {
          return `${e.direction} (locked)`;
        }
        if (e.locked_status === 'REQUIRES_HACK') {
          return `${e.direction} (needs hack)`;
        }
        return e.direction;
      })
      .join(', ');

    if (unlockedExits.length > 0) {
      description += '; ';
    }
    description += lockedDesc;
  }

  return description + '.';
}

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  NORTH: 'SOUTH',
  SOUTH: 'NORTH',
  EAST: 'WEST',
  WEST: 'EAST',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export function getValidExits(room: Room): RoomExit[] {
  const entranceDir = room.tree_position.entrance_direction;
  if (!entranceDir) {
    return room.exits;
  }

  return room.exits.filter(exit => {
    const opposite = OPPOSITE_DIRECTION[exit.direction];
    return exit.direction !== entranceDir && opposite !== entranceDir;
  });
}

export function isValidExit(room: Room, direction: string): boolean {
  const normalizedDir = normalizeDirection(direction) as Direction;
  const entranceDir = room.tree_position.entrance_direction;

  if (!entranceDir) {
    return room.exits.some(e => e.direction === normalizedDir);
  }

  const opposite = OPPOSITE_DIRECTION[normalizedDir];
  return (
    normalizedDir !== entranceDir &&
    opposite !== entranceDir &&
    room.exits.some(e => e.direction === normalizedDir)
  );
}
