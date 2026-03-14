---
name: vitest-strict-tdd
description: Guidelines for writing Vitest unit tests in PULSE_RUNNER. Use this when asked to write or fix tests.
---
# Vitest Strict TDD Guidelines

1. **Framework:** Use `vitest` exclusively. Do not import `jest`.
2. **No Shortcuts:** You are strictly forbidden from hardcoding return values in the source code just to make a test pass.
3. **Mocking Randomness:** When testing combat functions that use `Math.random()`, mock the global object locally within the test to force specific outcomes (e.g., `Math.random = () => 0.1` for a guaranteed hit). Always restore the original function in a `finally` block.
4. **Colocation:** Tests must be placed in the same directory as the file they are testing, using the `.test.ts` suffix.