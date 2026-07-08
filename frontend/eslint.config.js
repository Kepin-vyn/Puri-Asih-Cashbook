import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.vite']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // ── Error Prevention ──────────────────────────────────────────────
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',

      // ── Code Quality ──────────────────────────────────────────────────
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'no-nested-ternary': 'off',   // JSX sering butuh nested ternary untuk rendering kondisional

      // ── React Specific ────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],

      // ── Import / Module ───────────────────────────────────────────────
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['../../../*'],
          message: 'Hindari import lebih dari 2 level ke atas. Gunakan path alias.',
        }],
      }],
    },
  },
])
