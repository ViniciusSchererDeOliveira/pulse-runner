import type { Room, Container } from '@app-types/map.types.js';
import type { Shell } from '@app-types/runner.types.js';
import type {
  Weapon,
  Armor,
  Consumable,
  Mod,
  Gear,
  Implant,
  Core,
  Artifact,
  HackTool,
  Key,
} from '@app-types/items.types.js';

/**
 * Union type for all lootable items.
 * Single Responsibility: Defines the complete set of lootable item types.
 */
export type LootItem =
  | Weapon
  | Armor
  | Consumable
  | Mod
  | Gear
  | Implant
  | Core
  | Artifact
  | HackTool
  | Key;

/**
 * Result of a loot operation.
 * Interface Segregation: Focused only on loot operation outcome.
 */
export interface LootResult {
  success: boolean;
  message: string;
  acquiredItems: LootItem[];
  containerName: string;
}

/**
 * Interface for loot operation parameters.
 * Interface Segregation: Only includes what's needed for looting.
 */
export interface LootParams {
  room: Room;
  shell: Shell;
  containerId: string;
}

/**
 * Checks if a container is accessible (unlocked or has required key).
 * Single Responsibility: Pure function for access validation.
 */
export function canAccessContainer(
  container: Container,
  shell: Shell,
): { canAccess: boolean; reason?: string } {
  if (container.locked_status === 'UNLOCKED') {
    return { canAccess: true };
  }

  if (container.locked_status === 'REQUIRES_KEY') {
    const hasKey = shell.backpack.some(
      item => 'key_id' in item && item.key_id === container.required_key_id,
    );

    if (hasKey) {
      return { canAccess: true };
    }
    return {
      canAccess: false,
      reason: `Requires key: ${container.required_key_id}`,
    };
  }

  if (container.locked_status === 'REQUIRES_HACK') {
    return {
      canAccess: false,
      reason: 'Container requires hacking tool',
    };
  }

  return { canAccess: true };
}

/**
 * Finds a container by ID or partial name match.
 * Single Responsibility: Pure function for container lookup.
 */
export function findContainer(room: Room, containerId: string): Container | null {
  // Try exact name match first
  const exactMatch = room.containers.find(c => c.name === containerId);
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match (for fuzzy search)
  const partialMatch = room.containers.find(c =>
    c.name.toLowerCase().includes(containerId.toLowerCase()),
  );
  if (partialMatch) {
    return partialMatch;
  }

  return null;
}

/**
 * Adds items to shell's backpack.
 * Single Responsibility: Handles inventory management.
 * Open/Closed: Can be extended with new inventory rules.
 */
export function addToBackpack(
  shell: Shell,
  items: LootItem[],
): {
  added: LootItem[];
  rejected: LootItem[];
} {
  const added: LootItem[] = [];
  const rejected: LootItem[] = [];

  const currentSlots = shell.backpack.reduce((sum, item) => sum + item.slots_taken, 0);
  const availableSlots = shell.max_backpack_slots - currentSlots;

  for (const item of items) {
    if (item.slots_taken <= availableSlots - added.reduce((sum, i) => sum + i.slots_taken, 0)) {
      added.push(item);
    } else {
      rejected.push(item);
    }
  }

  // Mutate the shell's backpack (caller should clone if immutability needed)

  shell.backpack.push(...added);

  return { added, rejected };
}

/**
 * Executes a loot action.
 * Single Responsibility: Orchestrates the complete loot flow.
 * Dependency Inversion: Uses pure functions for testability.
 */
export function lootContainer(params: LootParams): LootResult {
  const { room, shell, containerId } = params;

  // Find the container
  const container = findContainer(room, containerId);
  if (!container) {
    return {
      success: false,
      message: `Container "${containerId}" not found in room.`,
      acquiredItems: [],
      containerName: containerId,
    };
  }

  // Check access
  const access = canAccessContainer(container, shell);
  if (!access.canAccess) {
    return {
      success: false,
      message: `Cannot access "${container.name}": ${access.reason}`,
      acquiredItems: [],
      containerName: container.name,
    };
  }

  // Add items to backpack
  const { added, rejected } = addToBackpack(shell, container.loot);

  // Clear container loot if all items were taken
  if (added.length === container.loot.length) {
    container.loot = [];
  }

  // Build result message
  const acquiredNames = added.map(i => i.name).join(', ');
  const message =
    rejected.length > 0
      ? `Looted ${container.name}. Acquired: ${acquiredNames}. ${rejected.length} item(s) rejected (no space).`
      : `Looted ${container.name}. Acquired: ${acquiredNames || 'nothing'}.`;

  return {
    success: true,
    message,
    acquiredItems: added,
    containerName: container.name,
  };
}
