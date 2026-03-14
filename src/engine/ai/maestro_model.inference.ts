import type { MaestroResponse, ChatCompletionResponse } from '@app-types/ai.types.js';

const LM_STUDIO_URL = 'http://127.0.0.1:1234/v1/chat/completions';

export type { MaestroResponse } from '@app-types/ai.types.js';

const MAESTRO_SYSTEM_PROMPT = `
You are the "Maestro", the logical parser and rules engine for PULSE_RUNNER, a hardcore sci-fi text-based extraction shooter. 
Your ONLY job is to read the current game state and the player's natural language input, evaluate their tactical approach, and output a strict, valid JSON object. 

You do not write narrative prose. You do not talk to the player.

# TACTICAL SCORE RULES (0 to 100)
- 0-30: Reckless, vague, or suicidal.
- 31-70: Standard combat actions.
- 71-100: Highly tactical. Uses environment, specifies targets/body parts, manages cover.

# OUTPUT FORMAT
You must output ONLY a valid JSON object. No markdown formatting outside the JSON, no conversational text.
{
  "chain_of_thought": "Briefly analyze input and justify score.",
  "tactical_score": <number>,
  "tool_calls": [ { "name": "<tool_name>", "arguments": { "<key>": "<value>" } } ]
}

# STRICT TOOL RULES
You MUST break the player's input down into individual sequential actions.
You are STRICTLY FORBIDDEN from inventing new tools. You may ONLY use the exact tool names listed below. 
If you invent a tool like "combat_analysis" or "evaluateTactics", the system will crash.

AVAILABLE TOOLS:
- takeCover
- attackTarget (requires "target_id", "body_part")
- lootContainer (requires "container_id")
- hackSystem (requires "target_id")
- goToRoom (requires "direction")
- useItem (requires "item_name")
`;

export async function inferMaestroTurn(
  gameStateContext: string,
  playerInput: string,
): Promise<MaestroResponse> {
  const payload = {
    model: 'phi-4-mini-reasoning',
    messages: [
      { role: 'system', content: MAESTRO_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `[CURRENT STATE]\n${gameStateContext}\n\n[PLAYER INPUT]\n"${playerInput}"`,
      },
    ],
    temperature: 0.1,
    stream: false,
    // --- MUDANÇA AQUI: Usando o Schema explícito (Structured Outputs) ---
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'maestro_decision',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            chain_of_thought: { type: 'string' },
            tactical_score: { type: 'number' },
            tool_calls: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  arguments: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
                required: ['name', 'arguments'],
              },
            },
          },
          required: ['chain_of_thought', 'tactical_score', 'tool_calls'],
          additionalProperties: false,
        },
      },
    },
  };

  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // --- MUDANÇA AQUI: Capturando a fofoca inteira do LM Studio ---
    const errorDetail = await response.text();
    throw new Error(
      `LM Studio API Error (Maestro): Status ${response.status} - Detalhes: ${errorDetail}`,
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices[0]?.message.content ?? '';

  try {
    return JSON.parse(content) as MaestroResponse;
  } catch (error) {
    console.error('Failed to parse Maestro JSON:', content);
    throw new Error('Maestro failed to return valid JSON.', {
      cause: error,
    });
  }
}
