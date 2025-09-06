import path from 'node:path';

import {includeIgnoreFile} from '@eslint/compat';
import js from '@eslint/js';
import {configs} from 'eslint-config-airbnb-extended/legacy';
import {rules as prettierConfigRules} from 'eslint-config-prettier';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';

const gitignorePath = path.resolve('.', '.gitignore');

const jsConfig = [
  // ESLint Recommended Rules
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  // Airbnb Base Recommended Config
  ...configs.base.recommended,
];

const typescriptConfig = [
  // Airbnb Base TypeScript Config
  ...configs.base.typescript,
];

const prettierConfig = [
  // Prettier Plugin
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  // Prettier Config
  {
    name: 'prettier/config',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': 'error',
    },
  },
];

const customRules = [
  {
    // Bypass certain outdated Airbnb checks
    name: 'custom/react-rules',
    rules: {
      // Allow console logs
      'no-console': 'off', // Allow console.log in backend
      'no-undef': 'error', // Keep this for catching actual undefined variables
    },
  },
];

const customBackendRules = [
  {
    name: 'custom/backend-rules', 
    files: ['**/*-service/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];

export default [
  // Ignore .gitignore files/folder in eslint
  includeIgnoreFile(gitignorePath),
  // Javascript Config
  ...jsConfig,
  // TypeScript Config
  ...typescriptConfig,
  // Prettier Config
  ...prettierConfig,
  // Custom Config
  ...customRules,
  // Custom Backend Config
  ...customBackendRules,
];
