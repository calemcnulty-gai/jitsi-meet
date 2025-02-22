module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'google',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['tsconfig.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*',
    '.eslintrc.js',
    'node_modules/**/*',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'quotes': ['error', 'single'],
    'indent': ['error', 4],
    'object-curly-spacing': ['error', 'always'],
    'max-len': ['error', { 'code': 100 }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'camelcase': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'operator-linebreak': ['error', 'before', {
      'overrides': {
        '=': 'after',
        '+=': 'after',
        '-=': 'after',
        '*=': 'after',
        '/=': 'after',
      },
    }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'implicit-arrow-linebreak': ['error', 'beside'],
    'function-paren-newline': ['error', 'multiline'],
    'object-property-newline': ['error', { 
      'allowAllPropertiesOnSameLine': true,
    }],
    'object-curly-newline': ['error', {
      'multiline': true,
      'consistent': true,
    }],
  },
};
