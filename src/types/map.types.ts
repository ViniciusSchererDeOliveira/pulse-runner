import type { Shell } from '@app-types/runner.types.js';
import type { NPC } from '@app-types/enemies.types.js';
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
} from '@app-types/items.types.js';
import type {
  CoverType,
  Durability,
  LockedStatus,
  RoomCategory,
  WeaponRange,
} from '@app-types/constant.types.js';

export type RoomExit = {
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'LEFT' | 'RIGHT';
  target_room_id: string;
  locked_status: LockedStatus;
  required_key_id: string | null;
};

export type Container = {
  name: string;
  locked_status: LockedStatus;
  required_key_id: string | null;
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

  // Conteúdo (Agora instanciado com os objetos reais para a Engine calcular a matemática)
  active_enemies: (NPC | Shell)[];
  containers: Container[];

  // Progressão
  is_extraction_point: boolean;
  exits: RoomExit[];
};
