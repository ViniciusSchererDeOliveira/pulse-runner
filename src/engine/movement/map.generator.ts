import type { Room, RoomExit, Direction, TreePosition } from '@app-types/map.types.js';

const CARDINAL_DIRECTIONS: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  NORTH: 'SOUTH',
  SOUTH: 'NORTH',
  EAST: 'WEST',
  WEST: 'EAST',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const MAIN_BRANCH_LENGTH = 10;
const POST_EXTRACTION_LENGTH = 5;
const TOTAL_MAIN_BRANCH = MAIN_BRANCH_LENGTH + POST_EXTRACTION_LENGTH;
const MAX_SECONDARY_BRANCHES_BEFORE_EXTRACTION = 2;
const MAX_SECONDARY_BRANCHES_AFTER_EXTRACTION = 3;
const MAX_BRANCH_DEPTH = 3;

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function getRandomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function getRandomElement<T>(random: () => number, array: T[]): T {
  return array[Math.floor(random() * array.length)]!;
}

function getValidExitsForEntrance(
  random: () => number,
  entranceDirection: Direction | null,
  excludeDirections: Direction[] = [],
): Direction[] {
  let available = CARDINAL_DIRECTIONS.filter(
    dir =>
      dir !== entranceDirection &&
      dir !== (entranceDirection ? OPPOSITE_DIRECTION[entranceDirection] : null),
  );

  available = available.filter(dir => !excludeDirections.includes(dir));

  if (available.length === 0) {
    available = CARDINAL_DIRECTIONS.filter(dir => !excludeDirections.includes(dir));
  }

  return available;
}

function createTreePosition(
  isMainBranch: boolean,
  distanceFromStart: number,
  branchDepth: number,
  branchId: number | null,
  entranceDirection: Direction | null,
): TreePosition {
  return {
    is_main_branch: isMainBranch,
    distance_from_start: distanceFromStart,
    branch_depth: branchDepth,
    branch_id: branchId,
    entrance_direction: entranceDirection,
  };
}

function createRoom(
  id: string,
  name: string,
  treePosition: TreePosition,
  isExtraction: boolean,
  exits: RoomExit[] = [],
): Room {
  return {
    id,
    name,
    description: `Room at ${treePosition.is_main_branch ? 'main' : 'branch'} path, distance ${treePosition.distance_from_start}`,
    category:
      treePosition.branch_depth === MAX_BRANCH_DEPTH || exits.length === 0 ? 'DEAD_END' : 'ROOM',
    is_main_path: treePosition.is_main_branch,
    available_cover: 'NONE',
    cover_durability: 'INTACT',
    base_visibility: 'MEDIUM',
    ideal_weapon_ranges: [],
    active_enemies: [],
    containers: [],
    is_extraction_point: isExtraction,
    exits,
    tree_position: treePosition,
  };
}

function attachBranchToMain(
  rooms: Map<string, Room>,
  mainBranchIndex: number,
  branchId: number,
  random: () => number,
): void {
  const mainRoomIndex = mainBranchIndex;
  const mainRoomId = `main_${mainRoomIndex}`;
  const mainRoom = rooms.get(mainRoomId);

  if (!mainRoom) return;

  const branchDepth = getRandomInt(random, 1, MAX_BRANCH_DEPTH);
  const exitDirection = getRandomElement(random, CARDINAL_DIRECTIONS);

  let previousDirection = exitDirection;

  for (let i = 0; i < branchDepth; i++) {
    const branchRoomId = `branch_${branchId}_${i}`;
    const entranceFrom = OPPOSITE_DIRECTION[previousDirection];
    const isLastInBranch = i === branchDepth - 1;

    const branchExits: RoomExit[] = [];
    if (!isLastInBranch) {
      const nextDirection = getRandomElement(
        random,
        getValidExitsForEntrance(random, entranceFrom, [previousDirection]),
      );
      branchExits.push({
        direction: nextDirection,
        target_room_id: `branch_${branchId}_${i + 1}`,
        locked_status: 'UNLOCKED',
        required_key_id: null,
      });
    }

    const branchRoom = createRoom(
      branchRoomId,
      `Branch ${branchId} Room ${i + 1}`,
      createTreePosition(false, mainRoomIndex, i + 1, branchId, entranceFrom),
      false,
      branchExits,
    );

    rooms.set(branchRoomId, branchRoom);

    if (i === 0) {
      const exitToBranch: RoomExit = {
        direction: exitDirection,
        target_room_id: branchRoomId,
        locked_status: 'UNLOCKED',
        required_key_id: null,
      };
      mainRoom.exits.push(exitToBranch);
    }

    previousDirection = isLastInBranch ? entranceFrom : branchExits[0]!.direction;
  }
}

function linkRooms(rooms: Map<string, Room>): void {
  for (const room of rooms.values()) {
    for (const exit of room.exits) {
      const targetRoom = rooms.get(exit.target_room_id);
      if (targetRoom) {
        const backDirection = OPPOSITE_DIRECTION[exit.direction];
        const existingBack = targetRoom.exits.find(e => e.target_room_id === room.id);
        if (!existingBack) {
          const entranceFrom = room.tree_position.entrance_direction;
          if (backDirection !== entranceFrom) {
            targetRoom.exits.push({
              direction: backDirection,
              target_room_id: room.id,
              locked_status: 'UNLOCKED',
              required_key_id: null,
            });
          }
        }
      }
    }
  }
}

export function generateRoomTree(seed: number = 12345): Room[] {
  const random = seededRandom(seed);
  const rooms = new Map<string, Room>();

  const preExtractionBranchSlots = [1, 3, 5, 7];
  const postExtractionBranchSlots = [11, 12, 13];

  const preExtractionCount = getRandomInt(random, 1, MAX_SECONDARY_BRANCHES_BEFORE_EXTRACTION);
  const postExtractionCount = getRandomInt(random, 1, MAX_SECONDARY_BRANCHES_AFTER_EXTRACTION);

  const preExtractionIndices = preExtractionBranchSlots
    .sort(() => random() - 0.5)
    .slice(0, preExtractionCount);

  const postExtractionIndices = postExtractionBranchSlots
    .sort(() => random() - 0.5)
    .slice(0, postExtractionCount);

  for (let i = 0; i < TOTAL_MAIN_BRANCH; i++) {
    const roomId = `main_${i}`;
    const isExtraction = i === MAIN_BRANCH_LENGTH - 1;
    const isLast = i === TOTAL_MAIN_BRANCH - 1;

    let exitDirection: Direction | null = null;
    const exits: RoomExit[] = [];

    if (!isLast) {
      exitDirection = getRandomElement(random, CARDINAL_DIRECTIONS);
      exits.push({
        direction: exitDirection,
        target_room_id: `main_${i + 1}`,
        locked_status: 'UNLOCKED',
        required_key_id: null,
      });
    }

    const room = createRoom(
      roomId,
      isExtraction ? 'Extraction Point' : `Room ${i}`,
      createTreePosition(true, i, 0, null, i === 0 ? null : OPPOSITE_DIRECTION[exitDirection!]),
      isExtraction,
      exits,
    );

    rooms.set(roomId, room);
  }

  let branchId = 0;
  for (const mainIndex of preExtractionIndices) {
    attachBranchToMain(rooms, mainIndex, branchId++, random);
  }

  for (const mainIndex of postExtractionIndices) {
    attachBranchToMain(rooms, mainIndex, branchId++, random);
  }

  linkRooms(rooms);

  return Array.from(rooms.values()).sort((a, b) => {
    if (a.tree_position.is_main_branch !== b.tree_position.is_main_branch) {
      return a.tree_position.is_main_branch ? -1 : 1;
    }
    if (a.tree_position.branch_id !== b.tree_position.branch_id) {
      return (a.tree_position.branch_id ?? 0) - (b.tree_position.branch_id ?? 0);
    }
    return a.tree_position.distance_from_start - b.tree_position.distance_from_start;
  });
}

export function getMainBranchRooms(rooms: Room[]): Room[] {
  return rooms.filter(r => r.tree_position.is_main_branch);
}

export function getSecondaryBranchRooms(rooms: Room[]): Room[] {
  return rooms.filter(r => !r.tree_position.is_main_branch);
}

export function getRoomById(rooms: Room[], id: string): Room | undefined {
  return rooms.find(r => r.id === id);
}

export function getRoomByTreePosition(
  rooms: Room[],
  isMainBranch: boolean,
  distanceFromStart: number,
  branchDepth?: number,
  branchId?: number,
): Room | undefined {
  return rooms.find(r => {
    if (r.tree_position.is_main_branch !== isMainBranch) return false;
    if (r.tree_position.distance_from_start !== distanceFromStart) return false;
    if (branchDepth !== undefined && r.tree_position.branch_depth !== branchDepth) return false;
    if (branchId !== undefined && r.tree_position.branch_id !== branchId) return false;
    return true;
  });
}

export function getAdjacentRooms(room: Room, allRooms: Room[]): Room[] {
  return room.exits
    .map(exit => allRooms.find(r => r.id === exit.target_room_id))
    .filter((r): r is Room => r !== undefined);
}
