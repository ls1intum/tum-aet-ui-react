import js from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.{ts,tsx}'];
const testFiles = ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/test-utils.ts'];

export default tseslint.config(
  { ignores: ['dist/**', 'build/**', 'storybook-static/**', 'node_modules/**', 'scripts/consumer/app/**'] },
  { linterOptions: { reportUnusedDisableDirectives: 'error', reportUnusedInlineConfigs: 'error' } },

  js.configs.recommended,
  {
    files: sourceFiles,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },

  // React, hooks and accessibility.
  {
    files: ['**/*.tsx'],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.flatConfigs.strict,
    ],
    settings: { react: { version: 'detect' } },
    rules: {
      'react/jsx-no-leaked-render': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/self-closing-comp': 'error',
      'react/no-array-index-key': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
      'react/prop-types': 'off', // TypeScript checks the props.
      'react/button-has-type': 'error',
      'react/hook-use-state': 'error',
      'react/jsx-boolean-value': 'error',
      'react/void-dom-elements-no-children': 'error',
    },
  },

  // Imports.
  {
    files: sourceFiles,
    plugins: { 'import-x': importX },
    settings: { 'import-x/resolver-next': [createTypeScriptImportResolver()] },
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/first': 'error',
    },
  },

  // Language rules that go beyond typescript-eslint.
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-param-reassign': 'error',
      'no-nested-ternary': 'error',
      'no-else-return': 'error',
      'no-implicit-coercion': ['error', { boolean: false }],
    },
  },

  // TypeScript-only rules.
  {
    files: sourceFiles,
    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-restricted-syntax': ['error', { selector: 'TSEnumDeclaration', message: 'Use a union of string literals.' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    },
  },

  // Tests.
  {
    files: testFiles,
    extends: [vitest.configs.recommended, testingLibrary.configs['flat/react']],
    rules: {
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'expectNoA11yViolations'] }],
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/valid-title': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // The tests assert on the rendered DOM and on the class names shared with the Angular library.
      'testing-library/no-node-access': 'off',
      'testing-library/no-container': 'off',
    },
  },

  // Native browser tests share Vitest rules but not Testing Library's DOM-query rules.
  {
    files: ['tests/browser/**/*.test.tsx'],
    // Browser queries and native interactions come from vitest/browser, not Testing Library.
    extends: [vitest.configs.recommended],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
    },
  },
  {
    files: ['tests/browser/fixtures.tsx'],
    rules: {
      // Dialog's initial-focus API is intentional; this is not the DOM autoFocus attribute.
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
  // Stories.
  { extends: [storybook.configs['flat/recommended']] },
  { files: ['.storybook/**'], rules: { 'storybook/story-exports': 'off' } },

  prettier,
);
