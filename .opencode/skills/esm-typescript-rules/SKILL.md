---
name: esm-typescript-rules
description: Strict rules for writing TypeScript in the PULSE_RUNNER ESM ecosystem. Use this whenever generating or refactoring TypeScript files.
---
# ESM & TypeScript Rules for PULSE_RUNNER

When writing or modifying TypeScript files for this project, you MUST adhere to the following ESM standards:
1. **Extensions:** ALL local imports must use the `.js` extension (e.g., `import { foo } from './foo.js'`), even though the underlying file is `.ts`.
2. **Aliases:** Use the configured `@` prefix for path aliases (e.g., `@app-types/constant.types.js`, `@engine/combat/attack.resolver.js`). NEVER use relative paths like `../../` for cross-module imports.
3. **Globals:** Do not use `__dirname` or `require`. Use `import.meta.url` if file paths are needed.
4. **Purity:** Export pure functions. Avoid classes unless strictly managing a state machine.