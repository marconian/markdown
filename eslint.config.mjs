import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

const lintConfig = [
    {
        ignores: ['dist/**', 'coverage/**'],
    },
    js.configs.recommended,
    ...compat.config({
        extends: [
            'plugin:@typescript-eslint/recommended',
            'plugin:react/recommended',
            'plugin:react-hooks/recommended',
            'plugin:react/jsx-runtime',
            'plugin:jsx-a11y/recommended',
            'prettier',
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
            },
        },
        env: {
            browser: true,
            es2021: true,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'off',
            'no-useless-escape': 'off',
            'no-extra-boolean-cast': 'off',
        },
    }),
    {
        files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2021,
                ...globals.vitest,
            },
        },
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
    },
];

export default lintConfig;
