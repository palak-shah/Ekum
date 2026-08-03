import globals from 'globals';
import base from './base.js';

/**
 * ESLint config for the NestJS API. Relaxes a few rules that fight with
 * decorator-based DI and enables Node globals.
 */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // NestJS DI relies on runtime type references (emitDecoratorMetadata), so
      // injected providers must stay value imports even when used only as types.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
