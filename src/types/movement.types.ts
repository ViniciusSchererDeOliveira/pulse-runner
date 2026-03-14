import type { Room } from '@app-types/map.types.js';
import type { Shell } from '@app-types/runner.types.js';

export type MovementResult = {
  success: boolean;
  message: string;
  fromRoomId: string;
  toRoomId?: string;
  direction?: string;
  blockedReason?: string;
};

export type MovementParams = {
  currentRoom: Room;
  shell: Shell;
  direction: string;
};
