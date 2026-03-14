import type { Shell } from '@app-types/runner.types.js';
import type { Room } from '@app-types/map.types.js';

// --- ESTADO GLOBAL DO JOGO ---
export type GameState = {
  run_id: string;
  turn_history: TurnState[];
  current_snapshot: {
    active_shell: Shell;
    current_room: Room;
    entities_in_cover: string[];
  };
};

// --- TIPAGENS DE SUPORTE PARA AS TOOLS ---
export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolResult = {
  tool_name: string;
  success: boolean;
  message: string;
};

// --- O ESTADO DO TURNO ---
export type TurnState = {
  id: string;
  run_id: string;
  turn_number: number;

  // 1. SNAPSHOTS (A foto do estado do mundo)
  state_before: {
    active_shell: Shell;
    current_room: Room;
    entities_in_cover: string[]; // IDs do Player, NPCs ou Enemy Runners protegidos
  };
  state_after: {
    active_shell: Shell;
    current_room: Room;
    entities_in_cover: string[]; // Atualizado se a cobertura quebrar ou alguém sair dela
  };

  // 2. MÉTRICAS DAQUELE TURNO (Para a matemática do seu combate)
  turn_metrics: {
    words_used: number;
    tactical_score: number;

    // Agora o Motor TS sabe exatamente quem atirou em quem
    hit_results: {
      attacker_id: string;
      target_id: string;
      hit_chance: number;
      does_it_hit: boolean;
      target_was_in_cover: boolean; // Ajuda o Narrador a descrever que a parede absorveu parte do tiro
      hit_body_part: string; // Which body part was ultimately hit (targeted or random fallback)
      is_precision_hit: boolean; // Was it a precision hit (true) or a fallback/ricochet hit (false)
    }[];
  };

  // 3. A TIMELINE (A ordem cronológica dos fatos)
  timeline: {
    role: 'PLAYER' | 'ENEMY_RUNNER' | 'ENEMY_NPC' | 'MAESTRO_MODEL' | 'ENGINE' | 'NARRATOR_MODEL';

    content: string;

    tool_calls: ToolCall[] | null;
    tool_results: ToolResult[] | null;
  }[];
};
