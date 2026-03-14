import type { ToolCall } from '@app-types/game_state.types.js';

export type StreamResponse = {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
};

export type ChatCompletionResponse = {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
};

export type MaestroResponse = {
  chain_of_thought: string;
  tactical_score: number;
  tool_calls: ToolCall[];
};
