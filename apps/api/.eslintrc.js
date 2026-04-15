module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // Zero tolerance for `any`
    '@typescript-eslint/no-explicit-any':         'error',
    '@typescript-eslint/no-unsafe-assignment':    'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call':          'error',
    '@typescript-eslint/no-unsafe-return':        'error',

    // Require exhaustive checks
    '@typescript-eslint/switch-exhaustiveness-check': 'error',

    // No floating promises (must await or catch)
    '@typescript-eslint/no-floating-promises':    'error',
    '@typescript-eslint/no-misused-promises':     'error',

    // Style
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'no-console':                                 ['warn', { allow: ['error', 'warn'] }],

    // Allow underscore-prefixed unused vars
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern:            '^_',
      varsIgnorePattern:            '^_',
      destructuredArrayIgnorePattern: '^_',
    }],
  },
  ignorePatterns: ['dist', 'node_modules', '*.test.ts', '*.js'],
}
