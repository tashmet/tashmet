module.exports =  {
  parser: '@typescript-eslint/parser',
  extends:  [
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2019,
    project: './tsconfig.json',
    sourceType: 'module',
    tsconfigRootDir: '.'
  },
  env: {
    es6: true
  },
  rules:  {
    '@typescript-eslint/no-explicit-any': 'off',
  },
  settings:  {},
};