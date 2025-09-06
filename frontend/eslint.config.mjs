import path from 'node:path';

import {includeIgnoreFile} from '@eslint/compat';
import js from '@eslint/js';
import {configs} from 'eslint-config-airbnb-extended/legacy';
import {rules as prettierConfigRules} from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

const gitignorePath = path.resolve('.', '.gitignore');

const jsConfig = [
  // ESLint Recommended Rules
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
];

const reactConfig = [
  // Airbnb React Recommended Config
  ...configs.react.recommended,
];

const typescriptConfig = [
  // Airbnb React TypeScript Config
  ...configs.react.typescript,
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
      // Disable React in scope rule.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Allow .tsx file extensions in imports
      'import/extensions': 'off',
    },
  },
];

export default [
  // Ignore .gitignore files/folder in eslint
  includeIgnoreFile(gitignorePath),
  // Javascript Config
  ...jsConfig,
  // React Config
  ...reactConfig,
  // TypeScript Config
  ...typescriptConfig,
  // Prettier Config
  ...prettierConfig,
  // Custom Rules
  ...customRules,
];
