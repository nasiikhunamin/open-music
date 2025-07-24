module.exports = {
  env: {
    commonjs: false,
    es2021: true,
    node: true,
  },

  extends: ['airbnb-base'],

  parserOptions: {
    ecmaVersion: 'latest',
  },

  rules: {
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'class-methods-use-this': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
