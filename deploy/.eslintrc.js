module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript specific rules following SENTRA project standards
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    // '@typescript-eslint/prefer-readonly-parameter-types': 'warn', // requires type info
    // '@typescript-eslint/strict-boolean-expressions': 'error', // requires type info
    // '@typescript-eslint/no-unnecessary-type-assertion': 'error', // requires type info
    // Disabled TypeScript rules requiring type information
    // '@typescript-eslint/no-unsafe-assignment': 'error',
    // '@typescript-eslint/no-unsafe-call': 'error',
    // '@typescript-eslint/no-unsafe-member-access': 'error',
    // '@typescript-eslint/no-unsafe-return': 'error',
    // '@typescript-eslint/restrict-template-expressions': 'error',
    // '@typescript-eslint/prefer-nullish-coalescing': 'error', // requires type info
    '@typescript-eslint/prefer-optional-chain': 'error',

    // Import rules for monorepo
    'import/no-unresolved': 'off', // TypeScript handles this
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // General rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '*.d.ts',
    'services/', // Ignore existing Python services
  ],
};