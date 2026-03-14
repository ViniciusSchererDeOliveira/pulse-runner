import type { StreamResponse } from '@app-types/ai.types.js';

const LM_STUDIO_URL = 'http://127.0.0.1:1234/v1/chat/completions';

const NARRATOR_SYSTEM_PROMPT = `
You are the Narrator for PULSE_RUNNER, a hardcore text-based extraction shooter. 
Channel the cryptic, isolating, and visceral atmospheric dread of Bungie's classic "Marathon" universe. 

Your ONLY job is to write the narrative outcome of the current turn based on the Player's Action and the absolute truth of the Engine Logs.

RULES:
1. Translate the cold Engine Logs into gripping, visceral, and gritty sci-fi prose.
2. Keep it concise (1 to 3 paragraphs). The game is fast-paced.
3. DO NOT write conversational filler like "Here is what happens:". Start the narration immediately.
4. The Engine Log is absolute. Do not invent deaths or loot that the engine did not authorize.

Tone: Dark, tactical, unforgiving. "Escape will make you God."
`;

export async function* inferNarratorOutcome(
  playerInput: string,
  engineLogs: string,
): AsyncGenerator<string, void, unknown> {
  const payload = {
    model: 'mistral-nemo-instruct-2407', // Confirme o nome exato carregado no seu LM Studio
    messages: [
      { role: 'system', content: NARRATOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `[PLAYER ACTION]\n"${playerInput}"\n\n[ENGINE LOGS]\n${engineLogs}`,
      },
    ],
    temperature: 0.7, // Mais criativo
    repetition_penalty: 1.1,
    stream: true, // Ativa o Server-Sent Events (SSE)
  };

  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error(`LM Studio API Error (Narrator): ${response.statusText}`);
  }

  // Lógica nativa para ler Streams HTTP no Node/Browser
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        // O padrão SSE da OpenAI manda os dados com o prefixo 'data: '
        if (line === 'data: [DONE]') return;

        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6); // Remove o 'data: '
          try {
            const parsed = JSON.parse(dataStr) as StreamResponse;
            const token = parsed.choices[0]?.delta?.content;
            if (token) {
              yield token; // "Cospe" a palavra para quem chamou a função
            }
          } catch {
            // Ignora JSONs malformados no meio do stream (comum em quebras de rede)
          }
        }
      }
    }
  }
}
