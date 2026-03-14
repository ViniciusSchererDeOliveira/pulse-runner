import { inferMaestroTurn } from '../ai/maestro_model.inference.js';
import { inferNarratorOutcome } from '../ai/narrator_model.inference.js';
import type { GameState, TurnState } from '../types/game_state.types.js';

/**
 * Função principal que orquestra um turno completo.
 */
export async function resolveGameCycle(
  currentState: GameState,
  playerInput: string,
): Promise<GameState> {
  const isTurnZero = currentState.turn_history.length === 0;
  const activeEnemyRunner = currentState.current_room.active_enemies.find(e => e.type === 'RUNNER');

  // --- 1. INTENT PHASE (Aguardando as IAs pensarem) ---

  // Maestro analisa a intenção do jogador
  const playerIntent = await inferMaestroTurn(formatRoomState(currentState), playerInput);

  let runnerIntent = null;
  if (activeEnemyRunner) {
    // Se houver um Runner inimigo, chamamos a IA dele (pode ser o mesmo Maestro ou um NPC_Brain)
    runnerIntent = await inferEnemyRunnerIntent(currentState, activeEnemyRunner);
  }

  // --- 2. RESOLUTION PHASE (O Motor TS assume o controle) ---

  // Criamos o novo TurnState
  const newTurn: TurnState = {
    turn_number: currentState.turn_history.length,
    state_before: structuredClone(currentState.current_snapshot),
    timeline: [],
    // ... rest of types
  };

  // ENGINE: Resolve prioridade se houver conflito
  const actionQueue = resolveActionPriority(playerIntent, runnerIntent);

  // ENGINE: Executa as ferramentas na ordem e gera os Logs
  const { updatedState, engineLogs } = executeTools(currentState, actionQueue);

  // --- 3. NARRATIVE PHASE (Aguardando a prosa) ---

  // O Narrador recebe o que aconteceu e gera o texto (Stream no terminal)
  // Passamos o input do player + os logs da engine para ele dar sentido à cena
  const narrationStream = inferNarratorOutcome(playerInput, engineLogs);

  let fullNarration = '';
  for await (const chunk of narrationStream) {
    process.stdout.write(chunk); // Exibe no terminal em tempo real
    fullNarration += chunk;
  }

  // --- 4. CONSOLIDATION PHASE ---

  // Atualiza o snapshot global e salva no histórico
  currentState.current_snapshot = updatedState;
  newTurn.state_after = updatedState;
  newTurn.timeline.push({ role: 'NARRATOR_MODEL', content: fullNarration });
  currentState.turn_history.push(newTurn);

  return currentState;
}
