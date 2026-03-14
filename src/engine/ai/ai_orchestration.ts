import type { ToolCall, TurnState } from '@app-types/game_state.types.js';

// ==========================================
// TASK 3: AI ORCHESTRATION - MAESTRO PARSER & CONTEXT WINDOW
// ==========================================

/**
 * Valid tool names that the Maestro AI can return.
 * This acts as the source of truth for tool validation.
 */
export const VALID_TOOL_NAMES = [
  'attackTarget',
  'takeCover',
  'lootContainer',
  'hackSystem',
  'goToRoom',
  'useItem',
] as const;

export type ValidToolName = (typeof VALID_TOOL_NAMES)[number];

/**
 * Required arguments for each tool.
 * Used for validation and sanitization.
 */
export const TOOL_ARGUMENTS: Record<ValidToolName, string[]> = {
  attackTarget: ['target_id', 'body_part'],
  takeCover: [],
  lootContainer: ['container_id'],
  hackSystem: ['target_id'],
  goToRoom: ['direction'],
  useItem: ['item_name'],
} as const;

/**
 * Sanitizes and validates tool calls from the Maestro AI.
 *
 * TASK 3 Requirements:
 * - Uses TypeScript types to validate if generated tools exist in our Enum
 * - Gracefully ignores invalid tools instead of throwing fatal errors
 * - Robust try/catch blocks for error handling
 *
 * @param toolCalls - Raw tool calls from the Maestro AI
 * @returns Sanitized tool calls with only valid tools
 */
export function sanitizeToolCalls(toolCalls: unknown[]): {
  validTools: ToolCall[];
  invalidTools: Array<{ tool: unknown; reason: string }>;
} {
  const validTools: ToolCall[] = [];
  const invalidTools: Array<{ tool: unknown; reason: string }> = [];

  try {
    if (!Array.isArray(toolCalls)) {
      invalidTools.push({ tool: toolCalls, reason: 'Input is not an array' });
      return { validTools, invalidTools };
    }

    for (const toolCall of toolCalls) {
      try {
        // Validate structure
        if (!toolCall || typeof toolCall !== 'object') {
          invalidTools.push({ tool: toolCall, reason: 'Tool call is not an object' });
          continue;
        }

        const tool = toolCall as Record<string, unknown>;

        // Validate name exists and is a string
        if (!('name' in tool) || typeof tool.name !== 'string') {
          invalidTools.push({ tool: toolCall, reason: 'Tool name is missing or not a string' });
          continue;
        }

        const toolName = tool.name;

        // Validate name is in our valid tools enum
        if (!VALID_TOOL_NAMES.includes(toolName as ValidToolName)) {
          invalidTools.push({
            tool: toolCall,
            reason: `Invalid tool name: "${toolName}". Must be one of: ${VALID_TOOL_NAMES.join(', ')}`,
          });
          continue;
        }

        // Validate arguments exists and is an object
        if (
          !('arguments' in tool) ||
          typeof tool.arguments !== 'object' ||
          tool.arguments === null
        ) {
          invalidTools.push({
            tool: toolCall,
            reason: 'Tool arguments are missing or not an object',
          });
          continue;
        }

        const args = tool.arguments as Record<string, unknown>;

        // Validate required arguments for this tool
        const validToolName = toolName as ValidToolName;
        const requiredArgs = TOOL_ARGUMENTS[validToolName] ?? [];

        const missingArgs = requiredArgs.filter(arg => !(arg in args));
        if (missingArgs.length > 0) {
          invalidTools.push({
            tool: toolCall,
            reason: `Missing required arguments: ${missingArgs.join(', ')}`,
          });
          continue;
        }

        // All validations passed - add to valid tools
        validTools.push({
          name: validToolName,
          arguments: args,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        invalidTools.push({
          tool: toolCall,
          reason: `Validation error: ${errorMessage}`,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sanitizeToolCalls] Fatal error:', errorMessage);
    invalidTools.push({
      tool: toolCalls,
      reason: `Fatal validation error: ${errorMessage}`,
    });
  }

  return { validTools, invalidTools };
}

/**
 * Filters turn history to maintain only the last N entries for the context window.
 *
 * TASK 3 Requirements:
 * - Keeps only the last 3 entries in the array before sending to the Narrator prompt
 * - Preserves the most recent context for AI coherence
 *
 * @param turnHistory - Full turn history array
 * @param windowSize - Number of recent turns to keep (default: 3)
 * @returns Filtered array with only recent turns
 */
export function filterTurnHistory(turnHistory: TurnState[], windowSize: number = 3): TurnState[] {
  try {
    if (!Array.isArray(turnHistory)) {
      console.warn('[filterTurnHistory] Input is not an array, returning empty array');
      return [];
    }

    if (windowSize <= 0) {
      console.warn('[filterTurnHistory] Window size must be positive, returning empty array');
      return [];
    }

    // Return the last N entries
    return turnHistory.slice(-windowSize);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[filterTurnHistory] Error filtering history:', errorMessage);
    return [];
  }
}

/**
 * Formats the context window for AI consumption.
 * Creates a concise summary of recent turns for the prompt.
 *
 * @param recentTurns - Filtered turn history from filterTurnHistory
 * @returns Formatted string for AI prompt
 */
export function formatContextWindow(recentTurns: TurnState[]): string {
  try {
    if (!Array.isArray(recentTurns) || recentTurns.length === 0) {
      return '[No previous turn history available]';
    }

    const contextParts: string[] = [];

    for (const turn of recentTurns) {
      const turnSummary = formatTurnSummary(turn);
      contextParts.push(turnSummary);
    }

    return contextParts.join('\n\n---\n\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[formatContextWindow] Error formatting context:', errorMessage);
    return '[Error formatting context window]';
  }
}

/**
 * Formats a single turn into a concise summary for the context window.
 */
function formatTurnSummary(turn: TurnState): string {
  const parts: string[] = [];

  // Turn number
  parts.push(`[Turn ${turn.turn_number}]`);

  // State changes
  const o2Before = turn.state_before.active_shell.current_oxygen_percentage;
  const o2After = turn.state_after.active_shell.current_oxygen_percentage;
  parts.push(`O2: ${o2Before}% -> ${o2After}%`);

  // Combat results
  if (turn.turn_metrics.hit_results.length > 0) {
    const combatSummary = turn.turn_metrics.hit_results
      .map(hit => {
        const status = hit.does_it_hit ? 'HIT' : 'MISS';
        return `${hit.attacker_id} -> ${hit.target_id}: ${status} (${hit.hit_chance}% chance)`;
      })
      .join('; ');
    parts.push(`Combat: ${combatSummary}`);
  }

  // Timeline summary
  const actions = turn.timeline
    .filter(entry => entry.tool_calls && entry.tool_calls.length > 0)
    .map(entry => entry.tool_calls?.map(tc => tc.name).join(', '))
    .filter(Boolean)
    .join(', ');

  if (actions) {
    parts.push(`Actions: ${actions}`);
  }

  return parts.join(' | ');
}

/**
 * Validates a complete Maestro response structure.
 *
 * @param response - Raw response from Maestro AI
 * @returns Validation result with parsed data or error
 */
export function validateMaestroResponse(response: unknown): {
  isValid: boolean;
  data?: {
    chain_of_thought: string;
    tactical_score: number;
    tool_calls: ToolCall[];
  };
  error?: string;
} {
  try {
    if (!response || typeof response !== 'object') {
      return {
        isValid: false,
        error: 'Response is not an object',
      };
    }

    const resp = response as Record<string, unknown>;

    // Validate chain_of_thought
    if (!('chain_of_thought' in resp) || typeof resp.chain_of_thought !== 'string') {
      return {
        isValid: false,
        error: 'Missing or invalid chain_of_thought',
      };
    }

    // Validate tactical_score
    if (!('tactical_score' in resp) || typeof resp.tactical_score !== 'number') {
      return {
        isValid: false,
        error: 'Missing or invalid tactical_score',
      };
    }

    const tacticalScore = resp.tactical_score;
    if (tacticalScore < 0 || tacticalScore > 100) {
      return {
        isValid: false,
        error: 'tactical_score must be between 0 and 100',
      };
    }

    // Validate tool_calls
    if (!('tool_calls' in resp) || !Array.isArray(resp.tool_calls)) {
      return {
        isValid: false,
        error: 'Missing or invalid tool_calls array',
      };
    }

    const { validTools, invalidTools } = sanitizeToolCalls(resp.tool_calls);

    if (validTools.length === 0 && invalidTools.length > 0) {
      return {
        isValid: false,
        error: `All tool calls were invalid: ${invalidTools.map(t => t.reason).join('; ')}`,
      };
    }

    if (invalidTools.length > 0) {
      console.warn(
        '[validateMaestroResponse] Some tools were ignored:',
        invalidTools.map(t => t.reason).join('; '),
      );
    }

    return {
      isValid: true,
      data: {
        chain_of_thought: resp.chain_of_thought,
        tactical_score: tacticalScore,
        tool_calls: validTools,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      error: `Validation error: ${errorMessage}`,
    };
  }
}

/**
 * Builds the complete prompt for the Narrator AI.
 *
 * @param playerInput - Original player input
 * @param engineLogs - Logs from the engine resolution
 * @param contextWindow - Formatted context from recent turns
 * @returns Complete prompt string for Narrator
 */
export function buildNarratorPrompt(
  playerInput: string,
  engineLogs: string,
  contextWindow: string,
): string {
  return `
[CONTEXT - Recent Turn History]
${contextWindow}

[PLAYER INPUT]
${playerInput}

[ENGINE LOGS]
${engineLogs}

---

Your task is to write a compelling narrative description of this turn's events.
Consider the tactical context, the outcome of actions, and the current state of the runner.
Write in a gritty, cyberpunk style that matches the PULSE_RUNNER universe.
`.trim();
}

/**
 * Builds the complete prompt for the Maestro AI.
 *
 * @param gameStateContext - Current game state summary
 * @param playerInput - Player's natural language input
 * @param contextWindow - Formatted context from recent turns
 * @returns Complete prompt string for Maestro
 */
export function buildMaestroPrompt(
  gameStateContext: string,
  playerInput: string,
  contextWindow: string,
): string {
  return `
[CONTEXT - Recent Turn History]
${contextWindow}

[CURRENT GAME STATE]
${gameStateContext}

[PLAYER INPUT]
"${playerInput}"

---

Analyze the player's input and determine the tactical approach.
Output a valid JSON response with chain_of_thought, tactical_score (0-100), and tool_calls.
`.trim();
}
