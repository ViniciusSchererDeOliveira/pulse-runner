# Padrões de Desenvolvimento e Commits

Este documento define as diretrizes de código e controle de versão para o projeto. Como este é um repositório focado em arquitetura limpa em TypeScript, a consistência no histórico do Git é fundamental.

## 📌 Padrão de Commits (Conventional Commits)

Todos os commits devem seguir a especificação do [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Isso facilita a leitura do histórico e a identificação rápida de onde um bug foi introduzido ou uma feature adicionada.

### Estrutura do Commit

```text
<tipo>[escopo opcional]: <descrição curta>

[corpo opcional explicando o porquê da mudança]
```

### Tipos Permitidos (`<tipo>`)

- **feat**: Uma nova funcionalidade para o jogo (ex: mecânica de degradação, nova rota na API do Ollama).
- **fix**: Correção de um bug (ex: erro no parse do Zod, loop infinito no mapa).
- **refactor**: Mudança no código que não corrige bug nem adiciona feature (ex: mudança na estrutura das interfaces, extração de uma função de utilidade).
- **chore**: Atualizações de tarefas de build, configurações de pacote, dependências (ex: adicionar nova lib no npm, atualizar .gitignore).
- **docs**: Alterações apenas na documentação (ex: atualizar o README).
- **style**: Formatação de código, ponto e vírgula faltando, espaços (mudanças que não afetam a lógica).
- **test**: Adição ou correção de testes.

### Exemplos Práticos no Projeto

- `feat(engine): implement linear room progression`
- `fix(ai): handle timeout from local LM Studio API`
- `refactor(types): migrate room definitions to Zod schemas`
- `chore: setup typescript and npm project structure`

## 🌿 Estrutura de Branches (Opcional)

Para manter a `main` sempre funcional (podendo rodar o jogo a qualquer momento):

1. **Desenvolva em branches separadas**: `feat/room-generator` ou `fix/parser-error`.
2. **Merge cauteloso**: Faça o merge para a `main` apenas quando a lógica estiver tipada e testada.

## 💻 Padrão de Código (TypeScript)

- **Strict Mode**: O `tsconfig.json` deve operar com `"strict": true`.
- **Interfaces vs Types**: Prefira `interface` para estruturas de dados do jogo (`Rooms`, `Items`, `Diver`) e `type` para uniões de estado ou retornos de funções.
- **Validação de I/O**: Qualquer dado vindo do LLM (Ollama) deve passar por um schema de validação (ex: Zod) antes de tocar no estado interno do jogo.
