import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Base configuration
  eslint.configs.recommended,
  prettierConfig,
  
  // Global ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.angular/',
      'coverage/',
      '**/*.spec.ts',
      'karma.conf.js'
    ]
  },
  
  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      '@angular-eslint': angular,
      'prettier': prettier
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
        createDefaultProgram: true
      }
    },
    rules: {
      // Angular rules
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase'
        }
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case'
        }
      ],
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      
      // TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': 'error',
      
      // Prettier integration
      'prettier/prettier': ['error', {
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 120,
        tabWidth: 2,
        semi: true,
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'auto'
      }]
    }
  },
  
  // HTML template files configuration
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplate
    },
    languageOptions: {
      parser: angularTemplateParser
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }]
    }
  }
);