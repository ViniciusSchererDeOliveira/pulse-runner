import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    // 1. Ignorar pastas irrelevantes (substitui o antigo .eslintignore)
    { ignores: ['dist/**', 'node_modules/**', '.idea/**'] },

    // 2. Regras base recomendadas do ESLint e TypeScript
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    // 3. Desliga qualquer regra do ESLint que conflite com o Prettier
    prettierConfig,

    // 4. Configuração específica do seu projeto
    {
        languageOptions: {
            // Reconhece variáveis globais do Node (ex: process.env, Buffer)
            globals: globals.node,
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mjs', 'vitest.config.ts'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Como você trabalha com uma abordagem mais imutável, o const é seu melhor amigo:
            'prefer-const': 'error',

            // Permite ignorar variáveis não usadas se começarem com underline (ex: _req)
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

            // Se você prefere deixar o TS inferir o retorno de algumas funções em vez de tipar tudo manualmente:
            '@typescript-eslint/explicit-function-return-type': 'off'
        },
    }
);