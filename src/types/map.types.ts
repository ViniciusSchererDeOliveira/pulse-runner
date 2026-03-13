import type {
  Armor,
  Artifact,
  Consumable,
  Core,
  Gear,
  HackTool,
  Implant,
  Key,
  Mod,
  Weapon,
} from './items.types.js';
import type {
  CoverType,
  Durability,
  LockedStatus,
  RoomCategory,
  WeaponRange,
} from './constant.types.js';

export type RoomExit = {
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'LEFT' | 'RIGHT';
  target_room_id: string;
  locked_status: LockedStatus;
  required_key_id: string | null;
};

export type Container = {
  name: string;
  locked_status: LockedStatus;
  required_key_id: string | null; // Cofres também podem precisar de chave específica
  loot: (Weapon | Armor | Consumable | Mod | Gear | Implant | Core | Artifact | HackTool | Key)[];
};

export type Room = {
  id: string;
  name: string;
  description: string;
  category: RoomCategory;

  // Gerenciamento de Rotas
  is_main_path: boolean;

  // Tática e Combate
  available_cover: CoverType;
  cover_durability: Durability;
  base_visibility: 'LOW' | 'MEDIUM' | 'HIGH';

  ideal_weapon_ranges: WeaponRange[];

  // Conteúdo
  enemies: string[];
  containers: Container[];

  // Progressão
  is_extraction_point: boolean;
  exits: RoomExit[];
};
