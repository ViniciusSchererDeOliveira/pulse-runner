import { inferMaestroTurn } from '@ai/maestro_model.inference.js';
import { inferNarratorOutcome } from '@ai/narrator_model.inference.js';
import * as fs from 'node:fs';
import path from 'node:path';

// --- 1. MOCKS DE ENTRADA ---
const mockGameState = `Room Category: HALLWAY
Available Cover: LIGHT
Active Enemies: [{"id": "traxus_guard_01", "type": "NPC"}]
Containers: [{"id": "medical_cache_A", "locked_status": "UNLOCKED"}]
Player O2: 85%`;

const mockPlayerInput =
  "I quickly slide behind the metal crates in the hallway to avoid incoming fire, then peek out to take a calculated shot right at the Traxus guard's torso. After he drops, I'll grab whatever is inside that medical cache.";

// Como a Engine TS ainda não está pronta, vamos simular o que ela logaria
// após processar o JSON perfeito do Maestro:
const mockEngineLogs = `- Action: takeCover() -> Success. Player is in LIGHT cover.
- Enemy Reaction: traxus_guard_01 attacks Player -> Hit! Damage: LIGHT. Absorbed by cover. Cover durability degraded to DAMAGED.
- Action: attackTarget(traxus_guard_01, torso) -> Hit! Hit Chance: 86%. Damage: HEAVY. Enemy torso DESTROYED. Enemy status: DESTROYED.
- Action: lootContainer(medical_cache_A) -> Success. Acquired: 1x Synthetic Med-Patch.
- Status: Player O2 at 85%. No leaks.`;

async function runInferenceTest() {
  console.log('\n🚀 Iniciando Teste de Inferência Multi-Agent (PULSE_RUNNER)...\n');

  // Variável para acumular todo o texto do log
  let logFileContent = `--- INFERENCE TEST LOG ---\nData: ${new Date().toISOString()}\n\n`;
  logFileContent += `=== [STATE & INPUT] ===\n${mockGameState}\n\n[INPUT]: "${mockPlayerInput}"\n\n`;

  try {
    // --- PASSO 2: TESTAR O MAESTRO (PHI-4 MINI) ---
    console.log('🧠 1. Chamando Maestro (Aguardando JSON)...\n');
    const startMaestroTime = performance.now();

    const maestroResponse = await inferMaestroTurn(mockGameState, mockPlayerInput);

    const endMaestroTime = performance.now();
    const maestroJsonString = JSON.stringify(maestroResponse, null, 2);

    console.log('\x1b[36m%s\x1b[0m', maestroJsonString); // Printa em Ciano no terminal
    console.log(`\n⏱️  Maestro resolveu em ${Math.round(endMaestroTime - startMaestroTime)}ms\n`);

    logFileContent += `=== [MAESTRO RESPONSE] ===\n${maestroJsonString}\n\n`;
    logFileContent += `=== [ENGINE LOGS MOCKED] ===\n${mockEngineLogs}\n\n`;

    // --- PASSO 3: TESTAR O NARRADOR (MISTRAL NEMO STREAM) ---
    console.log('✍️  2. Chamando Narrador (Iniciando Stream)...\n');
    logFileContent += `=== [NARRATOR RESPONSE] ===\n`;

    const startNarratorTime = performance.now();
    const narratorStream = inferNarratorOutcome(mockPlayerInput, mockEngineLogs);

    // Formatação de cor verde para a narrativa no terminal
    process.stdout.write('\x1b[32m');

    for await (const chunk of narratorStream) {
      process.stdout.write(chunk);
      logFileContent += chunk; // Salva o chunk no arquivo final
    }

    // Reseta a cor do terminal
    process.stdout.write('\x1b[0m\n');

    const endNarratorTime = performance.now();
    console.log(
      `\n\n⏱️  Narrador finalizou em ${Math.round(endNarratorTime - startNarratorTime)}ms\n`,
    );

    // --- PASSO 4: SALVAR O ARQUIVO DE LOG ---
    console.log('💾 Salvando log da operação...');

    // Pega o diretório raiz do projeto (onde o script foi rodado)
    const rootDir = process.cwd();
    const logsDir = path.join(rootDir, 'logs', 'model-inference-tests');

    // Cria as pastas se não existirem
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Formata o nome do arquivo com a data e hora
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `test-run-${timestamp}.txt`;
    const filePath = path.join(logsDir, fileName);

    fs.writeFileSync(filePath, logFileContent, 'utf-8');

    console.log(`✅ Teste concluído com sucesso! Arquivo salvo em: ${filePath}\n`);
  } catch (error) {
    console.error('\n❌ Erro durante o teste de inferência:', error);
  }
}

// Executa o teste
runInferenceTest().catch(console.error);
